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
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");
    
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) throw new Error("Unauthorized");
    const user = { id: claimsData.claims.sub as string };

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

      // Get all active subscriptions with plan info
      const { data: allSubs } = await adminClient
        .from("user_subscriptions")
        .select("*, plans(*)")
        .eq("is_active", true);

      // Get all token balances
      const { data: allTokens } = await adminClient.from("user_tokens").select("*");

      const enriched = users
        .filter((u: any) => !search || u.email?.toLowerCase().includes(search.toLowerCase()))
        .map((u: any) => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          roles: (allRoles || []).filter((r: any) => r.user_id === u.id).map((r: any) => r.role),
          subscription: (allSubs || []).find((s: any) => s.user_id === u.id) || null,
          tokens: (allTokens || []).find((t: any) => t.user_id === u.id) || null,
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

    // ==================== PLANS CRUD ====================

    // LIST PLANS
    if (req.method === "GET" && action === "list-plans") {
      const { data, error } = await adminClient
        .from("plans")
        .select("*")
        .order("sort_order");
      if (error) throw error;

      return new Response(JSON.stringify({ plans: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CREATE/UPDATE PLAN
    if (req.method === "POST" && action === "upsert-plan") {
      const plan = await req.json();
      const { error } = await adminClient.from("plans").upsert(plan);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE PLAN
    if (req.method === "POST" && action === "delete-plan") {
      const { plan_id } = await req.json();
      if (!plan_id) throw new Error("plan_id required");

      const { error } = await adminClient.from("plans").delete().eq("id", plan_id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ==================== SUBSCRIPTIONS ====================

    // ASSIGN SUBSCRIPTION
    if (req.method === "POST" && action === "assign-subscription") {
      const { user_id, plan_id, duration_days, note } = await req.json();
      if (!user_id || !plan_id) throw new Error("user_id and plan_id required");

      // Deactivate existing subscriptions
      await adminClient
        .from("user_subscriptions")
        .update({ is_active: false })
        .eq("user_id", user_id)
        .eq("is_active", true);

      const expires_at = new Date(Date.now() + (duration_days || 30) * 86400000).toISOString();

      const { error } = await adminClient.from("user_subscriptions").insert({
        user_id,
        plan_id,
        expires_at,
        assigned_by: user.id,
        note: note || null,
      });
      if (error) throw error;

      // Auto-credit tokens based on plan's tokens_included
      const { data: planData } = await adminClient.from("plans").select("tokens_included, name").eq("id", plan_id).single();
      const tokensToAdd = planData?.tokens_included || 0;
      if (tokensToAdd > 0) {
        const { data: current } = await adminClient.from("user_tokens").select("balance, total_earned").eq("user_id", user_id).maybeSingle();
        if (current) {
          await adminClient.from("user_tokens").update({
            balance: current.balance + tokensToAdd,
            total_earned: current.total_earned + tokensToAdd,
            updated_at: new Date().toISOString(),
          }).eq("user_id", user_id);
        } else {
          await adminClient.from("user_tokens").insert({ user_id, balance: tokensToAdd, total_earned: tokensToAdd });
        }
        await adminClient.from("token_transactions").insert({
          user_id,
          amount: tokensToAdd,
          action_type: "plan_bonus",
          description: `Начисление за тариф «${planData?.name || ""}»`,
        });
      }

      return new Response(JSON.stringify({ success: true, tokens_added: tokensToAdd }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // REVOKE SUBSCRIPTION
    if (req.method === "POST" && action === "revoke-subscription") {
      const { subscription_id } = await req.json();
      if (!subscription_id) throw new Error("subscription_id required");

      const { error } = await adminClient
        .from("user_subscriptions")
        .update({ is_active: false })
        .eq("id", subscription_id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // LIST SUBSCRIPTIONS
    if (req.method === "GET" && action === "list-subscriptions") {
      const { data, error } = await adminClient
        .from("user_subscriptions")
        .select("*, plans(name, price_rub)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;

      // Enrich with user emails
      const userIds = [...new Set((data || []).map((s: any) => s.user_id))];
      const { data: { users: allUsers } } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const userMap: Record<string, string> = {};
      for (const u of allUsers || []) {
        userMap[u.id] = u.email || "";
      }

      const enriched = (data || []).map((s: any) => ({
        ...s,
        user_email: userMap[s.user_id] || "unknown",
      }));

      return new Response(JSON.stringify({ subscriptions: enriched }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // UPDATE USER TOKENS
    if (req.method === "POST" && action === "update-tokens") {
      const { user_id, amount, description } = await req.json();
      if (!user_id || amount === undefined) throw new Error("user_id and amount required");

      // Update balance
      const { data: current } = await adminClient
        .from("user_tokens")
        .select("balance")
        .eq("user_id", user_id)
        .maybeSingle();

      if (!current) {
        // Create token record if missing
        await adminClient.from("user_tokens").insert({
          user_id,
          balance: Math.max(0, amount),
          total_earned: amount > 0 ? amount : 0,
        });
      } else {
        const newBalance = current.balance + amount;
        const updateData: any = { balance: Math.max(0, newBalance), updated_at: new Date().toISOString() };
        if (amount > 0) updateData.total_earned = (current as any).total_earned + amount;
        else updateData.total_spent = (current as any).total_spent + Math.abs(amount);
        await adminClient.from("user_tokens").update(updateData).eq("user_id", user_id);
      }

      // Log transaction
      await adminClient.from("token_transactions").insert({
        user_id,
        amount,
        action_type: amount > 0 ? "admin_credit" : "admin_debit",
        description: description || (amount > 0 ? "Начисление администратором" : "Списание администратором"),
      });

      return new Response(JSON.stringify({ success: true }), {
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
