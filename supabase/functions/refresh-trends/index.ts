import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOCIALKIT_BASE = "https://api.socialkit.dev";

// General KZ queries loaded from DB (fallback defaults)
const DEFAULT_GENERAL_KZ_QUERIES = [
  "#қазақстан", "#kz", "#казахстан", "#алматы", "#астана",
  "#казахстантренд", "#kztiktok", "#снг", "#рекомендации",
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const socialKitKey = Deno.env.get("SOCIALKIT_ACCESS_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const isCronCall = token === serviceRoleKey;
    let userId: string | null = null;

    if (isCronCall) {
      console.log("Cron call detected (service_role key)");
    } else {
      const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = claimsData.claims.sub as string;
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // ===== Load niche queries from DB =====
    const { data: nicheSettingsRow } = await adminClient
      .from("trend_settings")
      .select("value")
      .eq("key", "niche_queries")
      .single();

    const NICHE_QUERIES: Record<string, string[]> = nicheSettingsRow?.value as any || {};
    const allNicheKeys = Object.keys(NICHE_QUERIES);
    console.log(`Loaded ${allNicheKeys.length} niches from DB: ${allNicheKeys.join(", ")}`);

    if (allNicheKeys.length === 0) {
      return new Response(JSON.stringify({ error: "No niches configured in trend_settings" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load general KZ queries from DB
    const { data: gkzRow } = await adminClient
      .from("trend_settings")
      .select("value")
      .eq("key", "general_kz_queries")
      .single();
    const GENERAL_KZ_QUERIES: string[] = (gkzRow?.value as any) || DEFAULT_GENERAL_KZ_QUERIES;
    console.log(`Loaded ${GENERAL_KZ_QUERIES.length} general KZ queries from DB`);

    const callSocialKit = async (path: string, params: Record<string, string>) => {
      const url = new URL(`${SOCIALKIT_BASE}${path}`);
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      const res = await fetch(url.toString(), {
        headers: { "x-access-key": socialKitKey },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`SocialKit error ${res.status}: ${text}`);
      }
      return res.json();
    };

    const getPublishedAt = (video: any): string => {
      if (video.createTime) return new Date(video.createTime * 1000).toISOString();
      if (video.created_at) return new Date(video.created_at).toISOString();
      if (video.create_time) return new Date(video.create_time * 1000).toISOString();
      return new Date().toISOString();
    };

    const computeTrend = (video: any) => {
      const stats = video.stats || {};
      const publishedAt = new Date(getPublishedAt(video));
      const hoursSince = Math.max(1, (Date.now() - publishedAt.getTime()) / 3600000);
      const vViews = (stats.views || video.views || video.playCount || 0) / hoursSince;
      const vLikes = (stats.likes || video.likes || video.diggCount || 0) / hoursSince;
      const vComments = (stats.comments || video.comments || video.commentCount || 0) / hoursSince;
      return {
        velocity_views: vViews,
        velocity_likes: vLikes,
        velocity_comments: vComments,
        trend_score: 0.6 * vViews + 0.3 * vLikes + 0.1 * vComments,
        published_at: publishedAt.toISOString(),
      };
    };

    const extractVideos = (data: any): any[] => {
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.data?.results)) return data.data.results;
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data?.items)) return data.items;
      if (Array.isArray(data?.videos)) return data.videos;
      if (Array.isArray(data?.result)) return data.result;
      return [];
    };

    // Check mode
    let mode = "full";
    let batchIndex = 0;
    let logId: string | null = null;
    let existingNicheStats: Record<string, number> = {};
    let existingTotalSaved = 0;
    let existingGeneralSaved = 0;
    let runGeneralKz = false;
    try {
      const body = await req.json();
      if (body?.lite) mode = "lite";
      else if (body?.mass) mode = "mass";
      else if (body?.mode === "mass") mode = "mass";
      else if (body?.mode === "lite") mode = "lite";
      if (typeof body?.batch === "number") batchIndex = body.batch;
      if (body?.logId) logId = body.logId;
      if (body?.nicheStats) existingNicheStats = body.nicheStats;
      if (typeof body?.totalSaved === "number") existingTotalSaved = body.totalSaved;
      if (typeof body?.generalSaved === "number") existingGeneralSaved = body.generalSaved;
      if (body?.runGeneralKz) runGeneralKz = true;
    } catch { /* no body = cron call */ }

    // Load thresholds from DB
    const { data: thresholdsRow } = await adminClient
      .from("trend_settings")
      .select("value")
      .eq("key", "thresholds")
      .single();
    const thresholds = (thresholdsRow?.value as any) || {};
    const weakNicheThreshold = thresholds.weak_niche_threshold ?? 20;
    const fullNicheThreshold = thresholds.full_niche_threshold ?? 100;
    const fullGeneralKzThreshold = thresholds.full_general_kz_threshold ?? 200;
    const minForeignTrendScore = thresholds.min_foreign_trend_score ?? 500;
    const qPerNiche = thresholds.queries_per_niche || {};
    const wqPerNiche = thresholds.weak_queries_per_niche || {};
    const gkzCount = thresholds.general_kz_count || {};

    // Detect weak niches
    const sevenDaysAgoCheck = new Date(Date.now() - 7 * 24 * 3600000).toISOString();
    const { data: nicheCounts } = await adminClient
      .from("videos")
      .select("niche")
      .gte("published_at", sevenDaysAgoCheck);
    
    const nicheCountMap: Record<string, number> = {};
    for (const row of nicheCounts || []) {
      if (row.niche) nicheCountMap[row.niche] = (nicheCountMap[row.niche] || 0) + 1;
    }

    const WEAK_NICHES = new Set(
      allNicheKeys.filter(n => (nicheCountMap[n] || 0) < weakNicheThreshold)
    );
    const FULL_NICHES = new Set(
      allNicheKeys.filter(n => (nicheCountMap[n] || 0) >= fullNicheThreshold)
    );
    if (batchIndex === 0) {
      console.log(`Weak categories (< ${weakNicheThreshold}): ${[...WEAK_NICHES].join(", ")}`);
      console.log(`Full categories (>= ${fullNicheThreshold}, skipping): ${[...FULL_NICHES].join(", ") || "none"}`);
    }

    // Use DB thresholds for query counts
    const queriesPerNiche = mode === "mass" ? (qPerNiche.mass ?? 8) : mode === "lite" ? (qPerNiche.lite ?? 3) : (qPerNiche.full ?? 5);
    const weakQueriesPerNiche = mode === "mass" ? (wqPerNiche.mass ?? 15) : mode === "lite" ? (wqPerNiche.lite ?? 5) : (wqPerNiche.full ?? 8);
    const generalKzCount = mode === "mass" ? (gkzCount.mass ?? 30) : mode === "lite" ? (gkzCount.lite ?? 8) : (gkzCount.full ?? 15);

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    // AI-powered query generation
    const generateAiQueries = async (niches: string[]): Promise<Record<string, string[]>> => {
      try {
        const nicheDescriptions = niches.map(n => {
          const existing = NICHE_QUERIES[n] || [];
          return `${n}: примеры: ${existing.slice(0, 3).join(", ")}`;
        }).join("\n");

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: `Ты эксперт по TikTok трендам в Казахстане и СНГ. Для каждой ниши сгенерируй 8 актуальных поисковых запросов для поиска вирусных видео. Запросы должны быть на казахском, русском и английском. Используй хештеги, ключевые фразы и названия трендов. Возвращай ТОЛЬКО JSON: {"niche1":["запрос1","запрос2",...],...}` },
              { role: "user", content: `Сгенерируй свежие TikTok поисковые запросы для этих ниш (сегодня ${new Date().toLocaleDateString("ru")}):\n${nicheDescriptions}` }
            ],
          }),
        });
        const aiData = await res.json();
        const content = aiData?.choices?.[0]?.message?.content || "";
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          console.log(`AI generated queries for: ${Object.keys(parsed).join(", ")}`);
          return parsed;
        }
      } catch (e) {
        console.error("AI query generation failed:", e);
      }
      return {};
    };

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000);
    const now = new Date().toISOString();
    const nicheStats: Record<string, number> = { ...existingNicheStats };
    let totalSaved = existingTotalSaved;

    // Create log entry on first batch only
    if (!logId) {
      const { data: logEntry } = await adminClient.from("trend_refresh_logs").insert({
        mode,
        status: "running",
        total_saved: 0,
        general_saved: 0,
        niche_stats: {},
        triggered_by: userId,
      }).select("id").single();
      logId = logEntry?.id || null;
    }

    // Self-chaining helper
    const chainNextBatch = async (nextBatch: number, updatedNicheStats: Record<string, number>, updatedTotalSaved: number, updatedGeneralSaved: number, isGeneralKz = false) => {
      try {
        await fetch(`${supabaseUrl}/functions/v1/refresh-trends`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode,
            batch: nextBatch,
            logId,
            nicheStats: updatedNicheStats,
            totalSaved: updatedTotalSaved,
            generalSaved: updatedGeneralSaved,
            runGeneralKz: isGeneralKz,
          }),
        });
      } catch (e) {
        console.error("Chain call failed:", e);
      }
    };

    const BATCH_SIZE = 4;
    const totalBatches = Math.ceil(allNicheKeys.length / BATCH_SIZE);

    // Process niche batch or general KZ
    let generalSaved = existingGeneralSaved;

    if (!runGeneralKz) {
      // === Process niche batch ===
      const start = batchIndex * BATCH_SIZE;
      const nicheKeys = allNicheKeys.slice(start, start + BATCH_SIZE);
      
      if (nicheKeys.length > 0) {
        // Filter out full categories
        const activeNicheKeys = nicheKeys.filter(k => !FULL_NICHES.has(k));
        const skippedKeys = nicheKeys.filter(k => FULL_NICHES.has(k));
        if (skippedKeys.length > 0) {
          console.log(`Batch ${batchIndex}: skipping full categories: ${skippedKeys.join(", ")}`);
          for (const sk of skippedKeys) nicheStats[sk] = nicheCountMap[sk] || 0;
        }
        console.log(`Batch ${batchIndex}: processing categories ${activeNicheKeys.join(", ") || "(none)"}`);
        const aiQueries = activeNicheKeys.length > 0 ? await generateAiQueries(activeNicheKeys) : {};
        
        await Promise.all(activeNicheKeys.map(async (nicheKey) => {
          const qCount = WEAK_NICHES.has(nicheKey) ? weakQueriesPerNiche : queriesPerNiche;
          const aiNicheQueries = aiQueries[nicheKey] || [];
          const staticQueries = [...(NICHE_QUERIES[nicheKey] || [])];
          const isKzRu = (q: string) => /[а-яА-ЯәғқңөұүіӘҒҚҢӨҰҮІ]/.test(q);
          const kzRuQueries = staticQueries.filter(isKzRu).sort(() => Math.random() - 0.5);
          const enQueries = staticQueries.filter(q => !isKzRu(q)).sort(() => Math.random() - 0.5);
          const maxEnQueries = Math.max(1, Math.floor(qCount * 0.3));
          const combinedQueries = [...kzRuQueries, ...aiNicheQueries, ...enQueries.slice(0, maxEnQueries)];
          const uniqueQueries = [...new Set(combinedQueries)].slice(0, qCount);
          let nicheSaved = 0;

          for (const query of uniqueQueries) {
            try {
              const data = await callSocialKit("/tiktok/search", { query, count: "50" });
              const videos = extractVideos(data);
              const videoRows = videos.map(v => {
                const videoId = v.id || v.video_id || v.aweme_id;
                if (!videoId) return null;
                const trends = computeTrend(v);
                const publishedDate = new Date(trends.published_at);
                if (publishedDate < sevenDaysAgo) return null;
                const stats = v.stats || {};
                const caption = v.desc || v.caption || v.title || "";
                const username = v.author?.uniqueId || v.author?.unique_id || v.author_username || "";
                return {
                  platform: "tiktok",
                  platform_video_id: String(videoId),
                  url: v.url || `https://www.tiktok.com/@${username || "user"}/video/${videoId}`,
                  caption,
                  cover_url: v.video?.cover || v.cover_url || v.cover || v.originCover || "",
                  author_username: username,
                  author_display_name: v.author?.nickname || v.author_display_name || "",
                  author_avatar_url: v.author?.avatar || v.author?.avatarThumb || v.author_avatar_url || "",
                  views: stats.views || v.views || v.playCount || 0,
                  likes: stats.likes || v.likes || v.diggCount || 0,
                  comments: stats.comments || v.comments || v.commentCount || 0,
                  shares: stats.shares || v.shares || v.shareCount || 0,
                  duration_sec: v.video?.duration || v.duration_sec || v.duration || null,
                  fetched_at: now,
                  region: "kz",
                  niche: nicheKey,
                  categories: [nicheKey],
                  ...trends,
                };
              }).filter(Boolean);

              if (videoRows.length > 0) {
                const { data: upserted } = await adminClient
                  .from("videos")
                  .upsert(videoRows, { onConflict: "platform_video_id" })
                  .select("id");
                nicheSaved += upserted?.length || 0;
              }
            } catch (err) {
              console.error(`Niche ${nicheKey} query "${query}" failed:`, err.message);
            }
          }
          nicheStats[nicheKey] = nicheSaved;
          totalSaved += nicheSaved;
          console.log(`Niche ${nicheKey}: saved ${nicheSaved} videos`);
        }));
      }

      // Update log with progress
      if (logId) {
        await adminClient.from("trend_refresh_logs").update({
          total_saved: totalSaved,
          niche_stats: nicheStats,
        }).eq("id", logId);
      }

      // Chain to next batch or general KZ
      const nextBatch = batchIndex + 1;
      if (nextBatch < totalBatches) {
        console.log(`Chaining to batch ${nextBatch}/${totalBatches}...`);
        chainNextBatch(nextBatch, nicheStats, totalSaved, generalSaved, false);
      } else {
        console.log(`All niche batches done. Chaining to general KZ...`);
        chainNextBatch(nextBatch, nicheStats, totalSaved, generalSaved, true);
      }

      return new Response(JSON.stringify({ success: true, batch: batchIndex, totalSaved, nicheStats }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      // === General KZ queries ===
      // Check total videos across all categories in last 7 days
      const totalVideos7d = Object.values(nicheCountMap).reduce((s, c) => s + c, 0);
      if (totalVideos7d >= fullGeneralKzThreshold) {
        console.log(`Skipping general KZ: total ${totalVideos7d} videos >= ${fullGeneralKzThreshold} threshold`);
        // Final: mark log as done
        if (logId) {
          await adminClient.from("trend_refresh_logs").update({
            status: "done",
            total_saved: totalSaved,
            general_saved: 0,
            niche_stats: nicheStats,
            finished_at: new Date().toISOString(),
          }).eq("id", logId);
        }
        return new Response(JSON.stringify({ success: true, mode, totalSaved, generalSaved: 0, nicheStats, skippedGeneralKz: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log(`Processing general KZ queries (total ${totalVideos7d}/${fullGeneralKzThreshold})...`);
      const shuffledGeneral = GENERAL_KZ_QUERIES.sort(() => Math.random() - 0.5).slice(0, generalKzCount);

      for (let i = 0; i < shuffledGeneral.length; i += 3) {
        const gBatch = shuffledGeneral.slice(i, i + 3);
        await Promise.all(gBatch.map(async (query) => {
          try {
            const data = await callSocialKit("/tiktok/search", { query, count: "50" });
            const videos = extractVideos(data);
            const videoRows = videos.map(v => {
              const videoId = v.id || v.video_id || v.aweme_id;
              if (!videoId) return null;
              const trends = computeTrend(v);
              const publishedDate = new Date(trends.published_at);
              if (publishedDate < sevenDaysAgo) return null;
              const stats = v.stats || {};
              return {
                platform: "tiktok",
                platform_video_id: String(videoId),
                url: v.url || `https://www.tiktok.com/@${v.author?.uniqueId || "user"}/video/${videoId}`,
                caption: v.desc || v.caption || v.title || "",
                cover_url: v.video?.cover || v.cover_url || v.cover || v.originCover || "",
                author_username: v.author?.uniqueId || v.author?.unique_id || v.author_username || "",
                author_display_name: v.author?.nickname || v.author_display_name || "",
                author_avatar_url: v.author?.avatar || v.author?.avatarThumb || v.author_avatar_url || "",
                views: stats.views || v.views || v.playCount || 0,
                likes: stats.likes || v.likes || v.diggCount || 0,
                comments: stats.comments || v.comments || v.commentCount || 0,
                shares: stats.shares || v.shares || v.shareCount || 0,
                duration_sec: v.video?.duration || v.duration_sec || v.duration || null,
                fetched_at: now,
                region: "kz",
                ...trends,
              };
            }).filter(Boolean);

            if (videoRows.length > 0) {
              const { data: upserted } = await adminClient
                .from("videos")
                .upsert(videoRows, { onConflict: "platform_video_id" })
                .select("id");
              generalSaved += upserted?.length || 0;
            }
          } catch (err) {
            console.error(`General query "${query}" failed:`, err.message);
          }
        }));
        if (i + 3 < shuffledGeneral.length) await delay(500);
      }

      // AI-categorize uncategorized videos (multi-category via categories array)
      if (generalSaved > 0 && LOVABLE_API_KEY) {
        try {
          const NICHE_KEYS = allNicheKeys.concat(["other"]);
          const { data: uncategorized } = await adminClient
            .from("videos")
            .select("id, caption")
            .is("niche", null)
            .limit(200);

          if (uncategorized && uncategorized.length > 0) {
            for (let i = 0; i < uncategorized.length; i += 30) {
              const batchItems = uncategorized.slice(i, i + 30);
              const captions = batchItems.map((v: any, idx: number) => `${idx}: ${(v.caption || "").slice(0, 150)}`).join("\n");
              const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  model: "google/gemini-2.5-flash-lite",
                  messages: [
                    { role: "system", content: `Classify each video into 1-3 matching categories from: ${NICHE_KEYS.join(", ")}. Return ONLY JSON: {"0":["food","lifestyle"],"1":["humor"],...}` },
                    { role: "user", content: captions }
                  ],
                }),
              });
              const aiData = await res.json();
              const content = aiData?.choices?.[0]?.message?.content || "";
              const match = content.match(/\{[\s\S]*?\}/);
              if (match) {
                const mapping = JSON.parse(match[0]);
                for (const [idx, categories] of Object.entries(mapping)) {
                  const video = batchItems[Number(idx)];
                  if (!video) continue;
                  const cats: string[] = Array.isArray(categories) ? categories : [categories as string];
                  const validCats = cats.filter(c => NICHE_KEYS.includes(c) && c !== "other");
                  const primaryNiche = validCats[0] || "other";
                  await adminClient.from("videos").update({
                    niche: primaryNiche,
                    categories: validCats.length > 0 ? validCats : [primaryNiche],
                  }).eq("id", video.id);
                }
              }
            }
            console.log(`AI-categorized ${uncategorized.length} general videos`);
          }
        } catch (e) {
          console.error("AI categorization failed:", e);
        }
      }

      // Final: mark log as done
      if (logId) {
        await adminClient.from("trend_refresh_logs").update({
          status: "done",
          total_saved: totalSaved,
          general_saved: generalSaved,
          niche_stats: nicheStats,
          finished_at: new Date().toISOString(),
        }).eq("id", logId);
      }

      console.log(`Refresh COMPLETE. Total niche: ${totalSaved}, general: ${generalSaved}`);
      return new Response(JSON.stringify({ success: true, mode, totalSaved, generalSaved, nicheStats }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    console.error("Refresh trends error:", err);
    try {
      const ac = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await ac.from("trend_refresh_logs").update({
        status: "error",
        error_message: String(err),
        finished_at: new Date().toISOString(),
      }).eq("status", "running").order("started_at", { ascending: false }).limit(1);
    } catch {}
    return new Response(
      JSON.stringify({ error: "Unable to process request. Please try again later." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
