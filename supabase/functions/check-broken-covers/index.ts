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
    // Validate JWT - require admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = adminClient;

    // 1. Delete videos with null cover_url
    const { data: nullCovers, error: nullErr } = await supabase
      .from("videos")
      .delete()
      .is("cover_url", null)
      .select("id");

    const nullDeleted = nullCovers?.length ?? 0;
    if (nullErr) console.error("Null cover delete error:", nullErr.message);
    else console.log(`Deleted ${nullDeleted} videos with null cover_url`);

    // 2. Delete videos older than 14 days
    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: oldVideos, error: oldErr } = await supabase
      .from("videos")
      .delete()
      .lt("fetched_at", cutoff)
      .select("id");

    const oldDeleted = oldVideos?.length ?? 0;
    if (oldErr) console.error("Old video delete error:", oldErr.message);
    else console.log(`Deleted ${oldDeleted} videos older than 14 days`);

    const totalDeleted = nullDeleted + oldDeleted;

    await supabase.from("cleanup_logs").insert({
      source: "server_cron",
      checked: nullDeleted + oldDeleted,
      broken: nullDeleted,
      deleted: totalDeleted,
    });

    return new Response(
      JSON.stringify({
        null_covers_deleted: nullDeleted,
        old_videos_deleted: oldDeleted,
        total_deleted: totalDeleted,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("check-broken-covers error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
