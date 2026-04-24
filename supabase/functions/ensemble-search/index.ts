import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ENSEMBLE_BASE = "https://ensembledata.com/apis";
const CACHE_TTL_HOURS = 6;
const MAX_PER_PLATFORM = 60;

type PlatformParam = "all" | "tiktok" | "instagram";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Detect SSE mode via Accept header or ?stream=1 query param.
  const url = new URL(req.url);
  const wantsStream =
    url.searchParams.get("stream") === "1" ||
    (req.headers.get("accept") || "").includes("text/event-stream");

  // Stream plumbing
  let streamController: ReadableStreamDefaultController<Uint8Array> | null = null;
  const encoder = new TextEncoder();
  const sendEvent = (event: string, data: any) => {
    if (!streamController) return;
    try {
      streamController.enqueue(
        encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
      );
    } catch (_) {
      /* stream closed */
    }
  };

  const json = (data: any, status = 200) => {
    if (wantsStream) {
      // In stream mode we always reply 200 and emit either `done` or `error` events.
      // The actual response is built via the ReadableStream below; this helper is
      // used only by the inner handler to build the final payload.
      return { __payload: data, __status: status } as any;
    }
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  };

  const runHandler = async (): Promise<any> => {
    const authHeader = req.headers.get("Authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ensembleToken = Deno.env.get("ENSEMBLE_DATA_TOKEN");

    if (!ensembleToken) {
      return json({ error: "ENSEMBLE_DATA_TOKEN not configured" }, 500);
    }

    let userId: string | null = null;
    let userClient: any = null;
    if (authHeader?.startsWith("Bearer ")) {
      userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
      if (!claimsError && claimsData?.claims) {
        userId = claimsData.claims.sub as string;
      }
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const {
      query,
      platform: platformRaw,
      period = "7",
      sorting = "0",
      country = "",
      region = "world",
    } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return json({ error: "query is required" }, 400);
    }

    // Validate platform — default to "all" for new contract; old clients omit it.
    const platform: PlatformParam =
      platformRaw === "tiktok" || platformRaw === "instagram" ? platformRaw : "all";

    const trimmedQuery = query.trim();

    // EnsembleData sorting: 0 = relevance, 1 = likes, 2 = date
    let edSorting = "0";
    if (sorting === "3" || sorting === "2") edSorting = "2";
    else if (sorting === "1") edSorting = "1";

    let edPeriod = period;
    if (!["0", "1", "7", "30", "90", "180"].includes(edPeriod)) {
      edPeriod = "7";
    }

    const cacheKey = `${trimmedQuery.toLowerCase()}__${platform}__${edPeriod}__${edSorting}`;
    console.log(
      `ensemble-search: q="${trimmedQuery}", platform=${platform}, period=${edPeriod}, sorting=${edSorting}`,
    );

    // ---- 0. Cache lookup (6h) ----
    try {
      const { data: cached } = await adminClient
        .from("search_cache")
        .select("videos, related_keywords, warnings, created_at")
        .eq("cache_key", cacheKey)
        .maybeSingle();

      if (cached?.created_at) {
        const ageH = (Date.now() - new Date(cached.created_at).getTime()) / 3_600_000;
        if (ageH < CACHE_TTL_HOURS) {
          console.log(`Cache HIT (age ${ageH.toFixed(2)}h) for ${cacheKey}`);
          return json({
            videos: cached.videos || [],
            relatedKeywords: cached.related_keywords || [],
            ...(cached.warnings?.length ? { warnings: cached.warnings } : {}),
            cached: true,
          });
        }
      }
    } catch (e) {
      console.warn("Cache lookup failed (non-fatal):", e);
    }

    /** Call EnsembleData API */
    const callEnsemble = async (path: string, params: Record<string, string>) => {
      const url = new URL(`${ENSEMBLE_BASE}${path}`);
      params.token = ensembleToken;
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      const res = await fetch(url.toString());
      if (!res.ok) {
        const text = await res.text();
        console.error(`EnsembleData error ${res.status} for ${path}:`, text);
        throw new Error(`EnsembleData ${res.status}: ${text.slice(0, 200)}`);
      }
      return await res.json();
    };

    /** Extract videos from EnsembleData response (handles many shapes) */
    const extractVideos = (data: any): any[] => {
      if (Array.isArray(data)) return data;
      // Instagram hashtag responses use top_posts/recent_posts — check FIRST
      // before falling through to generic data.posts.
      const igCombined: any[] = [];
      if (Array.isArray(data?.data?.top_posts)) igCombined.push(...data.data.top_posts);
      if (Array.isArray(data?.data?.recent_posts)) igCombined.push(...data.data.recent_posts);
      if (Array.isArray(data?.data?.recent?.posts)) igCombined.push(...data.data.recent.posts);
      if (Array.isArray(data?.top_posts)) igCombined.push(...data.top_posts);
      if (Array.isArray(data?.recent_posts)) igCombined.push(...data.recent_posts);
      if (igCombined.length > 0) return igCombined;

      if (data?.data?.data && Array.isArray(data.data.data)) return data.data.data;
      if (Array.isArray(data?.data)) return data.data;
      if (data?.data?.posts && Array.isArray(data.data.posts)) return data.data.posts;
      if (Array.isArray(data?.data?.aweme_list)) return data.data.aweme_list;
      if (Array.isArray(data?.data?.videos)) return data.data.videos;
      if (Array.isArray(data?.items)) return data.items;
      if (Array.isArray(data?.videos)) return data.videos;
      return [];
    };

    const unwrapVideo = (item: any) => item.aweme_info || item.itemInfos || item;

    const getPublishedAt = (video: any): string => {
      const ct = video.create_time || video.createTime;
      if (ct) {
        const ms = typeof ct === "number" ? (ct > 1e12 ? ct : ct * 1000) : 0;
        if (ms > 0) return new Date(ms).toISOString();
      }
      return new Date().toISOString();
    };

    const computeTrend = (v: any, stats: any) => {
      const publishedAt = new Date(getPublishedAt(v));
      const hoursSince = Math.max(1, (Date.now() - publishedAt.getTime()) / 3600000);
      const views = stats.views || 0;
      const likes = stats.likes || 0;
      const comments = stats.comments || 0;
      return {
        velocity_views: views / hoursSince,
        velocity_likes: likes / hoursSince,
        velocity_comments: comments / hoursSince,
        trend_score:
          0.6 * (views / hoursSince) +
          0.3 * (likes / hoursSince) +
          0.1 * (comments / hoursSince),
        published_at: publishedAt.toISOString(),
      };
    };

    /** Normalize TikTok video */
    const normalizeTikTok = (raw: any) => {
      const v = unwrapVideo(raw);
      const rawStats = v.statistics || v.stats || {};
      const author = v.author || {};
      const videoInfo = v.video || {};

      const awemeId = v.aweme_id || v.id || "";
      const uniqueId = author.unique_id || author.uniqueId || author.search_user_name || "";
      const avatarUrl =
        author.avatar_thumb?.url_list?.[0] || author.avatar_larger?.url_list?.[0] || "";
      const coverUrl =
        videoInfo.cover?.url_list?.[0] || videoInfo.origin_cover?.url_list?.[0] || "";
      const desc = v.desc || v.caption || v.title || "";

      const stats = {
        views: rawStats.play_count ?? rawStats.views ?? v.views ?? v.playCount ?? 0,
        likes: rawStats.digg_count ?? rawStats.likes ?? v.likes ?? v.diggCount ?? 0,
        comments:
          rawStats.comment_count ?? rawStats.comments ?? v.comments ?? v.commentCount ?? 0,
        shares: rawStats.share_count ?? rawStats.shares ?? v.shares ?? v.shareCount ?? 0,
      };

      return {
        platform: "tiktok",
        aweme_id: awemeId,
        platform_video_id: String(awemeId),
        caption: desc,
        url: `https://www.tiktok.com/@${uniqueId || "user"}/video/${awemeId}`,
        cover_url: coverUrl,
        author_username: uniqueId,
        author_display_name: author.nickname || "",
        author_avatar_url: avatarUrl,
        duration: videoInfo.duration ? Math.round(videoInfo.duration / 1000) : 0,
        stats,
        ...stats,
        createTime: v.create_time || v.createTime || 0,
      };
    };

    /** Normalize Instagram Reel */
    const normalizeInstagramReel = (raw: any): any | null => {
      const node = raw?.node || raw;
      if (!node) return null;

      const isVideo =
        node.is_video === true ||
        node.media_type === 2 ||
        node.product_type === "clips" ||
        !!node.video_url ||
        !!node.video_versions;
      if (!isVideo) return null;

      const shortcode = node.shortcode || node.code || node.pk || node.id || "";
      const id = String(node.pk || node.id || shortcode || "");
      if (!id) return null;

      const owner = node.owner || node.user || {};
      const username = owner.username || node.username || "";
      const avatar = owner.profile_pic_url || node.profile_pic_url || "";
      const cover =
        node.display_url ||
        node.thumbnail_src ||
        node.image_versions2?.candidates?.[0]?.url ||
        node.thumbnail_url ||
        "";
      const caption =
        node.caption?.text ||
        node.edge_media_to_caption?.edges?.[0]?.node?.text ||
        node.title ||
        "";

      const views =
        node.video_view_count ??
        node.play_count ??
        node.view_count ??
        node.ig_play_count ??
        0;
      const likes =
        node.edge_liked_by?.count ??
        node.edge_media_preview_like?.count ??
        node.like_count ??
        0;
      const comments = node.edge_media_to_comment?.count ?? node.comment_count ?? 0;

      const ts = node.taken_at_timestamp || node.taken_at || 0;
      let viewsNum = Number(views) || 0;
      const likesNum = Number(likes) || 0;
      // IG sometimes returns 0 views — fallback estimate from likes.
      if (viewsNum === 0 && likesNum > 0) {
        viewsNum = likesNum * 8;
      }
      const stats = {
        views: viewsNum,
        likes: likesNum,
        comments: Number(comments) || 0,
        shares: 0,
      };

      const createTimeSec = typeof ts === "number" && ts > 0 ? ts : 0;

      return {
        platform: "instagram",
        aweme_id: `ig_${id}`,
        platform_video_id: `ig_${id}`,
        caption,
        url: shortcode ? `https://www.instagram.com/reel/${shortcode}/` : "",
        cover_url: cover,
        author_username: username,
        author_display_name: owner.full_name || node.full_name || "",
        author_avatar_url: avatar,
        duration: Math.round(node.video_duration || 0),
        stats,
        ...stats,
        createTime: createTimeSec,
      };
    };

    /** AI: hashtags + related keywords */
    const generateHashtagsAndKeywords = async (q: string) => {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY)
        return { hashtags: [], instagramHashtags: [], relatedKeywords: [] };
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: `Дан поисковый запрос для соцсетей. Сгенерируй JSON:
1. "hashtags": 3-5 хэштегов TikTok (без #) ТОЛЬКО на русском и казахском языках.
2. "instagram_hashtags": 5-8 популярных хэштегов Instagram (без #), СЛИТНО написанных, ЛАТИНИЦЕЙ (английский язык), без пробелов и спецсимволов.
3. "related_keywords": 8-12 связанных поисковых слов ТОЛЬКО на русском и казахском языках.
Верни ТОЛЬКО валидный JSON: {"hashtags":["..."],"instagram_hashtags":["..."],"related_keywords":["..."]}`,
              },
              { role: "user", content: q },
            ],
          }),
        });
        const aiData = await res.json();
        const content = aiData?.choices?.[0]?.message?.content || "";
        const match = content.match(/\{[\s\S]*?\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          const cleanTag = (t: any) =>
            typeof t === "string" ? t.replace(/[^\p{L}\p{N}_]+/gu, "").toLowerCase() : "";
          return {
            hashtags: Array.isArray(parsed.hashtags)
              ? parsed.hashtags.filter((t: any) => typeof t === "string").slice(0, 5)
              : [],
            instagramHashtags: Array.isArray(parsed.instagram_hashtags)
              ? parsed.instagram_hashtags
                  .map(cleanTag)
                  .filter((t: string) => t.length > 1)
                  .slice(0, 8)
              : [],
            relatedKeywords: Array.isArray(parsed.related_keywords)
              ? parsed.related_keywords.filter((t: any) => typeof t === "string").slice(0, 12)
              : [],
          };
        }
      } catch (e) {
        console.error("AI keyword generation failed:", e);
      }
      return { hashtags: [], instagramHashtags: [], relatedKeywords: [] };
    };

    // ---- AI hashtags first ----
    const aiData = await generateHashtagsAndKeywords(trimmedQuery).catch(() => ({
      hashtags: [],
      instagramHashtags: [],
      relatedKeywords: [],
    }));
    const { hashtags = [], instagramHashtags = [], relatedKeywords = [] } = aiData;

    // ===== TikTok pipeline =====
    const runTikTokPipeline = async (): Promise<any[]> => {
      const PAGES = 5;
      const pageResults = await Promise.allSettled(
        Array.from({ length: PAGES }, (_, page) =>
          callEnsemble("/tt/keyword/search", {
            name: trimmedQuery,
            cursor: String(page * 20),
            period: edPeriod,
            sorting: edSorting,
            country,
            match_exactly: "false",
            get_author_stats: "false",
          }),
        ),
      );

      const raw: any[] = [];
      for (const r of pageResults) {
        if (r.status === "fulfilled") raw.push(...extractVideos(r.value));
      }
      console.log(`TikTok keyword search: ${raw.length} raw items`);

      if (hashtags.length > 0) {
        const tagResults = await Promise.allSettled(
          hashtags.map((tag: string) =>
            callEnsemble("/tt/hashtag/posts", { name: tag, cursor: "0" }),
          ),
        );
        for (const r of tagResults) {
          if (r.status === "fulfilled") raw.push(...extractVideos(r.value));
        }
      }

      // Normalize + dedupe within TT
      const seen = new Set<string>();
      const out: any[] = [];
      for (const item of raw) {
        const v = normalizeTikTok(item);
        if (!v.aweme_id || seen.has(v.aweme_id)) continue;
        seen.add(v.aweme_id);
        out.push(v);
      }
      return out;
    };

    // ===== Instagram pipeline =====
    const runInstagramPipeline = async (): Promise<any[]> => {
      const igTagFromQuery = trimmedQuery.replace(/[^\p{L}\p{N}_]+/gu, "").toLowerCase();
      const igTagList: string[] = Array.from(
        new Set(
          [igTagFromQuery, ...instagramHashtags]
            .map((t: string) => (t || "").replace(/[^\p{L}\p{N}_]+/gu, "").toLowerCase())
            .filter((t: string) => t && t.length > 1),
        ),
      ).slice(0, 6);

      console.log(`Instagram hashtag fan-out: [${igTagList.join(", ")}]`);

      if (igTagList.length === 0) return [];

      const tagResults = await Promise.allSettled(
        igTagList.map((tag) => callEnsemble("/instagram/hashtag/posts", { name: tag })),
      );

      const raw: any[] = [];
      for (const r of tagResults) {
        if (r.status === "fulfilled") raw.push(...extractVideos(r.value));
      }
      console.log(`Instagram hashtag posts: ${raw.length} raw items`);

      const seen = new Set<string>();
      const out: any[] = [];
      for (const item of raw) {
        const v = normalizeInstagramReel(item);
        if (!v || !v.aweme_id || seen.has(v.aweme_id)) continue;
        seen.add(v.aweme_id);
        out.push(v);
      }
      return out;
    };

    // ===== Run platforms in parallel based on `platform` param =====
    const warnings: string[] = [];
    const ttPromise =
      platform === "instagram" ? Promise.resolve([] as any[]) : runTikTokPipeline();
    const igPromise =
      platform === "tiktok" ? Promise.resolve([] as any[]) : runInstagramPipeline();

    const [ttSettled, igSettled] = await Promise.allSettled([ttPromise, igPromise]);

    let ttVideos: any[] = [];
    let igVideos: any[] = [];

    if (ttSettled.status === "fulfilled") {
      ttVideos = ttSettled.value;
    } else if (platform !== "instagram") {
      console.error("TikTok pipeline failed:", ttSettled.reason);
      warnings.push("TikTok временно недоступен");
    }

    if (igSettled.status === "fulfilled") {
      igVideos = igSettled.value;
    } else if (platform !== "tiktok") {
      console.error("Instagram pipeline failed:", igSettled.reason);
      warnings.push("Instagram временно недоступен");
    }

    // Cap per-platform → MAX_PER_PLATFORM, sorted by views DESC
    const sortByViews = (a: any, b: any) => (Number(b.views) || 0) - (Number(a.views) || 0);
    ttVideos.sort(sortByViews);
    igVideos.sort(sortByViews);
    ttVideos = ttVideos.slice(0, MAX_PER_PLATFORM);
    igVideos = igVideos.slice(0, MAX_PER_PLATFORM);

    const uniqueVideos = [...ttVideos, ...igVideos].sort(sortByViews);
    console.log(
      `Total: ${uniqueVideos.length} (TT=${ttVideos.length}, IG=${igVideos.length}), warnings=[${warnings.join("|")}]`,
    );

    if (uniqueVideos.length === 0) {
      return json(
        {
          error: "Не найдено результатов. Попробуйте другой запрос.",
          ...(warnings.length ? { warnings } : {}),
        },
        warnings.length ? 503 : 200,
      );
    }

    // ---- Upsert to videos ----
    const now = new Date().toISOString();
    const videoRows = uniqueVideos
      .filter((v) => v.aweme_id)
      .map((v) => {
        const trends = computeTrend(v, v.stats);
        return {
          platform: v.platform || "tiktok",
          platform_video_id: v.platform_video_id,
          url: v.url,
          caption: v.caption || "",
          cover_url: v.cover_url || "",
          author_username: v.author_username || "",
          author_display_name: v.author_display_name || "",
          author_avatar_url: v.author_avatar_url || "",
          views: v.views || 0,
          likes: v.likes || 0,
          comments: v.comments || 0,
          shares: v.shares || 0,
          duration_sec: v.duration || null,
          fetched_at: now,
          source_query_id: null,
          region: region || "world",
          ...trends,
        };
      });

    const { data: upsertData } = await adminClient
      .from("videos")
      .upsert(videoRows, { onConflict: "platform,platform_video_id" })
      .select();

    const upsertedVideos = upsertData || [];

    // ---- search_queries log (per-platform) ----
    if (userId && userClient) {
      try {
        await userClient
          .from("search_queries")
          .upsert(
            {
              user_id: userId,
              query_text: trimmedQuery,
              platform,
              last_run_at: now,
              total_results_saved: videoRows.length,
            },
            { onConflict: "user_id,query_text", ignoreDuplicates: false },
          );
      } catch (e) {
        console.warn("search_queries upsert failed (non-fatal):", e);
      }
    }

    // ---- Merge IG hashtags into related keywords (dedupe, max 12) ----
    const relatedSet = new Map<string, string>();
    const pushRelated = (s: string) => {
      const key = s.toLowerCase().trim();
      if (key && !relatedSet.has(key)) relatedSet.set(key, s);
    };
    relatedKeywords.forEach((k: string) => pushRelated(k));
    if (platform !== "tiktok") instagramHashtags.forEach((k: string) => pushRelated(k));
    const mergedRelated = Array.from(relatedSet.values()).slice(0, 12);

    // ---- API usage log ----
    try {
      await adminClient.from("api_usage_log").insert({
        function_name: "ensemble-search",
        action: "user_search",
        credits_used:
          (platform === "instagram" ? 0 : 5 + hashtags.length) +
          (platform === "tiktok" ? 0 : 6),
        metadata: {
          query: trimmedQuery,
          platform,
          period: edPeriod,
          sorting: edSorting,
          results: uniqueVideos.length,
          tt: ttVideos.length,
          ig: igVideos.length,
          warnings,
        },
      });
    } catch (e) {
      console.error("Failed to log API usage:", e);
    }

    // ---- Cache result (6h) ----
    const responseVideos = upsertedVideos.length > 0 ? upsertedVideos : uniqueVideos;
    try {
      await adminClient.from("search_cache").upsert({
        cache_key: cacheKey,
        videos: responseVideos as any,
        related_keywords: mergedRelated,
        warnings,
        created_at: now,
      });
    } catch (e) {
      console.warn("Cache upsert failed (non-fatal):", e);
    }

    // ---- Fire-and-forget: AI categorize uncategorized videos ----
    const uncategorized = upsertedVideos.filter((v: any) => !v.niche);
    if (uncategorized.length > 0) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        (async () => {
          try {
            const NICHE_KEYS = [
              "finance","marketing","business","psychology","therapy","education","mama",
              "beauty","fitness","fashion","law","realestate","esoteric","food","home",
              "travel","lifestyle","animals","gaming","music","tattoo","career","auto",
              "diy","kids","ai_news","ai_art","ai_avatar","humor","other","daily_routines",
              "morning_routine","life_hacks","minimalism","aesthetic","self_care",
            ];
            for (let i = 0; i < uncategorized.length; i += 30) {
              const batch = uncategorized.slice(i, i + 30);
              const captions = batch
                .map((v: any, idx: number) => `${idx}: ${(v.caption || "").slice(0, 150)}`)
                .join("\n");
              const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${LOVABLE_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "google/gemini-2.5-flash-lite",
                  messages: [
                    {
                      role: "system",
                      content: `Classify each video caption into ONE niche from: ${NICHE_KEYS.join(", ")}. Return JSON array: [{"idx":0,"niche":"..."},...]`,
                    },
                    { role: "user", content: captions },
                  ],
                }),
              });
              const aiData = await res.json();
              const content = aiData?.choices?.[0]?.message?.content || "";
              const match = content.match(/\[[\s\S]*?\]/);
              if (match) {
                const items = JSON.parse(match[0]);
                for (const item of items) {
                  if (
                    typeof item.idx === "number" &&
                    batch[item.idx] &&
                    NICHE_KEYS.includes(item.niche)
                  ) {
                    await adminClient
                      .from("videos")
                      .update({ niche: item.niche })
                      .eq("id", batch[item.idx].id);
                  }
                }
              }
            }
          } catch (e) {
            console.error("Categorization failed:", e);
          }
        })();
      }
    }

    return json({
      videos: responseVideos,
      relatedKeywords: mergedRelated,
      ...(warnings.length ? { warnings } : {}),
    });
  }; // end runHandler

  // Non-stream path: run handler and return its Response directly.
  if (!wantsStream) {
    try {
      return await runHandler();
    } catch (err) {
      console.error("ensemble-search error:", err);
      return new Response(
        JSON.stringify({ error: "Unable to process request. Please try again later." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  }

  // Stream path: open SSE stream, run handler, and emit events from it.
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      streamController = controller;
      // Initial hello so the client opens the stream immediately.
      sendEvent("open", { ts: Date.now() });

      runHandler()
        .then((result) => {
          if (result && result.__payload) {
            sendEvent("done", result.__payload);
          } else if (result instanceof Response) {
            // Shouldn't happen in stream mode (json() returns __payload), but handle anyway.
            result
              .clone()
              .json()
              .then((p) => sendEvent("done", p))
              .catch(() => sendEvent("done", {}));
          } else {
            sendEvent("done", result || {});
          }
        })
        .catch((err) => {
          console.error("ensemble-search stream error:", err);
          sendEvent("error", { error: "Unable to process request. Please try again later." });
        })
        .finally(() => {
          try {
            controller.close();
          } catch (_) {
            /* already closed */
          }
        });
    },
    cancel() {
      streamController = null;
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
});
