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

    // Debug: log response structure
    const topKeys = Object.keys(data || {});
    console.log(`EnsembleData response keys: ${JSON.stringify(topKeys)}`);
    if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
      console.log(`data.data keys: ${JSON.stringify(Object.keys(data.data))}`);
      if (data.data.videos) {
        console.log(`data.data.videos length: ${data.data.videos.length}`);
      }
    }

    // EnsembleData full-search may return data in different structures
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
    console.log(`EnsembleData returned ${rawVideos.length} videos`);
    if (rawVideos.length > 0) {
      console.log(`First video keys: ${JSON.stringify(Object.keys(rawVideos[0]))}`);
      console.log(`First video sample: ${JSON.stringify(rawVideos[0]).substring(0, 1500)}`);
    }

    // Normalize: EnsembleData wraps each video in { aweme_info: {...} }
    const videos = rawVideos.map((item: any) => {
      const v = item.aweme_info || item; // unwrap aweme_info
      const stats = v.statistics || v.stats || {};
      const author = v.author || {};
      const videoInfo = v.video || {};
      const avatarUrl = author.avatar_thumb?.url_list?.[0] || author.avatar_larger?.url_list?.[0] || "";
      const coverUrl = videoInfo.cover?.url_list?.[0] || videoInfo.origin_cover?.url_list?.[0] || "";
      const uniqueId = author.unique_id || author.uniqueId || "";
      const awemeId = v.aweme_id || v.id || "";

      return {
        id: awemeId,
        video_id: awemeId,
        aweme_id: awemeId,
        desc: v.desc || "",
        caption: v.desc || "",
        createTime: v.create_time || v.createTime || 0,
        stats: {
          views: stats.play_count ?? stats.playCount ?? 0,
          likes: stats.digg_count ?? stats.diggCount ?? 0,
          comments: stats.comment_count ?? stats.commentCount ?? 0,
          shares: stats.share_count ?? stats.shareCount ?? 0,
        },
        views: stats.play_count ?? stats.playCount ?? 0,
        likes: stats.digg_count ?? stats.diggCount ?? 0,
        comments: stats.comment_count ?? stats.commentCount ?? 0,
        shares: stats.share_count ?? stats.shareCount ?? 0,
        author: {
          uniqueId,
          unique_id: uniqueId,
          nickname: author.nickname || "",
          avatar: avatarUrl,
          avatarThumb: avatarUrl,
        },
        video: {
          cover: coverUrl,
          duration: videoInfo.duration || 0,
        },
        cover_url: coverUrl,
        url: `https://www.tiktok.com/@${uniqueId || "user"}/video/${awemeId}`,
      };
    });

    return json({ videos });
  } catch (err) {
    console.error("ensemble-search error:", err);
    return json({ error: "Unable to process request. Please try again later." }, 500);
  }
});
