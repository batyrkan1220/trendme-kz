import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOCIALKIT_BASE = "https://api.socialkit.dev";

// Filters
const MIN_VIEWS = 3000;
const MAX_AGE_DAYS = 90;

// Batching across niches
const BATCH_SIZE = 1;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// =========================
// Deterministic PRNG (mulberry32)
// =========================
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function stableShuffle<T>(array: T[], seed: number): T[] {
  const arr = [...array];
  const rng = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickRotatedKeywords(
  nicheKey: string,
  allKeywords: string[],
  qCount: number,
  seed: string,
  rotationIndex: number,
): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const k of allKeywords || []) {
    const t = String(k ?? "").trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(t);
  }

  if (cleaned.length === 0) return [];

  const combinedSeed = hashString(seed + ":" + nicheKey);

  if (cleaned.length <= qCount) {
    return stableShuffle(cleaned, combinedSeed);
  }

  const shuffled = stableShuffle(cleaned, combinedSeed);
  const total = shuffled.length;
  const take = Math.min(qCount, total);
  const offset = (rotationIndex * take) % total;

  const result: string[] = [];
  for (let i = 0; i < take; i++) {
    result.push(shuffled[(offset + i) % total]);
  }
  return result;
}

const VERSION = "refresh-trends COUNT=30 PAGES=5 offset=page*10 sort=3,1 pub=7,30 maxAge=90 minViews=1000/3000";

Deno.serve(async (req: Request) => {
  console.log("VERSION", VERSION);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const socialKitKey = Deno.env.get("SOCIALKIT_ACCESS_KEY")!;

  // =========================
  // Auth
  // =========================
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

  if (!isCronCall) {
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    userId = claimsData.claims.sub as string;
  } else {
    console.log("Cron call detected (service_role key)");
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // =========================
  // Runtime settings
  // =========================
  const MAX_EXECUTION_MS = 120000;
  const startTime = Date.now();

  const nowIso = new Date().toISOString();
  const maxAgeCutoff = new Date(Date.now() - MAX_AGE_DAYS * 24 * 3600000);

  // =========================
  // Helpers
  // =========================
  const callSocialKit = async (
    path: string,
    params: Record<string, string>,
    retries = 3,
  ): Promise<any> => {
    const url = new URL(`${SOCIALKIT_BASE}${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

    for (let attempt = 0; attempt < retries; attempt++) {
      const res = await fetch(url.toString(), {
        headers: { "x-access-key": socialKitKey },
      });

      if (res.ok) return res.json();

      const text = await res.text();

      const retryable = res.status === 429 || (res.status >= 500 && res.status <= 599);
      if (retryable && attempt < retries - 1) {
        const waitSec = Math.min(30, 6 * (attempt + 1));
        console.log(`SocialKit retryable error ${res.status} on ${path}. Wait ${waitSec}s (attempt ${attempt + 1}/${retries})`);
        await sleep(waitSec * 1000);
        continue;
      }

      throw new Error(`SocialKit error ${res.status}: ${text}`);
    }

    throw new Error(`SocialKit failed after ${retries} retries`);
  };

  const getPublishedAt = (video: any): string => {
    const ct = video.createTime ?? video.create_time;
    if (typeof ct === "number") {
      const sec = ct > 1e12 ? Math.floor(ct / 1000) : ct;
      return new Date(sec * 1000).toISOString();
    }
    if (video.created_at) return new Date(video.created_at).toISOString();
    if (video.published_at) return new Date(video.published_at).toISOString();
    return new Date().toISOString();
  };

  const computeTrend = (video: any) => {
    const stats = video.stats || {};
    const publishedAt = new Date(getPublishedAt(video));
    const hoursSince = Math.max(1, (Date.now() - publishedAt.getTime()) / 3600000);

    const views = stats.views ?? video.views ?? video.playCount ?? 0;
    const likes = stats.likes ?? video.likes ?? video.diggCount ?? 0;
    const comments = stats.comments ?? video.comments ?? video.commentCount ?? 0;

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

  // =========================
  // Parse body / mode
  // =========================
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
  } catch {
    // no body = cron call
  }

  // =========================
  // Load niche queries from DB
  // =========================
  const { data: nicheSettingsRow } = await adminClient
    .from("trend_settings")
    .select("value")
    .eq("key", "niche_queries")
    .single();

  const NICHE_QUERIES: Record<string, string[]> = (nicheSettingsRow?.value as any) || {};
  const allAvailableNiches = Object.keys(NICHE_QUERIES);
  let allNicheKeys = allAvailableNiches;

  if (targetNiches) {
    allNicheKeys = allNicheKeys.filter((n) => targetNiches!.includes(n));
  }

  console.log(`Loaded niches=${allAvailableNiches.length}, processing=${allNicheKeys.length}`);

  if (allNicheKeys.length === 0) {
    return new Response(JSON.stringify({ error: "No niches configured (or none matched target_niches)" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // =========================
  // Load thresholds from DB
  // =========================
  const { data: thresholdsRow } = await adminClient
    .from("trend_settings")
    .select("value")
    .eq("key", "thresholds")
    .single();

  const thresholds = (thresholdsRow?.value as any) || {};
  const queriesPerNiche = thresholds.queries_per_niche ?? 8;
  const weakNicheThreshold = thresholds.weak_niche_threshold ?? 20;
  const weakQueriesPerNiche = thresholds.weak_queries_per_niche ?? 12;

  // =========================
  // Load per-category limits
  // =========================
  const { data: categoryLimitsRow } = await adminClient
    .from("trend_settings")
    .select("value")
    .eq("key", "category_limits")
    .maybeSingle();

  const categoryLimits: Record<string, number> = (categoryLimitsRow?.value as any) || {};

  // =========================
  // Weak niches detection
  // =========================
  const sinceIso = new Date(Date.now() - 30 * 24 * 3600000).toISOString();
  const { data: nicheRows, error: nicheRowsErr } = await adminClient
    .from("videos")
    .select("niche")
    .gte("published_at", sinceIso);

  if (nicheRowsErr) console.warn("Weak niche scan error:", nicheRowsErr.message);

  const nicheCountMap: Record<string, number> = {};
  for (const row of nicheRows || []) {
    if (row.niche) nicheCountMap[row.niche] = (nicheCountMap[row.niche] || 0) + 1;
  }

  const WEAK_NICHES = new Set(
    allNicheKeys.filter((n) => (nicheCountMap[n] || 0) < weakNicheThreshold),
  );

  if (batchIndex === 0) {
    console.log(`Weak niches (<${weakNicheThreshold} in last 30d): ${[...WEAK_NICHES].join(", ")}`);
    console.log(`Category limits: ${JSON.stringify(categoryLimits)}`);
  }

  // =========================
  // Logs (accumulate stats across batches)
  // =========================
  let nicheStats: Record<string, number> = {};
  let totalSaved = 0;
  let keywordsUsedPerNiche: Record<string, string[]> = {};

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

  // Create log entry on first batch only (BEFORE keyword selection so logId is available as seed)
  if (!logId) {
    await adminClient
      .from("trend_refresh_logs")
      .update({
        status: "error",
        error_message: "Superseded by new run",
        finished_at: new Date().toISOString(),
      })
      .eq("status", "running");

    const { data: logEntry } = await adminClient
      .from("trend_refresh_logs")
      .insert({
        mode,
        status: "running",
        total_saved: 0,
        general_saved: 0,
        niche_stats: {},
        triggered_by: userId,
      })
      .select("id")
      .single();

    logId = logEntry?.id || null;
  }

  // Per-niche cursor rotation (seed is stable per niche, cursor advances each run)

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

  // =========================
  // Enforce category limit (trim weakest if over)
  // =========================
  const enforceLimit = async (nicheKey: string, limit: number) => {
    if (!limit || limit <= 0) return;

    const { count } = await adminClient
      .from("videos")
      .select("id", { count: "exact", head: true })
      .eq("niche", nicheKey);

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
      const ids = weakest.map((v) => v.id);
      for (let i = 0; i < ids.length; i += 50) {
        await adminClient.from("videos").delete().in("id", ids.slice(i, i + 50));
      }
      console.log(`🗑 ${nicheKey}: removed ${weakest.length} weakest videos (limit=${limit})`);
    }
  };

  // =========================
  // Process one niche (with seeded keyword rotation)
  // =========================
  const processNiche = async (nicheKey: string) => {
    const limit = categoryLimits[nicheKey] || 0;

    const qCount = WEAK_NICHES.has(nicheKey) ? weakQueriesPerNiche : queriesPerNiche;
    const allKeywords = NICHE_QUERIES[nicheKey] || [];

    // Per-niche cursor: read current rotation index
    const { data: cursorRow } = await adminClient
      .from("trend_niche_cursors")
      .select("cursor")
      .eq("niche", nicheKey)
      .maybeSingle();

    const nicheRotationIndex = cursorRow?.cursor ?? 0;
    const nicheSeed = nicheKey; // stable seed per niche — shuffle order never changes

    const selectedKeywords = pickRotatedKeywords(nicheKey, allKeywords, qCount, nicheSeed, nicheRotationIndex);

    // Store for debug logging
    keywordsUsedPerNiche[nicheKey] = selectedKeywords;

    console.log(`  🔑 ${nicheKey}: picked ${selectedKeywords.length}/${allKeywords.length} keywords (cursor=${nicheRotationIndex}): ${selectedKeywords.slice(0, 5).join(", ")}${selectedKeywords.length > 5 ? "..." : ""}`);

    let nicheSaved = 0;

    const PAGES_PER_QUERY = 5;
    const ACTUAL_PAGE_SIZE = 10; // SocialKit returns max 10 per request regardless of count
    const sortTypes = ["3", "1"]; // date, likes
    const publishTimes = ["7", "30"];

    const COUNT = 30;

    for (let qi = 0; qi < selectedKeywords.length; qi++) {
      if (Date.now() - startTime > MAX_EXECUTION_MS) break;

      // Re-check limit before each query
      if (limit && limit > 0) {
        const { count: midCount } = await adminClient
          .from("videos")
          .select("id", { count: "exact", head: true })
          .eq("niche", nicheKey);

        if ((midCount || 0) >= limit) {
          console.log(`⏭ ${nicheKey}: reached limit (${midCount}/${limit}), stopping`);
          break;
        }
      }

      const query = selectedKeywords[qi];
      const sortType = sortTypes[qi % sortTypes.length];
      const publishTime = publishTimes[qi % publishTimes.length];

      if (qi > 0) await sleep(800);

      for (let page = 0; page < PAGES_PER_QUERY; page++) {
        if (Date.now() - startTime > MAX_EXECUTION_MS) break;

        const offset = String(page * ACTUAL_PAGE_SIZE);
        if (page > 0) await sleep(500);

        try {
          console.log("SK params", { query, count: String(COUNT), offset, sortType, publishTime });
          const data = await callSocialKit("/tiktok/search", {
            query,
            count: String(COUNT),
            sort_type: sortType,
            publish_time: publishTime,
            offset,
          });

          const videos = extractVideos(data);

          // DEBUG: log first raw video object from SocialKit
          if (videos.length > 0 && qi === 0 && page === 0) {
            console.log(`RAW_SOCIALKIT_SAMPLE: ${JSON.stringify(videos[0]).slice(0, 3000)}`);
          }

          const ages: number[] = [];
          for (const v of videos) {
            const d = new Date(getPublishedAt(v));
            const ageDays = (Date.now() - d.getTime()) / 86400000;
            if (Number.isFinite(ageDays)) ages.push(ageDays);
          }
          if (ages.length) {
            const min = Math.min(...ages), max = Math.max(...ages);
            console.log(`  AGE days: min=${min.toFixed(1)} max=${max.toFixed(1)} sample=${ages.slice(0, 5).map(a => a.toFixed(1)).join(",")}`);
          }

          let noId = 0, lowViews = 0, tooOld = 0, inBatchDup = 0;

          const rowsRaw = videos.map((v) => {
            const videoId = v.id || v.video_id || v.aweme_id;
            if (!videoId) { noId++; return null; }

            const trends = computeTrend(v);

            const stats = v.stats || {};
            const views = stats.views ?? v.views ?? v.playCount ?? 0;
            const minViewsForNiche = WEAK_NICHES.has(nicheKey) ? 1000 : MIN_VIEWS;
            if (views < minViewsForNiche) { lowViews++; return null; }

            const publishedAt = new Date(getPublishedAt(v));
            if (publishedAt < maxAgeCutoff) { tooOld++; return null; }

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
              likes: stats.likes ?? v.likes ?? v.diggCount ?? 0,
              comments: stats.comments ?? v.comments ?? v.commentCount ?? 0,
              shares: stats.shares ?? v.shares ?? v.shareCount ?? 0,

              duration_sec: v.video?.duration ?? v.duration_sec ?? v.duration ?? null,

              fetched_at: nowIso,
              region: "world",

              niche: nicheKey,
              categories: [nicheKey],

              ...trends,
            };
          }).filter(Boolean) as any[];

          // Local dedupe
          const map = new Map<string, any>();
          for (const r of rowsRaw) {
            if (map.has(r.platform_video_id)) inBatchDup++;
            map.set(r.platform_video_id, r);
          }
          const videoRows = [...map.values()];

          console.log(
            `  📊 "${query}" p${page}: ${videos.length} raw → ${videoRows.length} valid (noId=${noId}, lowViews=${lowViews}, tooOld=${tooOld}, inBatchDup=${inBatchDup})`,
          );

          const tooOldRatio = videos.length ? (tooOld / videos.length) : 1;
          if (page === 0 && tooOldRatio >= 0.7) {
            console.log(`  ⏭ "${query}": tooOldRatio=${tooOldRatio.toFixed(2)} skip remaining pages`);
            break;
          }

          if (videoRows.length === 0) {
            if (videos.length < 5) {
              console.log(`  ⏭ "${query}": no more results, skipping remaining pages`);
              break;
            }
            continue;
          }

          // Check which are new
          const platformIds = videoRows.map((v: any) => v.platform_video_id);

          const { data: existing } = await adminClient
            .from("videos")
            .select("platform_video_id")
            .eq("platform", "tiktok")
            .in("platform_video_id", platformIds);

          const existingIds = new Set((existing || []).map((e: any) => e.platform_video_id));
          const newCount = videoRows.filter((v: any) => !existingIds.has(v.platform_video_id)).length;

          console.log(`  💾 "${query}" p${page}: ${newCount} new / ${existingIds.size} dupes`);

          const { error: upsertErr } = await adminClient
            .from("videos")
            .upsert(videoRows, { onConflict: "platform,platform_video_id" });

          if (upsertErr) {
            console.error(`Upsert error for ${nicheKey}:`, upsertErr.message);
          } else {
            nicheSaved += newCount;
          }

        } catch (err) {
          console.error(`Niche ${nicheKey} query "${query}" p${page} failed:`, (err as Error).message);
        }
      }
    }

    // Trim if over limit
    const limitVal = categoryLimits[nicheKey];
    if (limitVal && limitVal > 0) await enforceLimit(nicheKey, limitVal);

    return nicheSaved;
  };

  // =========================
  // Batch selection
  // =========================
  const totalBatches = Math.ceil(allNicheKeys.length / BATCH_SIZE);
  const start = batchIndex * BATCH_SIZE;
  const nicheKeys = allNicheKeys.slice(start, start + BATCH_SIZE);

  if (nicheKeys.length === 0) {
    return new Response(JSON.stringify({ success: true, batch: batchIndex, totalSaved, nicheStats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log(`Batch ${batchIndex}/${totalBatches}: processing ${nicheKeys.join(", ")}`);

  // Check limits before processing
  const nichesToProcess: string[] = [];
  for (const nicheKey of nicheKeys) {
    const limit = categoryLimits[nicheKey];
    if (limit && limit > 0) {
      const { count } = await adminClient
        .from("videos")
        .select("id", { count: "exact", head: true })
        .eq("niche", nicheKey);

      if ((count || 0) >= limit) {
        console.log(`⏭ ${nicheKey}: already at limit (${count}/${limit}), skipping`);
        nicheStats[nicheKey] = 0;
        continue;
      }
    }
    nichesToProcess.push(nicheKey);
  }

  // Process niches
  for (const nicheKey of nichesToProcess) {
    if (Date.now() - startTime > MAX_EXECUTION_MS) {
      console.log(`⏱ Timeout safety: stopping after ${Math.round((Date.now() - startTime) / 1000)}s`);
      break;
    }

    try {
      const saved = await processNiche(nicheKey);
      nicheStats[nicheKey] = saved;
      totalSaved += saved;
      console.log(`✓ ${nicheKey}: ${saved} videos`);
    } catch (e) {
      console.error(`✗ ${nicheKey} failed:`, (e as Error).message);
      nicheStats[nicheKey] = 0;
    }

    await sleep(1000);
  }

  // Update log with rotation debug info
  if (logId) {
    await adminClient
      .from("trend_refresh_logs")
      .update({
        total_saved: totalSaved,
        niche_stats: {
          ...nicheStats,
          _rotation: {
            seed: rotationSeed,
            index: rotationIndex,
            keywords_used: keywordsUsedPerNiche,
          },
        },
      })
      .eq("id", logId);
  }

  // Check stop flag
  let wasStopped = false;
  if (logId) {
    const { data: currentLog } = await adminClient
      .from("trend_refresh_logs")
      .select("status")
      .eq("id", logId)
      .single();
    wasStopped = currentLog?.status === "error";
  }

  const nextBatch = batchIndex + 1;
  if (!wasStopped && nextBatch < totalBatches) {
    console.log(`Chaining to batch ${nextBatch}/${totalBatches}...`);
    await chainNextBatch(nextBatch);
  } else {
    console.log(`Refresh COMPLETE (accumulated totalSaved=${totalSaved})`);
    if (logId) {
      await adminClient
        .from("trend_refresh_logs")
        .update({
          status: "done",
          total_saved: totalSaved,
          general_saved: 0,
          niche_stats: {
            ...nicheStats,
            _rotation: {
              seed: rotationSeed,
              index: rotationIndex,
              keywords_used: keywordsUsedPerNiche,
            },
          },
          finished_at: new Date().toISOString(),
        })
        .eq("id", logId);
    }
  }

  return new Response(JSON.stringify({ success: true, batch: batchIndex, totalSaved, nicheStats }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
