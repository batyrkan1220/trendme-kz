import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let batchSize = 200;
    let offset = 0;
    try {
      const body = await req.json();
      if (body.batch_size) batchSize = Math.min(body.batch_size, 500);
      if (body.offset) offset = body.offset;
    } catch {
      // defaults
    }

    const { data: videos, error: fetchErr } = await supabase
      .from("videos")
      .select("id, cover_url")
      .not("cover_url", "is", null)
      .order("fetched_at", { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (fetchErr) {
      console.error("Fetch error:", fetchErr.message);
      return new Response(
        JSON.stringify({ error: fetchErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!videos || videos.length === 0) {
      return new Response(
        JSON.stringify({ checked: 0, broken: 0, deleted: 0, message: "No videos to check" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Checking ${videos.length} covers (offset=${offset})...`);

    const CONCURRENCY = 20;
    const brokenIds: string[] = [];

    for (let i = 0; i < videos.length; i += CONCURRENCY) {
      const batch = videos.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map(async (video) => {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);
            // Use GET with Range header — TikTok CDN blocks HEAD requests
            const resp = await fetch(video.cover_url!, {
              method: "GET",
              headers: { "Range": "bytes=0-0" },
              signal: controller.signal,
              redirect: "follow",
            });
            clearTimeout(timeout);
            // 403/404/410 = truly broken; 416 (range not satisfiable) = file exists
            if (resp.status === 403 || resp.status === 404 || resp.status === 410) {
              // Consume body to prevent resource leak
              await resp.text().catch(() => {});
              return { id: video.id, broken: true };
            }
            await resp.text().catch(() => {});
            return { id: video.id, broken: false };
          } catch {
            return { id: video.id, broken: true };
          }
        })
      );

      for (const r of results) {
        if (r.status === "fulfilled" && r.value.broken) {
          brokenIds.push(r.value.id);
        }
      }
    }

    console.log(`Found ${brokenIds.length} broken covers out of ${videos.length} checked`);

    // Null out cover_url instead of deleting the video
    let totalCleaned = 0;
    for (let i = 0; i < brokenIds.length; i += 50) {
      const ids = brokenIds.slice(i, i + 50);
      const { data, error: updErr } = await supabase
        .from("videos")
        .update({ cover_url: null })
        .in("id", ids)
        .select("id");

      if (updErr) {
        console.error("Update error:", updErr.message);
      } else {
        totalCleaned += data?.length ?? 0;
      }
    }

    console.log(`Cleaned ${totalCleaned} broken-cover videos (set cover_url=null)`);

    // Log results to cleanup_logs
    await supabase.from("cleanup_logs").insert({
      source: "server_cron",
      checked: videos.length,
      broken: brokenIds.length,
      deleted: totalCleaned,
    });

    return new Response(
      JSON.stringify({
        checked: videos.length,
        broken: brokenIds.length,
        cleaned: totalCleaned,
        offset,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("check-broken-covers error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
