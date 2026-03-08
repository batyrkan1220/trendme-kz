import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ENSEMBLE_BASE = "https://ensembledata.com/apis";

// Sanitize user-controlled text before passing to AI prompts
const cleanForPrompt = (s: string, max = 200) =>
  String(s || '')
    .replace(/system:|assistant:|user:/gi, '')
    .replace(/ignore.*(previous|above|all)/gi, '')
    .slice(0, max);

function validateTikTokUrl(url: string): boolean {
  try {
    if (url.length > 500) return false;
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    const allowedHosts = ["tiktok.com", "www.tiktok.com", "vm.tiktok.com", "m.tiktok.com", "vt.tiktok.com", "lite.tiktok.com"];
    return allowedHosts.some(h => parsed.hostname === h || parsed.hostname.endsWith("." + h));
  } catch {
    return false;
  }
}

function validateTikTokUsername(username: string): boolean {
  if (!username || username.length > 100) return false;
  const cleaned = username.startsWith("@") ? username.slice(1) : username;
  return /^[a-zA-Z0-9_.]+$/.test(cleaned);
}

/** Resolve short TikTok URLs (vm.tiktok.com, vt.tiktok.com) to full URLs */
async function resolveShortUrl(url: string): Promise<string> {
  try {
    const parsed = new URL(url);
    if (["vm.tiktok.com", "vt.tiktok.com", "lite.tiktok.com", "m.tiktok.com"].includes(parsed.hostname)) {
      const res = await fetch(url, { method: "HEAD", redirect: "follow" });
      return res.url || url;
    }
  } catch { /* ignore */ }
  return url;
}

/** Extract aweme_id (video ID) from a TikTok URL */
function extractAwemeId(url: string): string | null {
  // https://www.tiktok.com/@user/video/1234567890
  const videoMatch = url.match(/\/video\/(\d+)/);
  if (videoMatch) return videoMatch[1];
  // https://www.tiktok.com/@user/photo/1234567890
  const photoMatch = url.match(/\/photo\/(\d+)/);
  if (photoMatch) return photoMatch[1];
  // Fallback: any long digit sequence in the URL (aweme_id is typically 19 digits)
  const digitMatch = url.match(/(\d{15,})/);
  return digitMatch ? digitMatch[1] : null;
}

/** Extract username from a TikTok profile URL */
function extractUsername(url: string): string {
  const match = url.match(/@([a-zA-Z0-9_.]+)/);
  return match ? match[1] : url.split("@").pop()?.split("?")[0]?.split("/")[0] || "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;
    const json = (data: any, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ensembleToken = Deno.env.get("ENSEMBLE_DATA_TOKEN")!;

    const authHeader = req.headers.get("authorization") || "";

    // Handle cron-safe actions before auth check
    // ========== PERSIST COVERS TO STORAGE (permanent URLs) ==========
    if (action === "persist_covers") {
      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      const batchSize = Math.min(body.limit || 30, 50);
      const offset = body.offset || 0;
      const massMode = body.mass === true;
      let logId = body.log_id || null;
      const bucketName = "video-covers";
      const publicBaseUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}`;

      // First batch: create log + get total
      if (massMode && offset === 0) {
        const { count } = await adminClient
          .from("videos")
          .select("id", { count: "exact", head: true })
          .not("cover_url", "is", null)
          .or("cover_url.not.like.%/storage/v1/%");
        const totalCount = count || 0;
        const { data: logRow } = await adminClient.from("cover_refresh_logs").insert({
          total_videos: totalCount,
          status: "running",
          triggered_by: body.triggered_by || null,
        }).select("id").single();
        logId = logRow?.id || null;
        console.log(`[persist-covers] Started. Total to process: ${totalCount}, logId: ${logId}`);
      }

      // Fetch videos with non-storage cover URLs
      const { data: vids, error: fetchErr } = await adminClient
        .from("videos")
        .select("id, url, cover_url")
        .not("cover_url", "is", null)
        .not("cover_url", "like", "%/storage/v1/%")
        .order("created_at", { ascending: true })
        .range(offset, offset + batchSize - 1);

      if (fetchErr) {
        if (logId) await adminClient.from("cover_refresh_logs").update({ status: "error", error_message: fetchErr.message, finished_at: new Date().toISOString() }).eq("id", logId);
        return json({ error: fetchErr.message }, 500);
      }

      if (!vids?.length) {
        if (logId) await adminClient.from("cover_refresh_logs").update({ status: "done", finished_at: new Date().toISOString(), current_offset: offset }).eq("id", logId);
        console.log(`[persist-covers] Done. No more videos at offset ${offset}`);
        return json({ updated: 0, failed: 0, total: 0, offset, done: true, log_id: logId });
      }

      let updated = 0;
      let failed = 0;

      for (const vid of vids) {
        try {
          // First try current cover_url, if fails try oEmbed
          let imageBlob: Blob | null = null;
          let contentType = "image/jpeg";

          // Try downloading current cover URL
          const imgRes = await fetch(vid.cover_url!, {
            headers: { "User-Agent": "Mozilla/5.0" },
          });
          if (imgRes.ok) {
            contentType = imgRes.headers.get("content-type") || "image/jpeg";
            imageBlob = await imgRes.blob();
          }

          // Fallback: try oEmbed thumbnail
          if (!imageBlob || imageBlob.size < 1000) {
            const oembedRes = await fetch(
              `https://www.tiktok.com/oembed?url=${encodeURIComponent(vid.url)}`,
              { headers: { "User-Agent": "Mozilla/5.0" } }
            );
            if (oembedRes.ok) {
              const oembedData = await oembedRes.json();
              if (oembedData.thumbnail_url) {
                const thumbRes = await fetch(oembedData.thumbnail_url, {
                  headers: { "User-Agent": "Mozilla/5.0" },
                });
                if (thumbRes.ok) {
                  contentType = thumbRes.headers.get("content-type") || "image/jpeg";
                  imageBlob = await thumbRes.blob();
                }
              }
            }
          }

          if (!imageBlob || imageBlob.size < 1000) {
            failed++;
            continue;
          }

          // Upload to storage
          const ext = contentType.includes("png") ? "png" : "jpg";
          const filePath = `${vid.id}.${ext}`;
          const arrayBuffer = await imageBlob.arrayBuffer();

          const { error: uploadErr } = await adminClient.storage
            .from(bucketName)
            .upload(filePath, arrayBuffer, {
              contentType,
              upsert: true,
            });

          if (uploadErr) {
            console.error(`[persist-covers] Upload error for ${vid.id}:`, uploadErr.message);
            failed++;
            continue;
          }

          // Update video with permanent URL
          const permanentUrl = `${publicBaseUrl}/${filePath}`;
          await adminClient.from("videos").update({ cover_url: permanentUrl }).eq("id", vid.id);
          updated++;
        } catch (e) {
          console.error(`[persist-covers] Error for ${vid.id}:`, e);
          failed++;
        }
        // Rate limit: 200ms between requests
        await new Promise(r => setTimeout(r, 200));
      }

      const nextOffset = offset + vids.length;
      console.log(`[persist-covers] Batch: offset=${offset}, updated=${updated}, failed=${failed}, next=${nextOffset}`);

      // Update log
      if (logId) {
        const { data: currentLog } = await adminClient.from("cover_refresh_logs").select("total_updated, total_failed").eq("id", logId).single();
        await adminClient.from("cover_refresh_logs").update({
          total_updated: (currentLog?.total_updated || 0) + updated,
          total_failed: (currentLog?.total_failed || 0) + failed,
          current_offset: nextOffset,
        }).eq("id", logId);
      }

      // Self-chain
      if (massMode && vids.length === batchSize) {
        const selfUrl = `${supabaseUrl}/functions/v1/socialkit`;
        fetch(selfUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            action: "persist_covers",
            mass: true,
            offset: nextOffset,
            limit: batchSize,
            log_id: logId,
          }),
        }).catch(e => console.error("[persist-covers] Self-chain error:", e));
      } else if (massMode && vids.length < batchSize && logId) {
        const { data: finalLog } = await adminClient.from("cover_refresh_logs").select("total_updated, total_failed").eq("id", logId).single();
        await adminClient.from("cover_refresh_logs").update({
          status: "done",
          finished_at: new Date().toISOString(),
          total_updated: (finalLog?.total_updated || 0) + updated,
          total_failed: (finalLog?.total_failed || 0) + failed,
          current_offset: nextOffset,
        }).eq("id", logId);
      }

      return json({ updated, failed, total: vids.length, offset, nextOffset, done: vids.length < batchSize, log_id: logId });
    }
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

    // API usage logging
    const logApiUsage = async (act: string, credits: number, metadata: Record<string, any> = {}) => {
      try {
        await adminClient.from("api_usage_log").insert({
          function_name: "socialkit",
          action: act,
          credits_used: credits,
          metadata,
        });
      } catch (e) {
        console.error("Failed to log API usage:", e);
      }
    };

    /** Call EnsembleData API */
    const callEnsemble = async (path: string, params: Record<string, string>) => {
      const url = new URL(`${ENSEMBLE_BASE}${path}`);
      params.token = ensembleToken;
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      console.log(`EnsembleData call: ${path}`, Object.keys(params).filter(k => k !== 'token').map(k => `${k}=${params[k]}`).join(', '));
      const res = await fetch(url.toString());
      if (!res.ok) {
        const text = await res.text();
        console.error(`EnsembleData error ${res.status} for ${path}:`, text);
        throw new Error(`EnsembleData error ${res.status}: ${text}`);
      }
      const data = await res.json();
      console.log(`EnsembleData ${path} response keys:`, JSON.stringify(Object.keys(data)));
      return data;
    };

    const getPublishedAt = (video: any): string => {
      const ct = video.create_time || video.createTime || video.create_time;
      if (ct) {
        const ms = typeof ct === "number" ? (ct > 1e12 ? ct : ct * 1000) : 0;
        if (ms > 0) return new Date(ms).toISOString();
      }
      if (video.created_at) return new Date(video.created_at).toISOString();
      return new Date().toISOString();
    };

    const computeTrend = (video: any) => {
      const stats = video.statistics || video.stats || {};
      const publishedAt = new Date(getPublishedAt(video));
      const hoursSince = Math.max(1, (Date.now() - publishedAt.getTime()) / 3600000);
      const views = stats.play_count ?? stats.views ?? video.views ?? video.playCount ?? 0;
      const likes = stats.digg_count ?? stats.likes ?? video.likes ?? video.diggCount ?? 0;
      const comments = stats.comment_count ?? stats.comments ?? video.comments ?? video.commentCount ?? 0;
      const vViews = views / hoursSince;
      const vLikes = likes / hoursSince;
      const vComments = comments / hoursSince;
      return {
        velocity_views: vViews,
        velocity_likes: vLikes,
        velocity_comments: vComments,
        trend_score: 0.6 * vViews + 0.3 * vLikes + 0.1 * vComments,
        published_at: publishedAt.toISOString(),
      };
    };

    /** Extract videos from EnsembleData response structures */
    const extractVideos = (data: any): any[] => {
      if (Array.isArray(data)) return data;
      // Keyword search: data.data is array of { type, aweme_info }
      if (data?.data?.data && Array.isArray(data.data.data)) return data.data.data;
      if (Array.isArray(data?.data)) return data.data;
      // Hashtag search: data.data.posts
      if (data?.data?.posts && Array.isArray(data.data.posts)) return data.data.posts;
      if (Array.isArray(data?.data?.aweme_list)) return data.data.aweme_list;
      if (Array.isArray(data?.data?.videos)) return data.data.videos;
      if (Array.isArray(data?.items)) return data.items;
      if (Array.isArray(data?.videos)) return data.videos;
      console.log("EnsembleData unexpected response:", JSON.stringify(data).slice(0, 500));
      return [];
    };

    /** Unwrap aweme_info wrapper from EnsembleData keyword search results */
    const unwrapVideo = (item: any): any => {
      return item.aweme_info || item.itemInfos || item;
    };

    /** Normalize a video object from EnsembleData to our standard format */
    const normalizeVideo = (raw: any) => {
      const v = unwrapVideo(raw);
      const stats = v.statistics || v.stats || {};
      const author = v.author || {};
      const videoInfo = v.video || {};

      const awemeId = v.aweme_id || v.id || "";
      const uniqueId = author.unique_id || author.uniqueId || author.search_user_name || "";
      const avatarUrl = author.avatar_thumb?.url_list?.[0] || author.avatar_larger?.url_list?.[0] || "";
      const coverUrl = videoInfo.cover?.url_list?.[0] || videoInfo.origin_cover?.url_list?.[0] || "";
      const desc = v.desc || v.caption || v.title || "";

      return {
        id: awemeId,
        aweme_id: awemeId,
        platform_video_id: String(awemeId),
        desc,
        caption: desc,
        createTime: v.create_time || v.createTime || 0,
        views: stats.play_count ?? stats.views ?? v.views ?? v.playCount ?? 0,
        likes: stats.digg_count ?? stats.likes ?? v.likes ?? v.diggCount ?? 0,
        comments: stats.comment_count ?? stats.comments ?? v.comments ?? v.commentCount ?? 0,
        shares: stats.share_count ?? stats.shares ?? v.shares ?? v.shareCount ?? 0,
        stats: {
          views: stats.play_count ?? stats.views ?? v.views ?? v.playCount ?? 0,
          likes: stats.digg_count ?? stats.likes ?? v.likes ?? v.diggCount ?? 0,
          comments: stats.comment_count ?? stats.comments ?? v.comments ?? v.commentCount ?? 0,
          shares: stats.share_count ?? stats.shares ?? v.shares ?? v.shareCount ?? 0,
        },
        author: {
          uniqueId,
          unique_id: uniqueId,
          nickname: author.nickname || "",
          avatar: avatarUrl,
          avatarThumb: avatarUrl,
        },
        author_username: uniqueId,
        author_display_name: author.nickname || "",
        author_avatar_url: avatarUrl,
        video: {
          cover: coverUrl,
          duration: videoInfo.duration ? Math.round(videoInfo.duration / 1000) : 0,
        },
        cover_url: coverUrl,
        duration: videoInfo.duration ? Math.round(videoInfo.duration / 1000) : 0,
        url: `https://www.tiktok.com/@${uniqueId || "user"}/video/${awemeId}`,
      };
    };

    /** Generate hashtags + related keywords from query using AI */
    const generateHashtagsAndKeywords = async (query: string): Promise<{ hashtags: string[], relatedKeywords: string[] }> => {
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
1. "hashtags": 3-5 хэштегов TikTok (без #) ТОЛЬКО на русском и казахском языках. НЕ добавляй английские слова.
2. "related_keywords": 8-12 связанных поисковых слов ТОЛЬКО на русском и казахском языках. НЕ переводи на английский. Это должны быть синонимы, бренды, действия, связанные с запросом.

Верни ТОЛЬКО валидный JSON: {"hashtags":["..."],"related_keywords":["..."]}
Пример для "пылесос": {"hashtags":["пылесос","уборка","чистота","клининг","пылесосим"],"related_keywords":["моющий","дайсон","сяоми","робот","уборка","обзор","лайфхак","квартира","порядок","чистка","генуборка","быт"]}`
              },
              { role: "user", content: query }
            ],
          }),
        });
        const aiData = await res.json();
        const content = aiData?.choices?.[0]?.message?.content || "";
        const match = content.match(/\{[\s\S]*?\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          console.log("AI generated hashtags:", parsed.hashtags, "keywords:", parsed.related_keywords);
          return {
            hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.filter((t: any) => typeof t === "string" && t.length > 0).slice(0, 5) : [],
            relatedKeywords: Array.isArray(parsed.related_keywords) ? parsed.related_keywords.filter((t: any) => typeof t === "string" && t.length > 0).slice(0, 12) : [],
          };
        }
      } catch (e) {
        console.error("Hashtag/keyword generation failed:", e);
      }
      return { hashtags: [], relatedKeywords: [] };
    };

    switch (action) {
      case "search": {
        const { query, limit = 20, region = "world" } = body;
        if (!query) return json({ error: "query is required" }, 400);

        // 1. Keyword search + AI hashtag generation in parallel
        const PAGES = 5;
        const [aiResult, ...pageResults] = await Promise.allSettled([
          generateHashtagsAndKeywords(query),
          ...Array.from({ length: PAGES }, (_, page) =>
            callEnsemble("/tt/keyword/search", {
              name: query,
              cursor: String(page * 20),
              period: "7",
              sorting: "0",
              country: "",
              match_exactly: "false",
              get_author_stats: "false",
            })
          ),
        ]);

        const { hashtags = [], relatedKeywords = [] } = (aiResult as any).status === "fulfilled" ? (aiResult as any).value : {};

        let allRawVideos: any[] = [];
        for (const r of pageResults) {
          if (r.status === "fulfilled") {
            allRawVideos.push(...extractVideos(r.value));
          }
        }
        console.log(`Keyword search returned ${allRawVideos.length} videos`);

        // 2. Search by hashtags in parallel
        if (hashtags.length > 0) {
          const hashtagResults = await Promise.allSettled(
            hashtags.map((tag: string) =>
              callEnsemble("/tt/hashtag/posts", { name: tag, cursor: "0" })
            )
          );
          for (const result of hashtagResults) {
            if (result.status === "fulfilled") {
              const vids = extractVideos(result.value);
              console.log(`Hashtag search returned ${vids.length} videos`);
              allRawVideos.push(...vids);
            }
          }
        }

        // 3. Normalize + Deduplicate
        const seen = new Set<string>();
        const uniqueVideos: any[] = [];
        for (const raw of allRawVideos) {
          const v = normalizeVideo(raw);
          if (!v.aweme_id || seen.has(v.aweme_id)) continue;
          seen.add(v.aweme_id);
          uniqueVideos.push(v);
        }
        console.log(`Total unique videos after dedup: ${uniqueVideos.length}`);

        // 4. Prepare video rows for DB
        const now = new Date().toISOString();
        const videoRows = uniqueVideos.map(v => {
          if (!v.aweme_id) return null;
          const trends = computeTrend(v);
          return {
            platform: "tiktok",
            platform_video_id: String(v.aweme_id),
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
        }).filter(Boolean);

        // 5. Batch upsert + save query in parallel
        const upsertPromise = adminClient.from("videos").upsert(videoRows, { onConflict: "platform,platform_video_id" }).select();
        const dbPromises: Promise<any>[] = [upsertPromise];
        if (userId && userClient) {
          dbPromises.push(userClient.from("search_queries").upsert(
            { user_id: userId, query_text: query, last_run_at: now, total_results_saved: videoRows.length },
            { onConflict: "user_id,query_text", ignoreDuplicates: false }
          ).select().single());
        }
        const [upsertResult] = await Promise.all(dbPromises);

        const upsertedVideos = upsertResult.data || [];

        // 6. Fire-and-forget: AI categorize uncategorized videos
        const uncategorized = upsertedVideos.filter((v: any) => !v.niche);
        if (uncategorized.length > 0) {
          const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
          if (LOVABLE_API_KEY) {
            (async () => {
              try {
                const NICHE_KEYS = ["finance","marketing","business","psychology","therapy","education","mama","beauty","fitness","fashion","law","realestate","esoteric","food","home","travel","lifestyle","animals","gaming","music","tattoo","career","auto","diy","kids","ai_news","ai_art","ai_avatar","humor","other"];
                for (let i = 0; i < uncategorized.length; i += 30) {
                  const batch = uncategorized.slice(i, i + 30);
                  const videoCaptions = batch.map((v: any, idx: number) => `${idx}: ${cleanForPrompt(v.caption, 150)}`).join("\n");
                  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
                    body: JSON.stringify({
                      model: "google/gemini-2.5-flash-lite",
                      messages: [
                        { role: "system", content: `Classify each video into ONE niche from this list: ${NICHE_KEYS.join(", ")}. Return ONLY a JSON object mapping index to niche key. Example: {"0":"food","1":"beauty","2":"fitness"}` },
                        { role: "user", content: videoCaptions }
                      ],
                    }),
                  });
                  const aiData = await res.json();
                  const content = aiData?.choices?.[0]?.message?.content || "";
                  const match = content.match(/\{[\s\S]*?\}/);
                  if (match) {
                    const mapping = JSON.parse(match[0]);
                    for (const [idx, nicheKey] of Object.entries(mapping)) {
                      const video = batch[Number(idx)];
                      if (video && NICHE_KEYS.includes(nicheKey as string)) {
                        adminClient.from("videos").update({ niche: nicheKey as string }).eq("id", video.id).then(() => {}).catch(() => {});
                      }
                    }
                  }
                }
                console.log(`Categorized ${uncategorized.length} videos`);
              } catch (e) {
                console.error("AI categorization failed:", e);
              }
            })();
          }
        }

        // activity_log is handled client-side via checkAndLog
        const successfulPages = pageResults.filter(r => r.status === "fulfilled").length;
        const successfulHashtags = hashtags.length;
        await logApiUsage("search", successfulPages + successfulHashtags, { query, pages: successfulPages, hashtags: successfulHashtags, results: upsertedVideos?.length || 0 });

        return json({ videos: upsertedVideos, query: queryRow, hashtags, relatedKeywords });
      }

      case "video_stats": {
        let video_url = body.video_url;
        if (!video_url) return json({ error: "video_url is required" }, 400);
        if (!validateTikTokUrl(video_url)) return json({ error: "Invalid TikTok URL" }, 400);
        video_url = await resolveShortUrl(video_url);

        const awemeId = extractAwemeId(video_url);
        console.log("video_stats: resolved URL =", video_url, "awemeId =", awemeId);

        const data = await callEnsemble("/tt/post/info", { url: video_url });
        await logApiUsage("video_stats", 1, { video_url });
        // EnsembleData may return { "0": { ... } } or { data: { "0": { ... } } }
        const rawData = data?.data || data;
        const innerData = rawData?.["0"] || rawData;
        const videoData = unwrapVideo(innerData);

        if (videoData) {
          const stats = videoData.statistics || videoData.stats || {};
          const views = stats.play_count ?? stats.views ?? videoData.playCount ?? videoData.views ?? 0;
          const likes = stats.digg_count ?? stats.likes ?? videoData.diggCount ?? videoData.likes ?? 0;
          const comments = stats.comment_count ?? stats.comments ?? videoData.commentCount ?? videoData.comments ?? 0;
          const shares = stats.share_count ?? stats.shares ?? videoData.shareCount ?? videoData.shares ?? 0;

          const videoId = videoData.aweme_id || videoData.id || awemeId;
          const author = videoData.author || {};
          const videoInfo = videoData.video || {};
          const coverUrl = videoInfo.cover?.url_list?.[0] || videoInfo.origin_cover?.url_list?.[0] || "";
          const authorUsername = author.unique_id || author.uniqueId || "";
          const authorAvatar = author.avatar_thumb?.url_list?.[0] || author.avatar_larger?.url_list?.[0] || "";
          const caption = videoData.desc || videoData.caption || "";

          const trends = computeTrend(videoData);
          await adminClient
            .from("videos")
            .update({
              views, likes, comments, shares,
              fetched_at: new Date().toISOString(),
              ...trends,
            })
            .eq("platform_video_id", String(videoId));

          return json({
            views, likes, comments, shares,
            playCount: views, diggCount: likes, commentCount: comments, shareCount: shares,
            id: videoId, videoId,
            thumbnailUrl: coverUrl, cover_url: coverUrl, cover: coverUrl,
            channelName: authorUsername, author_username: authorUsername,
            author_avatar_url: authorAvatar,
            caption, desc: caption,
            author: { uniqueId: authorUsername, avatarThumb: authorAvatar, nickname: author.nickname || "" },
            video: { cover: coverUrl, duration: videoInfo.duration ? Math.round(videoInfo.duration / 1000) : 0 },
            duration: videoInfo.duration ? Math.round(videoInfo.duration / 1000) : 0,
          });
        }

        return json(videoData || {});
      }

      case "analyze_video": {
        let video_url = body.video_url;
        if (!video_url) return json({ error: "video_url is required" }, 400);
        if (!validateTikTokUrl(video_url)) return json({ error: "Invalid TikTok URL" }, 400);
        video_url = await resolveShortUrl(video_url);

        const awemeId = extractAwemeId(video_url);
        console.log("analyze_video: resolved URL =", video_url, "awemeId =", awemeId);

        // 1. Fetch post info and comments from EnsembleData in parallel
        const commentsFetch = awemeId
          ? callEnsemble("/tt/post/comments", { aweme_id: awemeId })
          : Promise.resolve(null);
        const [postInfoRes, commentsRes] = await Promise.allSettled([
          callEnsemble("/tt/post/info", { url: video_url }),
          commentsFetch,
        ]);

        // Extract post info (stats, description, etc.)
        let statsData: any = null;
        let transcriptText = "";
        if (postInfoRes.status === "fulfilled") {
          const raw = postInfoRes.value?.data || postInfoRes.value;
          const inner = raw?.["0"] || raw;
          statsData = unwrapVideo(inner);
          console.log("Post info keys:", JSON.stringify(Object.keys(statsData || {})));
        } else {
          console.error("Post info fetch failed:", postInfoRes.reason);
        }

        // Extract comments
        let commentsData: any = null;
        let topCommentsText = "";
        if (commentsRes.status === "fulfilled") {
          const cData = commentsRes.value?.data || commentsRes.value;
          const commentsList = Array.isArray(cData) ? cData : cData?.comments || [];
          commentsData = commentsList;
          if (Array.isArray(commentsList)) {
            topCommentsText = commentsList.slice(0, 10).map((c: any) => c.text || c.comment || c.content || "").filter(Boolean).join("\n");
          }
          console.log("Comments fetched, top comments length:", topCommentsText.length);
        } else {
          console.error("Comments fetch failed:", commentsRes.reason);
        }

        // 2. Use Lovable AI to generate structured analysis
        let aiAnalysis: any = null;
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        const caption = cleanForPrompt(body.caption || "", 500);
        const analysisLang = body.language === "kk" ? "kk" : "ru";

        const videoStats = statsData?.statistics || statsData?.stats || {};
        const videoTitle = cleanForPrompt(statsData?.desc || caption || "", 500);
        const videoDuration = statsData?.video?.duration ? Math.round(statsData.video.duration / 1000) : "";

        // Build context for AI from all available data
        const contextParts: string[] = [];
        if (videoTitle) contextParts.push(`Название/описание: ${videoTitle}`);
        if (videoDuration) contextParts.push(`Длительность: ${videoDuration} сек`);
        if (statsData) {
          const v = videoStats.play_count ?? videoStats.views ?? 0;
          const l = videoStats.digg_count ?? videoStats.likes ?? 0;
          const c = videoStats.comment_count ?? videoStats.comments ?? 0;
          const s = videoStats.share_count ?? videoStats.shares ?? 0;
          contextParts.push(`Статистика: ${v} просмотров, ${l} лайков, ${c} комментариев, ${s} репостов`);
        }
        if (topCommentsText) contextParts.push(`Топ комментарии:\n${topCommentsText.slice(0, 2000)}`);

        const hasContent = contextParts.length > 1;

        if (LOVABLE_API_KEY && hasContent) {
          try {
            const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  {
                    role: "system",
                    content: analysisLang === "kk"
                      ? `Сен — TikTok вирустық контентін талдау бойынша сарапшысыз. Бейнені барлық қолжетімді ақпарат негізінде (сипаттама, статистика, пікірлер) талдап, құрылымдалған талдау бер.

МАҢЫЗДЫ: ТІЛДІ ҚАЗАҚША ЖАУАП БЕР. Тек video_analysis функциясын шақыр, қосымша мәтінсіз.`
                      : `Ты — эксперт по анализу вирусного контента в TikTok. Проанализируй видео на основе всей доступной информации (описание, статистика, комментарии) и верни структурированный анализ.

ВАЖНО: Отвечай ТОЛЬКО вызовом функции video_analysis, без лишнего текста.`
                  },
                  {
                    role: "user",
                    content: analysisLang === "kk"
                      ? `Осы TikTok бейнесін талда.\n\nURL: ${video_url}\n\n${contextParts.join("\n\n")}`
                      : `Проанализируй это TikTok видео.\n\nURL: ${video_url}\n\n${contextParts.join("\n\n")}`
                  }
                ],
                tools: [
                  {
                    type: "function",
                    function: {
                      name: "video_analysis",
                      description: "Структурированный анализ TikTok видео",
                      parameters: {
                        type: "object",
                        properties: {
                          topic: { type: "string", description: "Тема видео — краткий заголовок 5-15 слов" },
                          language: { type: "string", description: "Язык видео (Русский, English, etc.)" },
                          tags: {
                            type: "array",
                            items: { type: "string" },
                            description: "2-4 формата/типа контента"
                          },
                          niches: {
                            type: "array",
                            items: { type: "string" },
                            description: "2-4 ниши с эмодзи"
                          },
                          summary: { type: "string", description: "Суть видео — подробное описание в 2-4 предложениях" },
                          structure: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                time: { type: "string" },
                                title: { type: "string" },
                                description: { type: "string" }
                              },
                              required: ["time", "title", "description"]
                            },
                            description: "3-5 сегментов структуры видео с таймкодами"
                          },
                          hook_phrase: { type: "string", description: "Первая фраза-хук" },
                          visual_hook: { type: "string", description: "Описание визуального хука" },
                          text_hook: { type: "string", description: "Текст на экране в первые секунды" },
                          funnel: {
                            type: "object",
                            properties: {
                              direction: { type: "string" },
                              goal: { type: "string" }
                            },
                            required: ["direction", "goal"]
                          }
                        },
                        required: ["topic", "language", "tags", "niches", "summary", "structure", "hook_phrase", "visual_hook", "text_hook", "funnel"]
                      }
                    }
                  }
                ],
                tool_choice: { type: "function", function: { name: "video_analysis" } },
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
              if (toolCall?.function?.arguments) {
                try {
                  aiAnalysis = JSON.parse(toolCall.function.arguments);
                  console.log("AI analysis generated successfully, keys:", Object.keys(aiAnalysis));
                } catch (e) {
                  console.error("Failed to parse AI response:", e);
                }
              }
            } else {
              const errText = await aiResponse.text();
              console.error("AI gateway error:", aiResponse.status, errText);
            }
          } catch (e) {
            console.error("AI analysis error:", e);
          }
        }

        // 3. Combine everything
        const summaryJson = {
          ...(aiAnalysis || {}),
          stats: statsData ? {
            views: videoStats.play_count ?? videoStats.views ?? 0,
            likes: videoStats.digg_count ?? videoStats.likes ?? 0,
            comments: videoStats.comment_count ?? videoStats.comments ?? 0,
            shares: videoStats.share_count ?? videoStats.shares ?? 0,
          } : null,
        };

        const result = {
          summary_json: summaryJson,
          transcript_text: transcriptText || null,
          comments_json: commentsData,
        };

        // Save analysis (only if authenticated)
        let analysis = { ...result, video_url };
        if (userId) {
          const saveClient = userClient || adminClient;
          const { data: saved } = await saveClient
            .from("video_analysis")
            .insert({
              user_id: userId,
              video_url,
              ...result,
              analyzed_at: new Date().toISOString(),
            })
            .select()
            .single();
          if (saved) analysis = saved;
        }

        // activity_log is handled client-side via checkAndLog
        const analyzeCredits = (postInfoRes.status === "fulfilled" ? 1 : 0) + (commentsRes.status === "fulfilled" && awemeId ? 1 : 0);
        await logApiUsage("analyze_video", analyzeCredits, { video_url });

        return json(analysis);
      }

      case "account_stats": {
        const { profile_url } = body;
        if (!profile_url) return json({ error: "profile_url is required" }, 400);
        if (!validateTikTokUrl(profile_url)) return json({ error: "Invalid TikTok URL" }, 400);

        const usernameFromUrl = extractUsername(profile_url);
        if (!usernameFromUrl) return json({ error: "Could not extract username from URL" }, 400);

        // Fetch user info and user posts in parallel via EnsembleData
        const [userInfoRes, userPostsRes] = await Promise.allSettled([
          callEnsemble("/tt/user/info", { username: usernameFromUrl }),
          callEnsemble("/tt/user/posts", { username: usernameFromUrl, depth: "3", alternative_method: "false" }),
        ]);

        // Parse user info
        let accountData: any = {};
        let externalStats: any = {};
        if (userInfoRes.status === "fulfilled") {
          const raw = userInfoRes.value?.data || userInfoRes.value;
          accountData = raw?.user || raw || {};
          // EnsembleData returns stats separately at data.stats level
          externalStats = raw?.stats || {};
          console.log("User info keys:", JSON.stringify(Object.keys(accountData)));
          console.log("External stats keys:", JSON.stringify(Object.keys(externalStats)));
        } else {
          console.error("User info fetch failed:", userInfoRes.reason);
        }

        // Parse user posts
        let topVideos: any[] = [];
        if (userPostsRes.status === "fulfilled") {
          const postsRaw = userPostsRes.value?.data || userPostsRes.value;
          const rawPosts = Array.isArray(postsRaw) ? postsRaw : postsRaw?.aweme_list || postsRaw?.posts || [];
          console.log("User posts returned", rawPosts.length, "posts");

          topVideos = rawPosts.map((raw: any) => {
            const v = unwrapVideo(raw);
            const stats = v.statistics || v.stats || {};
            return {
              id: v.aweme_id || v.id,
              desc: v.desc || "",
              cover: v.video?.cover?.url_list?.[0] || "",
              url: `https://www.tiktok.com/@${usernameFromUrl}/video/${v.aweme_id || v.id}`,
              views: stats.play_count ?? stats.views ?? v.playCount ?? 0,
              likes: stats.digg_count ?? stats.likes ?? v.diggCount ?? 0,
              comments: stats.comment_count ?? stats.comments ?? v.commentCount ?? 0,
              shares: stats.share_count ?? stats.shares ?? v.shareCount ?? 0,
              duration: v.video?.duration ? Math.round(v.video.duration / 1000) : 0,
              createTime: v.create_time || v.createTime || 0,
            };
          });
          topVideos.sort((a: any, b: any) => (b.views || 0) - (a.views || 0));
        } else {
          console.error("User posts fetch failed:", userPostsRes.reason);
        }

        // Extract user stats
        const username = accountData.unique_id || accountData.uniqueId || usernameFromUrl;
        const userStats = externalStats || accountData.stats || {};
        const followers = userStats.followerCount ?? userStats.follower_count ?? accountData.follower_count ?? accountData.followers ?? 0;
        const following = userStats.followingCount ?? userStats.following_count ?? accountData.following_count ?? accountData.following ?? 0;
        const totalLikes = userStats.heartCount ?? userStats.heart_count ?? userStats.total_favorited ?? accountData.total_favorited ?? accountData.totalLikes ?? 0;
        const totalVideos = userStats.videoCount ?? userStats.aweme_count ?? accountData.aweme_count ?? accountData.totalVideos ?? 0;
        const avatarUrl = accountData.avatar_thumb?.url_list?.[0] || accountData.avatar_larger?.url_list?.[0] || "";

        // Computed metrics
        const avgLikesPerVideo = totalVideos > 0 ? Math.round(totalLikes / totalVideos) : 0;
        const engagementRate = followers > 0 ? ((totalLikes / Math.max(totalVideos, 1)) / followers * 100) : 0;
        const avgViews = topVideos.length > 0
          ? Math.round(topVideos.reduce((sum: number, v: any) => sum + (v.views || 0), 0) / topVideos.length)
          : 0;

        const analysisPayload = {
          avg_likes_per_video: avgLikesPerVideo,
          engagement_rate: Math.round(engagementRate * 100) / 100,
          avg_views: avgViews,
          top_videos: topVideos.slice(0, 12),
        };

        let account = null;
        if (userId) {
          const saveClient = userClient || adminClient;
          const { data: saved } = await saveClient
            .from("accounts_tracked")
            .upsert(
              {
                user_id: userId,
                profile_url,
                username,
                avatar_url: avatarUrl,
                followers,
                following,
                total_likes: totalLikes,
                total_videos: totalVideos,
                verified: accountData.verification_type === 1 || accountData.verified || false,
                bio: accountData.signature || accountData.bio || "",
                bio_link: accountData.bio_link?.link || accountData.bioLink || null,
                fetched_at: new Date().toISOString(),
                analysis_json: analysisPayload,
              },
              { onConflict: "user_id,username" }
            )
            .select()
            .single();
          if (saved) account = saved;
        }

        // activity_log is handled client-side via checkAndLog
        const accountCredits = (userInfoRes.status === "fulfilled" ? 1 : 0) + (userPostsRes.status === "fulfilled" ? 1 : 0);
        await logApiUsage("account_stats", accountCredits, { profile_url, username });

        return json({
          ...(account || {}),
          ...analysisPayload,
          username, avatar_url: avatarUrl, followers, following, total_likes: totalLikes, total_videos: totalVideos,
        });
      }

      case "bulk_categorize": {
        const NICHE_KEYS = ["finance","marketing","business","psychology","therapy","education","mama","beauty","fitness","fashion","law","realestate","esoteric","food","home","travel","lifestyle","animals","gaming","music","tattoo","career","auto","diy","kids","ai_news","ai_art","ai_avatar","humor","other"];
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) return json({ error: "AI not configured" }, 500);

        const batchSize = 30;
        const maxBatches = 10;
        let totalCategorized = 0;

        for (let b = 0; b < maxBatches; b++) {
          const { data: uncategorized } = await adminClient
            .from("videos")
            .select("id, caption")
            .is("niche", null)
            .limit(batchSize);

          if (!uncategorized || uncategorized.length === 0) break;

          const videoCaptions = uncategorized.map((v: any, idx: number) => `${idx}: ${cleanForPrompt(v.caption, 150)}`).join("\n");

          try {
            const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash-lite",
                messages: [
                  { role: "system", content: `Classify each video into ONE niche from this list: ${NICHE_KEYS.join(", ")}. Return ONLY a JSON object mapping index to niche key. Example: {"0":"food","1":"beauty","2":"fitness"}` },
                  { role: "user", content: videoCaptions }
                ],
              }),
            });
            const aiData = await res.json();
            const content = aiData?.choices?.[0]?.message?.content || "";
            const match = content.match(/\{[\s\S]*?\}/);
            if (match) {
              const mapping = JSON.parse(match[0]);
              const updates: Promise<any>[] = [];
              for (const [idx, nicheKey] of Object.entries(mapping)) {
                const video = uncategorized[Number(idx)];
                if (video && NICHE_KEYS.includes(nicheKey as string)) {
                  updates.push(adminClient.from("videos").update({ niche: nicheKey as string }).eq("id", video.id));
                  totalCategorized++;
                }
              }
              await Promise.all(updates);
            }
          } catch (e) {
            console.error("Batch categorization error:", e);
          }
        }

        console.log(`Bulk categorized ${totalCategorized} videos`);
        return json({ categorized: totalCategorized });
      }

      case "admin_search": {
        // Admin-only: EnsembleData search with filters
        const { data: roleCheck } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        if (!roleCheck) return json({ error: "Admin access required" }, 403);

        const { query: searchQuery, publish_time = "7", sort_type = "3" } = body;
        if (!searchQuery) return json({ error: "query is required" }, 400);

        // Map sort_type: "3" = by date (sorting=2), "1" = by likes (sorting=1), "0" = relevance (sorting=0)
        let edSorting = "0";
        if (sort_type === "3" || sort_type === "2") edSorting = "2";
        else if (sort_type === "1") edSorting = "1";

        // Map publish_time to EnsembleData period
        let edPeriod = publish_time;
        if (!["0", "1", "7", "30", "90", "180"].includes(edPeriod)) edPeriod = "7";

        // 1. Keyword search (paginated) + AI hashtag generation in parallel
        const PAGES = 15;
        const [aiResult, ...pageResults] = await Promise.allSettled([
          generateHashtagsAndKeywords(searchQuery),
          ...Array.from({ length: PAGES }, (_, page) =>
            callEnsemble("/tt/keyword/search", {
              name: searchQuery,
              cursor: String(page * 20),
              period: edPeriod,
              sorting: edSorting,
              country: "",
              match_exactly: "false",
              get_author_stats: "false",
            })
          ),
        ]);

        let allRawVideos: any[] = [];
        for (const r of pageResults) {
          if (r.status === "fulfilled") {
            allRawVideos.push(...extractVideos(r.value));
          }
        }
        console.log(`Admin keyword search: ${allRawVideos.length} videos`);

        // 2. Hashtag search in parallel
        const { hashtags = [] } = (aiResult as any).status === "fulfilled" ? (aiResult as any).value : {};
        if (hashtags.length > 0) {
          const hashtagResults = await Promise.allSettled(
            hashtags.map((tag: string) =>
              callEnsemble("/tt/hashtag/posts", { name: tag, cursor: "0" })
            )
          );
          for (const r of hashtagResults) {
            if (r.status === "fulfilled") {
              allRawVideos.push(...extractVideos(r.value));
            }
          }
        }

        // 3. Normalize + Deduplicate
        const seen = new Set<string>();
        const unique: any[] = [];
        for (const raw of allRawVideos) {
          const v = normalizeVideo(raw);
          if (!v.aweme_id || seen.has(v.aweme_id)) continue;
          seen.add(v.aweme_id);
          unique.push(v);
        }

        // 4. Sort
        unique.sort((a: any, b: any) => {
          if (sort_type === "1") {
            return (b.likes || 0) - (a.likes || 0);
          }
          // by date
          const aTime = a.createTime || 0;
          const bTime = b.createTime || 0;
          return (typeof bTime === "number" ? bTime : 0) - (typeof aTime === "number" ? aTime : 0);
        });

        console.log(`Admin search "${searchQuery}": ${unique.length} unique videos`);
        const adminSearchCredits = pageResults.filter(r => r.status === "fulfilled").length + hashtags.length;
        await logApiUsage("admin_search", adminSearchCredits, { query: searchQuery, results: unique.length });
        return json({ videos: unique });
      }

      case "get_play_url": {
        let video_url = body.video_url;
        if (!video_url) return json({ error: "video_url is required" }, 400);
        if (!validateTikTokUrl(video_url)) return json({ error: "Invalid TikTok URL" }, 400);
        video_url = await resolveShortUrl(video_url);

        let playUrl: string | null = null;
        try {
          const data = await callEnsemble("/tt/post/info", { url: video_url });
          await logApiUsage("get_play_url", 1, { video_url });

          const rawData = data?.data || data;
          const innerData = rawData?.aweme_detail || rawData?.aweme_details?.[0] || rawData?.["0"] || rawData;
          const videoData = unwrapVideo(innerData);

          if (videoData) {
            const videoInfo = videoData.video || {};
            const playUrls = videoInfo.play_addr?.url_list || [];
            const downloadUrls = videoInfo.download_addr?.url_list || [];
            const h264Urls = videoInfo.play_addr_h264?.url_list || [];
            playUrl = playUrls[0] || downloadUrls[0] || h264Urls[0] || null;

            if (!playUrl) {
              console.log("No play URL found. Video info keys:", JSON.stringify(Object.keys(videoInfo)));
            }
          }
        } catch (e) {
          console.error("get_play_url error:", (e as Error).message);
        }

        return json({ play_url: playUrl });
      }

      case "refresh_cover": {
        const { video_id, platform_video_id, author_username } = body;
        if (!platform_video_id) return json({ error: "platform_video_id is required" }, 400);

        const postUrl = `https://www.tiktok.com/@${author_username || "user"}/video/${platform_video_id}`;
        try {
          const data = await callEnsemble("/tt/post/info", { url: postUrl });
          await logApiUsage("refresh_cover", 1, { platform_video_id });

          const rawData = data?.data || data;
          // EnsembleData may nest post info under various keys
          const innerData = rawData?.aweme_detail || rawData?.aweme_details?.[0] || rawData?.["0"] || rawData;
          const postData = unwrapVideo(innerData);

          if (!postData) return json({ error: "Video not found" }, 404);

          const videoInfo = postData.video || {};
          const author = postData.author || {};
          const newCover = videoInfo.cover?.url_list?.[0] 
            || videoInfo.origin_cover?.url_list?.[0] 
            || videoInfo.dynamic_cover?.url_list?.[0]
            || postData.cover_url
            || "";
          const newAvatar = author.avatar_thumb?.url_list?.[0] || author.avatar_larger?.url_list?.[0] || "";

          if (!newCover) {
            console.log("No cover found in response. Keys:", JSON.stringify(Object.keys(postData)).slice(0, 300));
            return json({ cover_url: null, error: "No cover found" }, 200);
          }

          if (video_id) {
            const updateFields: Record<string, any> = {
              cover_url: newCover,
              fetched_at: new Date().toISOString(),
            };
            if (newAvatar) updateFields.author_avatar_url = newAvatar;

            const stats = postData.statistics || {};
            if (stats.play_count != null) updateFields.views = stats.play_count;
            if (stats.digg_count != null) updateFields.likes = stats.digg_count;
            if (stats.comment_count != null) updateFields.comments = stats.comment_count;
            if (stats.share_count != null) updateFields.shares = stats.share_count;

            await adminClient.from("videos").update(updateFields).eq("id", video_id);
          }

          return json({ cover_url: newCover, author_avatar_url: newAvatar });
        } catch (e) {
          console.error("Cover refresh failed:", (e as Error).message);
          return json({ cover_url: null, error: "API limit or unavailable" });
        }
      }

      case "admin_add_video": {
        // Admin-only: add single video to trends DB
        const { data: roleCheck2 } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        if (!roleCheck2) return json({ error: "Admin access required" }, 403);

        const { video: videoRow } = body;
        if (!videoRow || !videoRow.platform_video_id) return json({ error: "video data required" }, 400);

        const { error: upsertErr } = await adminClient
          .from("videos")
          .upsert(videoRow, { onConflict: "platform,platform_video_id" });

        if (upsertErr) {
          console.error("Admin add video error:", upsertErr);
          return json({ error: upsertErr.message }, 500);
        }

        return json({ success: true });
      }

      // persist_covers handled before auth check (for cron support)

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Unable to process request. Please try again later." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
