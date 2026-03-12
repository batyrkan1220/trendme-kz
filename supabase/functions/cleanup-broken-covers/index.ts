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
    const { video_ids } = await req.json();

    if (!Array.isArray(video_ids) || video_ids.length === 0) {
      return new Response(JSON.stringify({ error: "video_ids required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ids = video_ids.slice(0, 50);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("videos")
      .delete()
      .in("id", ids)
      .select("id");

    const deleted = data?.length ?? 0;
    console.log(`Cleanup broken covers: deleted ${deleted}/${ids.length} videos`);

    // Log results to cleanup_logs
    await supabase.from("cleanup_logs").insert({
      source: "client_browser",
      checked: ids.length,
      broken: ids.length,
      deleted,
    });

    return new Response(
      JSON.stringify({ deleted, error: error?.message ?? null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("cleanup-broken-covers error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
