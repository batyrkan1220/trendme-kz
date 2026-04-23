// Instagram-only viral trends refresh via EnsembleData.
// Strategy: curated accounts -> cache username->user_id -> fetch reels -> dedupe -> score -> top 50.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { VIRAL_ACCOUNTS, MAX_VIDEOS, MIN_VIEWS } from "./config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const EDA = "https://ensembledata.com/apis";
const TOKEN = Deno.env.get("ENSEMBLE_DATA_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface MappedVideo {
  platform: string;
  source: string;
  shortcode: string;
  external_id: string;
  platform_video_id: string;
  url: string;
  author_username: string;
  full_name: string | null;
  is_verified: boolean;
  profile_pic_url: string | null;
  author_avatar_url: string | null;
  author_display_name: string | null;
  caption: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  views: number;
  likes: number;
  comments: number;
  thumbnail_url: string | null;
  cover_url: string | null;
  posted_at: string;
  published_at: string;
  viral_score: number;
  is_broken: boolean;
  region: string;
  fetched_at: string;
}

function mapReel(reel: any): MappedVideo | null {
  const m = reel?.media ?? reel;
  if (!m?.code) return null;
  const username = m.user?.username ?? "unknown";
  const captionText = (m.caption?.text ?? "").slice(0, 500);
  const taken = m.taken_at
    ? new Date(m.taken_at * 1000).toISOString()
    : new Date().toISOString();
  const views = Number(m.play_count ?? m.view_count ?? 0);
  const likes = Number(m.like_count ?? 0);
  const comments = Number(m.comment_count ?? 0);
  const thumb = m.image_versions2?.candidates?.[0]?.url ?? null;
  const url = `https://www.instagram.com/reel/${m.code}/`;
  return {
    platform: "instagram",
    source: "trends",
    shortcode: m.code,
    external_id: String(m.pk ?? m.id ?? m.code),
    platform_video_id: String(m.pk ?? m.id ?? m.code),
    url,
    author_username: username,
    full_name: m.user?.full_name ?? null,
    is_verified: !!m.user?.is_verified,
    profile_pic_url: m.user?.profile_pic_url ?? null,
    author_avatar_url: m.user?.profile_pic_url ?? null,
    author_display_name: m.user?.full_name ?? null,
    caption: captionText,
    view_count: views,
    like_count: likes,
    comment_count: comments,
    views,
    likes,
    comments,
    thumbnail_url: thumb,
    cover_url: thumb,
    posted_at: taken,
    published_at: taken,
    viral_score: 0,
    is_broken: false,
    region: "world",
    fetched_at: new Date().toISOString(),
  };
}

function calcViralScore(v: MappedVideo): number {
  const hours = Math.max(
    1,
    (Date.now() - new Date(v.posted_at).getTime()) / 3_600_000,
  );
  return (v.view_count + v.like_count * 2 + v.comment_count * 3) / hours;
}

async function getCachedUserId(
  supabase: ReturnType<typeof createClient>,
  username: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("user_cache")
    .select("user_id")
    .eq("username", username)
    .maybeSingle();
  return (data as any)?.user_id ?? null;
}

async function fetchWithRetry(
  url: string,
  attempts = 3,
  baseDelay = 400,
): Promise<Response | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 12_000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);
      if (res.ok) return res;
      // Retry only on 5xx / 429
      if (res.status < 500 && res.status !== 429) return res;
      console.warn(`retry ${i + 1}/${attempts} -> ${res.status}`);
    } catch (e) {
      console.warn(`retry ${i + 1}/${attempts} net`, (e as Error).message);
    }
    await new Promise((r) => setTimeout(r, baseDelay * Math.pow(2, i)));
  }
  return null;
}

async function resolveUserId(
  supabase: ReturnType<typeof createClient>,
  username: string,
): Promise<string | null> {
  let userId = await getCachedUserId(supabase, username);
  if (userId) return userId;
  const res = await fetchWithRetry(
    `${EDA}/instagram/user/info?username=${encodeURIComponent(username)}&token=${TOKEN}`,
  );
  if (!res || !res.ok) return null;
  try {
    const json = await res.json();
    const pk = json?.data?.pk ?? json?.data?.user?.pk ?? json?.data?.id ?? null;
    if (!pk) return null;
    userId = String(pk);
    await supabase
      .from("user_cache")
      .upsert({ username, user_id: userId, resolved_at: new Date().toISOString() });
    return userId;
  } catch (e) {
    console.error(`resolve parse ${username}`, e);
    return null;
  }
}

async function fetchReels(userId: string): Promise<any[]> {
  const res = await fetchWithRetry(
    `${EDA}/instagram/user/reels?user_id=${userId}&depth=1&chunk_size=10&include_feed_video=true&token=${TOKEN}`,
  );
  if (!res || !res.ok) return [];
  try {
    const json = await res.json();
    return json?.data?.reels ?? [];
  } catch (e) {
    console.error(`fetchReels parse ${userId}`, e);
    return [];
  }
}

// Process items in parallel chunks. Errors per item are swallowed so one
// failure doesn't abort the whole batch.
async function processInChunks<T, R>(
  items: T[],
  chunkSize: number,
  worker: (item: T) => Promise<R | null>,
): Promise<(R | null)[]> {
  const out: (R | null)[] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const slice = items.slice(i, i + chunkSize);
    const results = await Promise.all(
      slice.map((it) => worker(it).catch((e) => {
        console.error("chunk worker error", e);
        return null;
      })),
    );
    out.push(...results);
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const startedAt = new Date().toISOString();
  let logId: string | null = null;
  let callerId: string | null = null;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");

    const userClient = createClient(SUPABASE_URL, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) throw new Error("Unauthorized");
    callerId = userData.user.id;

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("refresh-trends auth failed", e);
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Log start
  const { data: logRow } = await adminClient
    .from("trend_refresh_logs")
    .insert({ status: "running", mode: "ig-viral", started_at: startedAt, triggered_by: callerId })
    .select()
    .single();
  logId = (logRow as any)?.id ?? null;

  // Background job — return 202 immediately so Edge runtime doesn't time out at 150s.
  // Strategy: process accounts in parallel chunks of 5 (with retries baked in),
  // then upsert videos in batches of 25 so partial progress is preserved.
  const ACCOUNT_CHUNK = 5;
  const INSERT_BATCH = 25;

  const runJob = async () => {
    try {
      // 1) Fetch reels for all accounts in parallel chunks
      const reelLists = await processInChunks(
        VIRAL_ACCOUNTS,
        ACCOUNT_CHUNK,
        async (username) => {
          const userId = await resolveUserId(adminClient, username);
          if (!userId) return [] as any[];
          return await fetchReels(userId);
        },
      );
      const allReels = reelLists.flat().filter(Boolean) as any[];

      // 2) Dedupe by shortcode
      const unique = new Map<string, any>();
      for (const r of allReels) {
        const code = r?.media?.code ?? r?.code;
        if (code && !unique.has(code)) unique.set(code, r);
      }

      // 3) Map + filter + score + sort + cap
      const videos = [...unique.values()]
        .map(mapReel)
        .filter((v): v is MappedVideo => v !== null && v.view_count >= MIN_VIEWS)
        .map((v) => ({ ...v, viral_score: calcViralScore(v) }))
        .sort((a, b) => b.viral_score - a.viral_score)
        .slice(0, MAX_VIDEOS);

      // 4) Replace previous trend rows
      await adminClient
        .from("videos")
        .delete()
        .eq("source", "trends")
        .eq("platform", "instagram");

      // 5) Insert in batches so a transient error doesn't lose everything
      let inserted = 0;
      for (let i = 0; i < videos.length; i += INSERT_BATCH) {
        const batch = videos.slice(i, i + INSERT_BATCH);
        let attempt = 0;
        while (attempt < 3) {
          const { error: insErr } = await adminClient.from("videos").insert(batch);
          if (!insErr) { inserted += batch.length; break; }
          attempt++;
          console.warn(`insert batch retry ${attempt}/3`, insErr.message);
          await new Promise((r) => setTimeout(r, 500 * attempt));
          if (attempt === 3) console.error("insert batch failed permanently", insErr);
        }
      }

      if (logId) {
        await adminClient
          .from("trend_refresh_logs")
          .update({
            status: "completed",
            finished_at: new Date().toISOString(),
            total_saved: inserted,
            general_saved: inserted,
            niche_stats: {
              accounts_polled: VIRAL_ACCOUNTS.length,
              raw_reels: allReels.length,
              chunk_size: ACCOUNT_CHUNK,
              insert_batch: INSERT_BATCH,
            },
          })
          .eq("id", logId);
      }
    } catch (e: any) {
      console.error("refresh-trends background error", e);
      if (logId) {
        await adminClient
          .from("trend_refresh_logs")
          .update({
            status: "failed",
            finished_at: new Date().toISOString(),
            error_message: String(e?.message ?? e),
          })
          .eq("id", logId);
      }
    }
  };

  // @ts-ignore — EdgeRuntime exists in Supabase Edge runtime
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
    // @ts-ignore
    EdgeRuntime.waitUntil(runJob());
  } else {
    runJob();
  }

  return new Response(
    JSON.stringify({
      ok: true,
      queued: true,
      log_id: logId,
      accounts: VIRAL_ACCOUNTS.length,
      message: "Запущено в фоне — обновлено будет через 1–3 минуты",
    }),
    { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
