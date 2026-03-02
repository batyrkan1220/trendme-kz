import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Check admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Forbidden");

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // LIST USERS
    if (req.method === "GET" && action === "list") {
      const page = parseInt(url.searchParams.get("page") || "1");
      const perPage = 50;
      const search = url.searchParams.get("search") || "";

      const { data: { users }, error } = await adminClient.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error) throw error;

      // Get all roles
      const { data: allRoles } = await adminClient.from("user_roles").select("*");

      const enriched = users
        .filter((u: any) => !search || u.email?.toLowerCase().includes(search.toLowerCase()))
        .map((u: any) => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          roles: (allRoles || []).filter((r: any) => r.user_id === u.id).map((r: any) => r.role),
        }));

      return new Response(JSON.stringify({ users: enriched, total: users.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ASSIGN ROLE
    if (req.method === "POST" && action === "assign-role") {
      const { user_id, role } = await req.json();
      if (!user_id || !role) throw new Error("user_id and role required");

      const { error } = await adminClient.from("user_roles").upsert(
        { user_id, role },
        { onConflict: "user_id,role" }
      );
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // REMOVE ROLE
    if (req.method === "POST" && action === "remove-role") {
      const { user_id, role } = await req.json();
      if (!user_id || !role) throw new Error("user_id and role required");

      const { error } = await adminClient
        .from("user_roles")
        .delete()
        .eq("user_id", user_id)
        .eq("role", role);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PLATFORM STATS
    if (req.method === "GET" && action === "platform-stats") {
      const { count: totalUsers } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 });
      
      const { count: totalVideos } = await adminClient
        .from("videos")
        .select("*", { count: "exact", head: true });

      const { count: totalFavorites } = await adminClient
        .from("favorites")
        .select("*", { count: "exact", head: true });

      const { count: totalScripts } = await adminClient
        .from("saved_scripts")
        .select("*", { count: "exact", head: true });

      const { count: totalAnalyses } = await adminClient
        .from("video_analysis")
        .select("*", { count: "exact", head: true });

      const { count: totalSearches } = await adminClient
        .from("search_queries")
        .select("*", { count: "exact", head: true });

      const { count: totalAccounts } = await adminClient
        .from("accounts_tracked")
        .select("*", { count: "exact", head: true });

      // Recent activity (last 24h)
      const dayAgo = new Date(Date.now() - 86400000).toISOString();
      const { data: recentActivity } = await adminClient
        .from("activity_log")
        .select("type")
        .gte("created_at", dayAgo);

      const activityBreakdown: Record<string, number> = {};
      for (const a of recentActivity || []) {
        activityBreakdown[a.type] = (activityBreakdown[a.type] || 0) + 1;
      }

      // Users who signed in last 7 days
      const { data: { users: allUsers } } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const activeUsers = (allUsers || []).filter(
        (u: any) => u.last_sign_in_at && u.last_sign_in_at > weekAgo
      ).length;

      return new Response(JSON.stringify({
        totalUsers: allUsers?.length || 0,
        activeUsers,
        totalVideos,
        totalFavorites,
        totalScripts,
        totalAnalyses,
        totalSearches,
        totalAccounts,
        activityBreakdown,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unknown action");
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
