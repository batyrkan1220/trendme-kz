import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOCIALKIT_BASE = "https://api.socialkit.dev";
const MIN_VIEWS = 3000; // Minimum views threshold
const BATCH_SIZE = 1; // Process 1 niche per batch to guarantee completion within timeout

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
    const allAvailableNiches = Object.keys(NICHE_QUERIES);
    // Will be filtered after parsing body (targetNiches)
    let allNicheKeys = allAvailableNiches;
    console.log(`Loaded ${allAvailableNiches.length} niches from DB: ${allAvailableNiches.join(", ")}`);

    if (allNicheKeys.length === 0) {
      return new Response(JSON.stringify({ error: "No niches configured in trend_settings" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    const MAX_EXECUTION_MS = 50000; // 50s safety limit
    const startTime = Date.now();

    const callSocialKit = async (path: string, params: Record<string, string>, retries = 3): Promise<any> => {
      const url = new URL(`${SOCIALKIT_BASE}${path}`);
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      for (let attempt = 0; attempt < retries; attempt++) {
        const res = await fetch(url.toString(), {
          headers: { "x-access-key": socialKitKey },
        });
        if (res.ok) return res.json();
        const text = await res.text();
        if (text.includes("Rate limit") && attempt < retries - 1) {
          const waitSec = Math.min(30, 10 * (attempt + 1));
          console.log(`Rate limited on ${path}, waiting ${waitSec}s (attempt ${attempt + 1}/${retries})`);
          await sleep(waitSec * 1000);
          continue;
        }
        throw new Error(`SocialKit error ${res.status}: ${text}`);
      }
      throw new Error(`SocialKit failed after ${retries} retries`);
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
      const views = stats.views || video.views || video.playCount || 0;
      const likes = stats.likes || video.likes || video.diggCount || 0;
      const comments = stats.comments || video.comments || video.commentCount || 0;
      
      const vViews = views / hoursSince;
      const vLikes = likes / hoursSince;
      const vComments = comments / hoursSince;
      const engagementRate = views > 0 ? (likes + comments) / views : 0;
      
      return {
        velocity_views: vViews,
        velocity_likes: vLikes,
        velocity_comments: vComments,
        trend_score: 0.4 * vViews + 0.3 * vLikes + 0.2 * vComments + 0.1 * engagementRate * 10000,
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
    let targetNiches: string[] | null = null;
    try {
      const body = await req.json();
      if (body?.lite) mode = "lite";
      else if (body?.mass) mode = "mass";
      else if (body?.mode === "mass") mode = "mass";
      else if (body?.mode === "lite") mode = "lite";
      if (typeof body?.batch === "number") batchIndex = body.batch;
      if (body?.logId) logId = body.logId;
      if (Array.isArray(body?.target_niches) && body.target_niches.length > 0) {
        targetNiches = body.target_niches;
      }
    } catch { /* no body = cron call */ }

    // Filter niches if target_niches specified
    if (targetNiches) {
      allNicheKeys = allNicheKeys.filter(n => targetNiches!.includes(n));
      console.log(`Filtering to ${allNicheKeys.length} target niches: ${allNicheKeys.join(", ")}`);
    }

    // Load thresholds from DB
    const { data: thresholdsRow } = await adminClient
      .from("trend_settings")
      .select("value")
      .eq("key", "thresholds")
      .single();
    const thresholds = (thresholdsRow?.value as any) || {};
    const queriesPerNiche = thresholds.queries_per_niche ?? 8;
    const weakNicheThreshold = thresholds.weak_niche_threshold ?? 20;
    const weakQueriesPerNiche = thresholds.weak_queries_per_niche ?? 12;
    const videosPerQuery = thresholds.videos_per_query ?? 30;

    // Load per-category limits from DB
    const { data: categoryLimitsRow } = await adminClient
      .from("trend_settings")
      .select("value")
      .eq("key", "category_limits")
      .maybeSingle();
    const categoryLimits: Record<string, number> = (categoryLimitsRow?.value as any) || {};

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

    if (batchIndex === 0) {
      console.log(`Weak categories (< ${weakNicheThreshold}): ${[...WEAK_NICHES].join(", ")}`);
      console.log(`Per-category limits: ${JSON.stringify(categoryLimits)}`);
    }

    const now = new Date().toISOString();
    const freshWindow = new Date(Date.now() - 7 * 24 * 3600000); // Last 7 days

    // Load accumulated stats from DB log if continuing a run
    let nicheStats: Record<string, number> = {};
    let totalSaved = 0;
    if (logId) {
      const { data: existingLog } = await adminClient
        .from("trend_refresh_logs")
        .select("niche_stats, total_saved")
        .eq("id", logId)
        .single();
      if (existingLog) {
        nicheStats = (existingLog.niche_stats as Record<string, number>) || {};
        totalSaved = existingLog.total_saved || 0;
      }
    }

    // Create log entry on first batch only
    if (!logId) {
      await adminClient.from("trend_refresh_logs")
        .update({ status: "error", error_message: "Superseded by new run", finished_at: new Date().toISOString() })
        .eq("status", "running");

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
    const chainNextBatch = async (nextBatch: number) => {
      try {
        await fetch(`${supabaseUrl}/functions/v1/refresh-trends`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ mode, batch: nextBatch, logId, target_niches: targetNiches }),
        });
      } catch (e) {
        console.error("Chain call failed:", e);
      }
    };

    // AI-powered query generation for multiple niches at once
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
              { role: "system", content: `Ты эксперт по TikTok трендам в Казахстане и СНГ. Для каждой ниши сгенерируй 8-12 актуальных поисковых запросов для поиска вирусных видео. Запросы должны быть на казахском, русском и английском. Включи: общий запрос, нишевой, коммерческий, разговорный формат. Используй хештеги, ключевые фразы и названия трендов. Возвращай ТОЛЬКО JSON: {"niche1":["запрос1","запрос2",...],...}` },
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

    // Replace weakest videos when category limit reached
    const enforceLimit = async (nicheKey: string, limit: number) => {
      if (limit <= 0) return;
      const { count } = await adminClient
        .from("videos")
        .select("id", { count: "exact", head: true })
        .eq("niche", nicheKey)
        .gte("published_at", freshWindow.toISOString());
      
      const currentCount = count || 0;
      if (currentCount <= limit) return;

      const excess = currentCount - limit;
      const { data: weakest } = await adminClient
        .from("videos")
        .select("id")
        .eq("niche", nicheKey)
        .order("trend_score", { ascending: true })
        .limit(excess);
      
      if (weakest && weakest.length > 0) {
        const ids = weakest.map(v => v.id);
        for (let i = 0; i < ids.length; i += 50) {
          const batch = ids.slice(i, i + 50);
          await adminClient.from("videos").delete().in("id", batch);
        }
        console.log(`🗑 ${nicheKey}: removed ${weakest.length} weakest videos (limit: ${limit})`);
      }
    };

    // Process a single niche: run all queries in PARALLEL
    const processNiche = async (nicheKey: string, aiQueries: Record<string, string[]>) => {
      // CHECK LIMIT BEFORE SEARCHING — skip entirely if at/over limit
      const limit = categoryLimits[nicheKey];
      if (limit && limit > 0) {
        const { count: currentCount } = await adminClient
          .from("videos")
          .select("id", { count: "exact", head: true })
          .eq("niche", nicheKey)
          .gte("published_at", freshWindow.toISOString());
        
        if ((currentCount || 0) >= limit) {
          console.log(`⏭ ${nicheKey}: already at limit (${currentCount}/${limit}), skipping`);
          return 0;
        }
      }

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

      const PARALLEL_QUERIES = 5;
      const sortTypes = ["0", "1", "3"]; // 0=relevance, 1=likes, 3=date
      const publishTimes = ["0", "1", "7", "30"]; // 0=all, 1=day, 7=week, 30=month
      
      for (let i = 0; i < uniqueQueries.length; i += PARALLEL_QUERIES) {
        // Re-check limit BEFORE each query batch
        if (limit && limit > 0) {
          const { count: midCount } = await adminClient
            .from("videos")
            .select("id", { count: "exact", head: true })
            .eq("niche", nicheKey)
            .gte("published_at", freshWindow.toISOString());
          if ((midCount || 0) >= limit) {
            console.log(`⏭ ${nicheKey}: reached limit mid-search (${midCount}/${limit}), stopping`);
            break;
          }
        }

        if (i > 0) await sleep(1200);
        const queryBatch = uniqueQueries.slice(i, i + PARALLEL_QUERIES);
        const results = await Promise.allSettled(queryBatch.map(async (query, qi) => {
          try {
            const sortType = sortTypes[(i + qi) % sortTypes.length];
            const publishTime = publishTimes[(i + qi) % publishTimes.length];
            const offset = String(Math.floor(Math.random() * 3) * 10);
            const data = await callSocialKit("/tiktok/search", { 
              query, 
              count: String(videosPerQuery),
              sort_type: sortType,
              publish_time: publishTime,
              offset,
            });
            const videos = extractVideos(data);
            let noId = 0, tooOld = 0, lowViews = 0;
            const videoRows = videos.map(v => {
              const videoId = v.id || v.video_id || v.aweme_id;
              if (!videoId) { noId++; return null; }
              const trends = computeTrend(v);
              const publishedDate = new Date(trends.published_at);
              if (publishedDate < freshWindow) { tooOld++; return null; }
              
              const stats = v.stats || {};
              const views = stats.views || v.views || v.playCount || 0;
              if (views < MIN_VIEWS) { lowViews++; return null; }
              
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
                views,
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

            console.log(`  📊 "${query}": ${videos.length} raw → ${videoRows.length} valid (noId=${noId}, old=${tooOld}, lowViews=${lowViews})`);

            if (videoRows.length > 0) {
              const platformIds = videoRows.map((v: any) => v.platform_video_id);
              const { data: existing } = await adminClient
                .from("videos")
                .select("platform_video_id")
                .in("platform_video_id", platformIds);
              const existingIds = new Set((existing || []).map((e: any) => e.platform_video_id));
              const newCount = videoRows.filter((v: any) => !existingIds.has(v.platform_video_id)).length;
              console.log(`  💾 "${query}": ${newCount} new / ${existingIds.size} dupes`);

              const { error: upsertErr } = await adminClient
                .from("videos")
                .upsert(videoRows, { onConflict: "platform_video_id" });
              if (upsertErr) console.error(`Upsert error for ${nicheKey}:`, upsertErr.message);
              return newCount;
            }
            return 0;
          } catch (err) {
            console.error(`Niche ${nicheKey} query "${query}" failed:`, err.message);
            return 0;
          }
        }));
        
        for (const r of results) {
          if (r.status === "fulfilled") nicheSaved += r.value;
        }
      }

      // Enforce category limit after inserting (trim weakest if over)
      const limitVal = categoryLimits[nicheKey];
      if (limitVal && limitVal > 0) {
        await enforceLimit(nicheKey, limitVal);
      }

      return nicheSaved;
    };

    const totalBatches = Math.ceil(allNicheKeys.length / BATCH_SIZE);

    // === Process niche batch ===
    const start = batchIndex * BATCH_SIZE;
    const nicheKeys = allNicheKeys.slice(start, start + BATCH_SIZE);
    
    if (nicheKeys.length > 0) {
      console.log(`Batch ${batchIndex}/${totalBatches}: processing ${nicheKeys.join(", ")}`);
      
      // Generate AI queries for all niches in this batch at once
      const aiQueries = await generateAiQueries(nicheKeys);
      
      // Process niches sequentially to avoid SocialKit rate limits
      for (const nicheKey of nicheKeys) {
        if (Date.now() - startTime > MAX_EXECUTION_MS) {
          console.log(`⏱ Timeout safety: stopping after ${Math.round((Date.now() - startTime) / 1000)}s`);
          break;
        }
        try {
          const saved = await processNiche(nicheKey, aiQueries);
          nicheStats[nicheKey] = saved;
          totalSaved += saved;
          console.log(`✓ ${nicheKey}: ${saved} videos`);
        } catch (e) {
          console.error(`✗ ${nicheKey} failed:`, e.message);
          nicheStats[nicheKey] = 0;
        }
        await sleep(1000); // 1s pause between niches
      }

      // Update log after batch
      if (logId) {
        await adminClient.from("trend_refresh_logs").update({
          total_saved: totalSaved,
          niche_stats: nicheStats,
        }).eq("id", logId);
      }

      console.log(`Batch ${batchIndex} done: ${nicheKeys.map(n => `${n}=${nicheStats[n]||0}`).join(", ")}, total: ${totalSaved}`);
    }

    // Check if run was stopped before chaining
    const { data: currentLog } = logId
      ? await adminClient.from("trend_refresh_logs").select("status").eq("id", logId).single()
      : { data: null };
    const wasStopped = currentLog?.status === "error";

    const nextBatch = batchIndex + 1;
    if (!wasStopped && nextBatch < totalBatches) {
      console.log(`Chaining to batch ${nextBatch}/${totalBatches}...`);
      await chainNextBatch(nextBatch);
    } else {
      // All batches done — count real videos from DB
      console.log(`Refresh COMPLETE (accumulated: ${totalSaved}). Counting real totals from DB...`);
      if (logId) {
        const { data: logRow } = await adminClient.from("trend_refresh_logs")
          .select("started_at").eq("id", logId).single();
        const startedAt = logRow?.started_at || new Date(Date.now() - 3600000).toISOString();

        const { data: realCounts } = await adminClient
          .from("videos")
          .select("niche")
          .gte("fetched_at", startedAt);

        const realNicheStats: Record<string, number> = {};
        let realTotal = 0;
        for (const row of realCounts || []) {
          if (row.niche) {
            realNicheStats[row.niche] = (realNicheStats[row.niche] || 0) + 1;
            realTotal++;
          }
        }

        await adminClient.from("trend_refresh_logs").update({
          status: "done",
          total_saved: realTotal,
          general_saved: 0,
          niche_stats: realNicheStats,
          finished_at: new Date().toISOString(),
        }).eq("id", logId);
        console.log(`Final real total: ${realTotal} videos across ${Object.keys(realNicheStats).length} niches`);
      }
    }

    return new Response(JSON.stringify({ success: true, batch: batchIndex, totalSaved, nicheStats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

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
