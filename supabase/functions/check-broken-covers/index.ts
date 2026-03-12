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
            const timeout = setTimeout(() => controller.abort(), 5000);
            const resp = await fetch(video.cover_url!, {
              method: "HEAD",
              signal: controller.signal,
              redirect: "follow",
            });
            clearTimeout(timeout);
            if (resp.status === 403 || resp.status === 404 || resp.status === 410) {
              return { id: video.id, broken: true };
            }
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

    let totalDeleted = 0;
    for (let i = 0; i < brokenIds.length; i += 50) {
      const ids = brokenIds.slice(i, i + 50);
      const { data, error: delErr } = await supabase
        .from("videos")
        .delete()
        .in("id", ids)
        .select("id");

      if (delErr) {
        console.error("Delete error:", delErr.message);
      } else {
        totalDeleted += data?.length ?? 0;
      }
    }

    console.log(`Deleted ${totalDeleted} broken-cover videos`);

    // Log results to cleanup_logs
    await supabase.from("cleanup_logs").insert({
      source: "server_cron",
      checked: videos.length,
      broken: brokenIds.length,
      deleted: totalDeleted,
    });

    return new Response(
      JSON.stringify({
        checked: videos.length,
        broken: brokenIds.length,
        deleted: totalDeleted,
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
