import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SOCIALKIT_BASE = "https://api.socialkit.dev";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const socialKitKey = Deno.env.get("SOCIALKIT_ACCESS_KEY")!;

    // Verify user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } =
      await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Service role client for writing to videos table
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { action } = body;

    const json = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    // SocialKit API helper
    const callSocialKit = async (path: string, params: Record<string, string>) => {
      const url = new URL(`${SOCIALKIT_BASE}${path}`);
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      const res = await fetch(url.toString(), {
        headers: { "x-access-key": socialKitKey },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`SocialKit error ${res.status}: ${text}`);
      }
      return res.json();
    };

    // Compute trend score for a video
    const computeTrend = (video: any) => {
      const createdAt = new Date(video.created_at || video.createTime * 1000);
      const hoursSince = Math.max(1, (Date.now() - createdAt.getTime()) / 3600000);
      const vViews = (video.views || video.playCount || 0) / hoursSince;
      const vLikes = (video.likes || video.diggCount || 0) / hoursSince;
      const vComments = (video.comments || video.commentCount || 0) / hoursSince;
      return {
        velocity_views: vViews,
        velocity_likes: vLikes,
        velocity_comments: vComments,
        trend_score: 0.6 * vViews + 0.3 * vLikes + 0.1 * vComments,
      };
    };

    switch (action) {
      case "search": {
        const { query, limit = 20 } = body;
        if (!query) return json({ error: "query is required" }, 400);

        const data = await callSocialKit("/tiktok/search", {
          query,
          count: String(limit),
        });

        console.log("SocialKit raw response keys:", Object.keys(data || {}));
        
        let videos: any[] = [];
        if (Array.isArray(data)) {
          videos = data;
        } else if (Array.isArray(data?.data?.results)) {
          videos = data.data.results;
        } else if (Array.isArray(data?.data)) {
          videos = data.data;
        } else if (Array.isArray(data?.items)) {
          videos = data.items;
        } else if (Array.isArray(data?.videos)) {
          videos = data.videos;
        } else if (Array.isArray(data?.result)) {
          videos = data.result;
        } else {
          console.log("SocialKit full response:", JSON.stringify(data).slice(0, 1000));
          videos = [];
        }

        if (videos.length > 0) {
          console.log("First video keys:", Object.keys(videos[0]));
          console.log("First video sample:", JSON.stringify(videos[0]).slice(0, 1500));
        }

        // Save search query
        const { data: queryRow } = await userClient
          .from("search_queries")
          .upsert(
            {
              user_id: userId,
              query_text: query,
              last_run_at: new Date().toISOString(),
              total_results_saved: videos.length,
            },
            { onConflict: "user_id,query_text", ignoreDuplicates: false }
          )
          .select()
          .single();

        // Upsert videos using service role
        const upsertedVideos = [];
        for (const v of videos) {
          const videoId = v.id || v.video_id || v.aweme_id;
          if (!videoId) continue;

          const trends = computeTrend(v);
          const stats = v.stats || {};
          const videoRow = {
            platform: "tiktok",
            platform_video_id: String(videoId),
            url: v.url || `https://www.tiktok.com/@${v.author?.uniqueId || "user"}/video/${videoId}`,
            caption: v.desc || v.caption || v.title || "",
            cover_url: v.video?.cover || v.cover_url || v.cover || v.originCover || "",
            author_username: v.author?.uniqueId || v.author?.unique_id || v.author_username || "",
            author_display_name: v.author?.nickname || v.author_display_name || "",
            author_avatar_url: v.author?.avatar || v.author?.avatarThumb || v.author_avatar_url || "",
            views: stats.views || v.views || v.playCount || 0,
            likes: stats.likes || v.likes || v.diggCount || 0,
            comments: stats.comments || v.comments || v.commentCount || 0,
            shares: stats.shares || v.shares || v.shareCount || 0,
            duration_sec: v.video?.duration || v.duration_sec || v.duration || null,
            fetched_at: new Date().toISOString(),
            source_query_id: queryRow?.id || null,
            ...trends,
          };

          const { data: upserted } = await adminClient
            .from("videos")
            .upsert(videoRow, { onConflict: "platform_video_id" })
            .select()
            .single();

          if (upserted) upsertedVideos.push(upserted);
        }

        // Activity log
        await userClient.from("activity_log").insert({
          user_id: userId,
          type: "search_run",
          payload_json: { query, results_count: upsertedVideos.length },
        });

        return json({ videos: upsertedVideos, query: queryRow });
      }

      case "video_stats": {
        const { video_url } = body;
        if (!video_url) return json({ error: "video_url is required" }, 400);

        const data = await callSocialKit("/tiktok/stats", { url: video_url });

        // Update video in DB if exists
        const videoData = data.data || data;
        if (videoData) {
          const videoId = videoData.id || videoData.video_id || videoData.aweme_id;
          if (videoId) {
            const trends = computeTrend(videoData);
            await adminClient
              .from("videos")
              .update({
                views: videoData.playCount || videoData.views || 0,
                likes: videoData.diggCount || videoData.likes || 0,
                comments: videoData.commentCount || videoData.comments || 0,
                shares: videoData.shareCount || videoData.shares || 0,
                fetched_at: new Date().toISOString(),
                ...trends,
              })
              .eq("platform_video_id", String(videoId));
          }
        }

        return json(videoData);
      }

      case "analyze_video": {
        const { video_url } = body;
        if (!video_url) return json({ error: "video_url is required" }, 400);

        // Call all three endpoints
        const [summary, transcript, commentsData] = await Promise.allSettled([
          callSocialKit("/tiktok/summarize", { url: video_url }),
          callSocialKit("/tiktok/transcript", { url: video_url }),
          callSocialKit("/tiktok/comments", { url: video_url }),
        ]);

        const result = {
          summary_json: summary.status === "fulfilled" ? summary.value : null,
          transcript_text:
            transcript.status === "fulfilled"
              ? typeof transcript.value === "string"
                ? transcript.value
                : JSON.stringify(transcript.value)
              : null,
          comments_json:
            commentsData.status === "fulfilled" ? commentsData.value : null,
        };

        // Save analysis
        const { data: analysis } = await userClient
          .from("video_analysis")
          .insert({
            user_id: userId,
            video_url,
            ...result,
            analyzed_at: new Date().toISOString(),
          })
          .select()
          .single();

        // Activity log
        await userClient.from("activity_log").insert({
          user_id: userId,
          type: "video_analysis",
          payload_json: { video_url },
        });

        return json(analysis);
      }

      case "account_stats": {
        const { profile_url } = body;
        if (!profile_url)
          return json({ error: "profile_url is required" }, 400);

        const data = await callSocialKit("/tiktok/channel-stats", {
          url: profile_url,
        });

        const accountData = data.data || data;

        // Upsert account
        const username =
          accountData.uniqueId ||
          accountData.unique_id ||
          accountData.username ||
          profile_url.split("@").pop()?.split("?")[0] ||
          "";

        const { data: account } = await userClient
          .from("accounts_tracked")
          .upsert(
            {
              user_id: userId,
              profile_url,
              username,
              avatar_url: accountData.avatarThumb || accountData.avatar_url || "",
              followers: accountData.followerCount || accountData.followers || 0,
              following: accountData.followingCount || accountData.following || 0,
              total_likes: accountData.heartCount || accountData.total_likes || 0,
              total_videos: accountData.videoCount || accountData.total_videos || 0,
              verified: accountData.verified || false,
              bio: accountData.signature || accountData.bio || "",
              bio_link: accountData.bioLink?.link || accountData.bio_link || "",
              fetched_at: new Date().toISOString(),
            },
            { onConflict: "user_id,username" }
          )
          .select()
          .single();

        // Activity log
        await userClient.from("activity_log").insert({
          user_id: userId,
          type: "account_analysis",
          payload_json: { profile_url, username },
        });

        return json(account);
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
