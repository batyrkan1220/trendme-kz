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
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalized = email.trim().toLowerCase();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Use Supabase Admin API filter to check existence (efficient, no full scan)
    const { data, error } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1,
      // @ts-ignore - filter is supported by GoTrue but not always typed
      filter: `email.eq.${normalized}`,
    });

    if (error) throw error;

    let exists = (data?.users || []).some(
      (u: any) => (u.email || "").toLowerCase() === normalized
    );

    // Fallback: if filter not supported, do a paginated scan (cheap up to ~5k users)
    if (!exists && (data?.users || []).length === 0) {
      let page = 1;
      const perPage = 1000;
      while (true) {
        const { data: pg } = await adminClient.auth.admin.listUsers({ page, perPage });
        const batch = pg?.users || [];
        if (batch.some((u: any) => (u.email || "").toLowerCase() === normalized)) {
          exists = true;
          break;
        }
        if (batch.length < perPage) break;
        page += 1;
        if (page > 50) break;
      }
    }

    return new Response(JSON.stringify({ exists }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
