import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ENSEMBLE_BASE = "https://ensembledata.com/apis";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (data: any, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ensembleToken = Deno.env.get("ENSEMBLE_DATA_TOKEN");

    if (!ensembleToken) {
      return json({ error: "ENSEMBLE_DATA_TOKEN not configured" }, 500);
    }

    // Verify user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    // Admin check
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleCheck } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleCheck) return json({ error: "Admin access required" }, 403);

    const body = await req.json();
    const { query, period = "0", sorting = "0", country = "us" } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return json({ error: "query is required" }, 400);
    }

    // EnsembleData sorting: 0 = relevance, 1 = likes, 2 = date
    // Our UI: "3" = by date, "1" = by likes, "0" = relevance
    let edSorting = "0";
    if (sorting === "3" || sorting === "2") edSorting = "2";
    else if (sorting === "1") edSorting = "1";

    // EnsembleData period: 0 = all, 1 = 1 day, 7 = 7 days, 30 = 30 days, 90, 180
    let edPeriod = period;
    // Map our "0" to "0" (all time)
    if (!["0", "1", "7", "30", "90", "180"].includes(edPeriod)) {
      edPeriod = "0";
    }

    console.log(`EnsembleData search: query="${query.trim()}", period=${edPeriod}, sorting=${edSorting}, country=${country}`);

    // Call EnsembleData full keyword search (handles pagination automatically)
    const params = new URLSearchParams({
      name: query.trim(),
      period: edPeriod,
      sorting: edSorting,
      country,
      match_exactly: "false",
      token: ensembleToken,
    });

    const url = `${ENSEMBLE_BASE}/tt/keyword/full-search?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) {
      const errText = await res.text();
      console.error(`EnsembleData error ${res.status}: ${errText}`);
      return json({ error: `EnsembleData API error: ${res.status}` }, 502);
    }

    const data = await res.json();

    // EnsembleData returns { data: [...], ... } with video items
    // Each item has: id, desc, createTime, stats { diggCount, playCount, commentCount, shareCount },
    // author { uniqueId, nickname, avatarThumb }, video { cover, duration }
    const rawVideos = data?.data || [];
    console.log(`EnsembleData returned ${rawVideos.length} videos`);

    // Normalize to a consistent format for the frontend
    const videos = rawVideos.map((v: any) => {
      const stats = v.stats || {};
      const author = v.author || {};
      const video = v.video || {};
      
      return {
        id: v.id || v.aweme_id || "",
        video_id: v.id || v.aweme_id || "",
        aweme_id: v.id || v.aweme_id || "",
        desc: v.desc || "",
        caption: v.desc || "",
        createTime: v.createTime || v.create_time || 0,
        stats: {
          views: stats.playCount ?? stats.play_count ?? 0,
          likes: stats.diggCount ?? stats.digg_count ?? 0,
          comments: stats.commentCount ?? stats.comment_count ?? 0,
          shares: stats.shareCount ?? stats.share_count ?? 0,
        },
        views: stats.playCount ?? stats.play_count ?? 0,
        likes: stats.diggCount ?? stats.digg_count ?? 0,
        comments: stats.commentCount ?? stats.comment_count ?? 0,
        shares: stats.shareCount ?? stats.share_count ?? 0,
        author: {
          uniqueId: author.uniqueId || author.unique_id || "",
          unique_id: author.uniqueId || author.unique_id || "",
          nickname: author.nickname || "",
          avatar: author.avatarThumb || author.avatar_thumb || "",
          avatarThumb: author.avatarThumb || author.avatar_thumb || "",
        },
        video: {
          cover: video.cover || video.originCover || "",
          duration: video.duration || 0,
        },
        cover_url: video.cover || video.originCover || "",
        url: `https://www.tiktok.com/@${author.uniqueId || author.unique_id || "user"}/video/${v.id || v.aweme_id || ""}`,
      };
    });

    return json({ videos });
  } catch (err) {
    console.error("ensemble-search error:", err);
    return json({ error: "Unable to process request. Please try again later." }, 500);
  }
});
