import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ENSEMBLE_BASE = "https://ensembledata.com/apis";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (data: any, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ensembleToken = Deno.env.get("ENSEMBLE_DATA_TOKEN");

    if (!ensembleToken) {
      return json({ error: "ENSEMBLE_DATA_TOKEN not configured" }, 500);
    }

    // Try to verify user (optional — native mobile may not have auth)
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
    const { query, period = "7", sorting = "0", country = "", region = "world" } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return json({ error: "query is required" }, 400);
    }

    const trimmedQuery = query.trim();

    // EnsembleData sorting: 0 = relevance, 1 = likes, 2 = date
    let edSorting = "0";
    if (sorting === "3" || sorting === "2") edSorting = "2";
    else if (sorting === "1") edSorting = "1";

    let edPeriod = period;
    if (!["0", "1", "7", "30", "90", "180"].includes(edPeriod)) {
      edPeriod = "7";
    }

    console.log(`EnsembleData search: query="${trimmedQuery}", period=${edPeriod}, sorting=${edSorting}`);

    /** Call EnsembleData API */
    const callEnsemble = async (path: string, params: Record<string, string>) => {
      const url = new URL(`${ENSEMBLE_BASE}${path}`);
      params.token = ensembleToken;
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      const res = await fetch(url.toString());
      if (!res.ok) {
        const text = await res.text();
        console.error(`EnsembleData error ${res.status} for ${path}:`, text);
        throw new Error(`EnsembleData error ${res.status}: ${text}`);
      }
      return await res.json();
    };

    /** Extract videos from EnsembleData response */
    const extractVideos = (data: any): any[] => {
      if (Array.isArray(data)) return data;
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
        trend_score: 0.6 * (views / hoursSince) + 0.3 * (likes / hoursSince) + 0.1 * (comments / hoursSince),
        published_at: publishedAt.toISOString(),
      };
    };

    /** Normalize TikTok video to standard format */
    const normalizeVideo = (raw: any) => {
      const v = unwrapVideo(raw);
      const rawStats = v.statistics || v.stats || {};
      const author = v.author || {};
      const videoInfo = v.video || {};

      const awemeId = v.aweme_id || v.id || "";
      const uniqueId = author.unique_id || author.uniqueId || author.search_user_name || "";
      const avatarUrl = author.avatar_thumb?.url_list?.[0] || author.avatar_larger?.url_list?.[0] || "";
      const coverUrl = videoInfo.cover?.url_list?.[0] || videoInfo.origin_cover?.url_list?.[0] || "";
      const desc = v.desc || v.caption || v.title || "";

      const stats = {
        views: rawStats.play_count ?? rawStats.views ?? v.views ?? v.playCount ?? 0,
        likes: rawStats.digg_count ?? rawStats.likes ?? v.likes ?? v.diggCount ?? 0,
        comments: rawStats.comment_count ?? rawStats.comments ?? v.comments ?? v.commentCount ?? 0,
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

    /** Normalize Instagram Reel to standard format */
    const normalizeInstagramReel = (raw: any): any | null => {
      // EnsembleData IG hashtag returns items with `node` or directly a media object
      const node = raw?.node || raw;
      if (!node) return null;

      // Only video/reel content
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
      const comments =
        node.edge_media_to_comment?.count ??
        node.comment_count ??
        0;

      const ts = node.taken_at_timestamp || node.taken_at || 0;
      const stats = { views: Number(views) || 0, likes: Number(likes) || 0, comments: Number(comments) || 0, shares: 0 };

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
        createTime: ts,
      };
    };

    /** AI: Generate hashtags + related keywords */
    const generateHashtagsAndKeywords = async (q: string) => {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) return { hashtags: [], relatedKeywords: [] };
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
                content: `Дан поисковый запрос для TikTok. Сгенерируй:
1. "hashtags": 3-5 хэштегов TikTok (без #) ТОЛЬКО на русском и казахском языках.
2. "related_keywords": 8-12 связанных поисковых слов ТОЛЬКО на русском и казахском языках.
Верни ТОЛЬКО валидный JSON: {"hashtags":["..."],"related_keywords":["..."]}`,
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
          return {
            hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.filter((t: any) => typeof t === "string").slice(0, 5) : [],
            relatedKeywords: Array.isArray(parsed.related_keywords) ? parsed.related_keywords.filter((t: any) => typeof t === "string").slice(0, 12) : [],
          };
        }
      } catch (e) {
        console.error("AI keyword generation failed:", e);
      }
      return { hashtags: [], relatedKeywords: [] };
    };

    // 1. Keyword search (5 pages) + AI hashtags in parallel
    const PAGES = 5;
    const [aiResult, ...pageResults] = await Promise.allSettled([
      generateHashtagsAndKeywords(trimmedQuery),
      ...Array.from({ length: PAGES }, (_, page) =>
        callEnsemble("/tt/keyword/search", {
          name: trimmedQuery,
          cursor: String(page * 20),
          period: edPeriod,
          sorting: edSorting,
          country,
          match_exactly: "false",
          get_author_stats: "false",
        })
      ),
    ]);

    const { hashtags = [], relatedKeywords = [] } =
      (aiResult as any).status === "fulfilled" ? (aiResult as any).value : {};

    let allRaw: any[] = [];
    for (const r of pageResults) {
      if (r.status === "fulfilled") allRaw.push(...extractVideos(r.value));
    }
    console.log(`Keyword search returned ${allRaw.length} videos`);

    // 2. Hashtag search in parallel
    if (hashtags.length > 0) {
      const hashResults = await Promise.allSettled(
        hashtags.map((tag: string) =>
          callEnsemble("/tt/hashtag/posts", { name: tag, cursor: "0" })
        )
      );
      for (const r of hashResults) {
        if (r.status === "fulfilled") {
          const vids = extractVideos(r.value);
          console.log(`Hashtag "${hashtags}" returned ${vids.length} videos`);
          allRaw.push(...vids);
        }
      }
    }

    // 3. Normalize + Deduplicate
    const seen = new Set<string>();
    const uniqueVideos: any[] = [];
    for (const raw of allRaw) {
      const v = normalizeVideo(raw);
      if (!v.aweme_id || seen.has(v.aweme_id)) continue;
      seen.add(v.aweme_id);
      uniqueVideos.push(v);
    }
    console.log(`Total unique videos: ${uniqueVideos.length}`);

    // 4. Prepare DB rows + upsert
    const now = new Date().toISOString();
    const videoRows = uniqueVideos
      .filter((v) => v.aweme_id)
      .map((v) => {
        const trends = computeTrend(v, v.stats);
        return {
          platform: "tiktok",
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

    // Upsert videos always; search_queries only if authenticated
    const upsertPromise = adminClient
      .from("videos")
      .upsert(videoRows, { onConflict: "platform,platform_video_id" })
      .select();

    const promises: Promise<any>[] = [upsertPromise];
    if (userId && userClient) {
      promises.push(
        userClient
          .from("search_queries")
          .upsert(
            { user_id: userId, query_text: trimmedQuery, last_run_at: now, total_results_saved: videoRows.length },
            { onConflict: "user_id,query_text", ignoreDuplicates: false }
          )
          .select()
          .single()
      );
    }

    const [upsertResult] = await Promise.all(promises);

    const upsertedVideos = upsertResult.data || [];

    // Log API usage
    try {
      await adminClient.from("api_usage_log").insert({
        function_name: "ensemble-search",
        action: "user_search",
        credits_used: PAGES + hashtags.length,
        metadata: { query: trimmedQuery, period: edPeriod, sorting: edSorting, results: uniqueVideos.length },
      });
    } catch (e) {
      console.error("Failed to log API usage:", e);
    }

    // Fire-and-forget: AI categorize uncategorized videos
    const uncategorized = upsertedVideos.filter((v: any) => !v.niche);
    if (uncategorized.length > 0) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        (async () => {
          try {
            const NICHE_KEYS = ["finance","marketing","business","psychology","therapy","education","mama","beauty","fitness","fashion","law","realestate","esoteric","food","home","travel","lifestyle","animals","gaming","music","tattoo","career","auto","diy","kids","ai_news","ai_art","ai_avatar","humor","other","daily_routines","morning_routine","life_hacks","minimalism","aesthetic","self_care"];
            for (let i = 0; i < uncategorized.length; i += 30) {
              const batch = uncategorized.slice(i, i + 30);
              const captions = batch.map((v: any, idx: number) => `${idx}: ${(v.caption || "").slice(0, 150)}`).join("\n");
              const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  model: "google/gemini-2.5-flash-lite",
                  messages: [
                    { role: "system", content: `Classify each video caption into ONE niche from: ${NICHE_KEYS.join(", ")}. Return JSON array: [{"idx":0,"niche":"..."},...]` },
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
                  if (typeof item.idx === "number" && batch[item.idx] && NICHE_KEYS.includes(item.niche)) {
                    await adminClient.from("videos").update({ niche: item.niche }).eq("id", batch[item.idx].id);
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

    // Return videos with DB IDs + related keywords
    const responseVideos = upsertedVideos.length > 0 ? upsertedVideos : uniqueVideos;

    return json({ videos: responseVideos, relatedKeywords });
  } catch (err) {
    console.error("ensemble-search error:", err);
    return json({ error: "Unable to process request. Please try again later." }, 500);
  }
});
