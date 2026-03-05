import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ENSEMBLE_BASE = "https://ensembledata.com/apis";

// Filters
const MIN_VIEWS = 5000;
const MAX_AGE_DAYS = 7;

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

const VERSION = "refresh-trends-ensemble v2 maxAge=7 minViews=5000 sort=date,likes period=7,30";

Deno.serve(async (req: Request) => {
  console.log("VERSION", VERSION);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ensembleToken = Deno.env.get("ENSEMBLE_DATA_TOKEN");

  if (!ensembleToken) {
    return new Response(JSON.stringify({ error: "ENSEMBLE_DATA_TOKEN not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

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
  const callEnsembleData = async (
    query: string,
    period: string,
    sorting: string,
    retries = 3,
  ): Promise<any[]> => {
    const params = new URLSearchParams({
      name: query.trim(),
      period,
      sorting,
      match_exactly: "false",
      token: ensembleToken,
    });

    const url = `${ENSEMBLE_BASE}/tt/keyword/full-search?${params.toString()}`;

    for (let attempt = 0; attempt < retries; attempt++) {
      const res = await fetch(url);

      if (res.ok) {
        const data = await res.json();
        // Extract videos from response
        let rawVideos: any[] = [];
        if (Array.isArray(data?.data)) {
          rawVideos = data.data;
        } else if (data?.data?.videos && Array.isArray(data.data.videos)) {
          rawVideos = data.data.videos;
        } else if (data?.data?.aweme_list && Array.isArray(data.data.aweme_list)) {
          rawVideos = data.data.aweme_list;
        } else if (Array.isArray(data)) {
          rawVideos = data;
        }
        return rawVideos;
      }

      const text = await res.text();
      const retryable = res.status === 429 || (res.status >= 500 && res.status <= 599);
      if (retryable && attempt < retries - 1) {
        const waitSec = Math.min(30, 6 * (attempt + 1));
        console.log(`EnsembleData retryable error ${res.status}. Wait ${waitSec}s (attempt ${attempt + 1}/${retries})`);
        await sleep(waitSec * 1000);
        continue;
      }

      throw new Error(`EnsembleData error ${res.status}: ${text}`);
    }

    throw new Error(`EnsembleData failed after ${retries} retries`);
  };

  const getPublishedAt = (createTime: number): string => {
    if (typeof createTime === "number" && createTime > 0) {
      const sec = createTime > 1e12 ? Math.floor(createTime / 1000) : createTime;
      return new Date(sec * 1000).toISOString();
    }
    return new Date().toISOString();
  };

  const computeTrend = (views: number, likes: number, comments: number, publishedAt: Date) => {
    const hoursSince = Math.max(1, (Date.now() - publishedAt.getTime()) / 3600000);

    const vViews = views / hoursSince;
    const vLikes = likes / hoursSince;
    const vComments = comments / hoursSince;

    const engagementRate = views > 0 ? (likes + comments) / views : 0;

    return {
      velocity_views: vViews,
      velocity_likes: vLikes,
      velocity_comments: vComments,
      trend_score: 0.4 * vViews + 0.3 * vLikes + 0.2 * vComments + 0.1 * engagementRate * 10000,
    };
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

  // Create log entry on first batch only
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
  // Enforce category limit
  // =========================
  const enforceLimit = async (nicheKey: string, limit: number) => {
    if (!limit || limit <= 0) return;

    const freshCutoff = new Date(Date.now() - 7 * 24 * 3600000).toISOString();
    const { count } = await adminClient
      .from("videos")
      .select("id", { count: "exact", head: true })
      .eq("niche", nicheKey)
      .gte("published_at", freshCutoff);

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
  // Process one niche (EnsembleData — one call per keyword, no pagination needed)
  // =========================
  const processNiche = async (nicheKey: string) => {
    const limit = categoryLimits[nicheKey] || 0;

    const qCount = WEAK_NICHES.has(nicheKey) ? weakQueriesPerNiche : queriesPerNiche;
    const allKeywords = NICHE_QUERIES[nicheKey] || [];

    // Per-niche cursor
    const { data: cursorRow } = await adminClient
      .from("trend_niche_cursors")
      .select("cursor")
      .eq("niche", nicheKey)
      .maybeSingle();

    const nicheRotationIndex = cursorRow?.cursor ?? 0;
    const nicheSeed = nicheKey;

    const selectedKeywords = pickRotatedKeywords(nicheKey, allKeywords, qCount, nicheSeed, nicheRotationIndex);
    keywordsUsedPerNiche[nicheKey] = selectedKeywords;

    console.log(`  🔑 ${nicheKey}: picked ${selectedKeywords.length}/${allKeywords.length} keywords (cursor=${nicheRotationIndex}): ${selectedKeywords.slice(0, 5).join(", ")}${selectedKeywords.length > 5 ? "..." : ""}`);

    let nicheSaved = 0;

    // EnsembleData sorting: "2" = date, "1" = likes
    const sortTypes = ["2", "1"];
    // Prioritize fresh content: 75% queries use period=7, 25% use period=30
    const periods = ["7", "7", "7", "30"];

    for (let qi = 0; qi < selectedKeywords.length; qi++) {
      if (Date.now() - startTime > MAX_EXECUTION_MS) break;

      // Re-check limit before each query
      if (limit && limit > 0) {
        const freshCutoff7 = new Date(Date.now() - 7 * 24 * 3600000).toISOString();
        const { count: midCount } = await adminClient
          .from("videos")
          .select("id", { count: "exact", head: true })
          .eq("niche", nicheKey)
          .gte("published_at", freshCutoff7);

        if ((midCount || 0) >= limit) {
          console.log(`⏭ ${nicheKey}: reached 7d limit (${midCount}/${limit}), stopping`);
          break;
        }
      }

      const query = selectedKeywords[qi];
      const sorting = sortTypes[qi % sortTypes.length];
      const period = periods[qi % periods.length];

      if (qi > 0) await sleep(1500); // Rate limit between queries

      try {
        console.log(`ED params: query="${query}", period=${period}, sorting=${sorting}`);
        const rawVideos = await callEnsembleData(query, period, sorting);
        console.log(`  ED returned ${rawVideos.length} raw videos for "${query}"`);

        if (rawVideos.length === 0) continue;

        // Log first video sample on first query
        if (qi === 0 && rawVideos.length > 0) {
          const sample = rawVideos[0];
          const sampleKeys = Object.keys(sample);
          console.log(`  First video keys: ${JSON.stringify(sampleKeys)}`);
        }

        let noId = 0, lowViews = 0, tooOld = 0, inBatchDup = 0, nonCyrillic = 0;

        const rowsRaw = rawVideos.map((item: any) => {
          // Unwrap aweme_info wrapper
          const v = item.aweme_info || item;

          const awemeId = v.aweme_id || v.id || "";
          if (!awemeId) { noId++; return null; }

          const stats = v.statistics || v.stats || {};
          const views = stats.play_count ?? stats.playCount ?? stats.views ?? v.views ?? 0;
          const likes = stats.digg_count ?? stats.diggCount ?? stats.likes ?? v.likes ?? 0;
          const comments = stats.comment_count ?? stats.commentCount ?? stats.comments ?? v.comments ?? 0;
          const shares = stats.share_count ?? stats.shareCount ?? stats.shares ?? v.shares ?? 0;

          if (views < MIN_VIEWS) { lowViews++; return null; }

          // Filter: only keep videos with Cyrillic text in caption (Russian/Kazakh content)
          const caption = v.desc || "";
          const hasCyrillic = /[а-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ]/u.test(caption);
          if (!hasCyrillic) { nonCyrillic++; return null; }

          const publishedAtStr = getPublishedAt(v.create_time || v.createTime || 0);
          const publishedAt = new Date(publishedAtStr);
          if (publishedAt < maxAgeCutoff) { tooOld++; return null; }

          const author = v.author || {};
          const videoInfo = v.video || {};
          const uniqueId = author.unique_id || author.uniqueId || "";
          const nickname = author.nickname || "";
          const avatarUrl = author.avatar_thumb?.url_list?.[0] || author.avatar_larger?.url_list?.[0] || "";
          const coverUrl = videoInfo.cover?.url_list?.[0] || videoInfo.origin_cover?.url_list?.[0] || "";
          const captionText = v.desc || "";
          const duration = videoInfo.duration || null;

          const trends = computeTrend(views, likes, comments, publishedAt);

          return {
            platform: "tiktok",
            platform_video_id: String(awemeId),
            url: `https://www.tiktok.com/@${uniqueId || "user"}/video/${awemeId}`,
            caption,
            cover_url: coverUrl,
            author_username: uniqueId,
            author_display_name: nickname,
            author_avatar_url: avatarUrl,
            views,
            likes,
            comments,
            shares,
            duration_sec: duration,
            fetched_at: nowIso,
            region: "world",
            niche: nicheKey,
            categories: [nicheKey],
            published_at: publishedAtStr,
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
          `  📊 "${query}": ${rawVideos.length} raw → ${videoRows.length} valid (noId=${noId}, lowViews=${lowViews}, tooOld=${tooOld}, inBatchDup=${inBatchDup})`,
        );

        if (videoRows.length === 0) continue;

        // Check which are new
        const platformIds = videoRows.map((v: any) => v.platform_video_id);

        const { data: existing } = await adminClient
          .from("videos")
          .select("platform_video_id")
          .eq("platform", "tiktok")
          .in("platform_video_id", platformIds);

        const existingIds = new Set((existing || []).map((e: any) => e.platform_video_id));
        const newCount = videoRows.filter((v: any) => !existingIds.has(v.platform_video_id)).length;

        console.log(`  💾 "${query}": ${newCount} new / ${existingIds.size} dupes`);

        const { error: upsertErr } = await adminClient
          .from("videos")
          .upsert(videoRows, { onConflict: "platform,platform_video_id" });

        if (upsertErr) {
          console.error(`Upsert error for ${nicheKey}:`, upsertErr.message);
        } else {
          nicheSaved += newCount;
        }

      } catch (err) {
        console.error(`Niche ${nicheKey} query "${query}" failed:`, (err as Error).message);
      }
    }

    // Trim if over limit
    const limitVal = categoryLimits[nicheKey];
    if (limitVal && limitVal > 0) await enforceLimit(nicheKey, limitVal);

    // Advance per-niche cursor for next run
    await adminClient
      .from("trend_niche_cursors")
      .upsert(
        { niche: nicheKey, cursor: nicheRotationIndex + 1, updated_at: new Date().toISOString() },
        { onConflict: "niche" }
      );

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
      const freshCutoff7 = new Date(Date.now() - 7 * 24 * 3600000).toISOString();
      const { count } = await adminClient
        .from("videos")
        .select("id", { count: "exact", head: true })
        .eq("niche", nicheKey)
        .gte("published_at", freshCutoff7);

      if ((count || 0) >= limit) {
        console.log(`⏭ ${nicheKey}: already at 7d limit (${count}/${limit}), skipping`);
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

  // Update log
  if (logId) {
    await adminClient
      .from("trend_refresh_logs")
      .update({
        total_saved: totalSaved,
        niche_stats: {
          ...nicheStats,
          _rotation: {
            mode: "per_niche_cursor",
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
    // Auto-cleanup: remove videos older than MAX_AGE_DAYS
    const cutoffDate = new Date(Date.now() - MAX_AGE_DAYS * 24 * 3600000).toISOString();
    const { count: deletedCount } = await adminClient
      .from("videos")
      .delete({ count: "exact" })
      .lt("published_at", cutoffDate);
    if (deletedCount && deletedCount > 0) {
      console.log(`🧹 Auto-cleanup: removed ${deletedCount} videos older than ${MAX_AGE_DAYS} days`);
    }
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
              mode: "per_niche_cursor",
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
