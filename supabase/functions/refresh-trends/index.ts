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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const socialKitKey = Deno.env.get("SOCIALKIT_ACCESS_KEY")!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

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

    const getPublishedAt = (video: any): string => {
      if (video.createTime) return new Date(video.createTime * 1000).toISOString();
      if (video.created_at) return new Date(video.created_at).toISOString();
      if (video.create_time) return new Date(video.create_time * 1000).toISOString();
      return new Date().toISOString();
    };

    const computeTrend = (video: any) => {
      const stats = video.stats || {};
      const publishedAt = new Date(getPublishedAt(video));
      const hoursSince = Math.max(1, (Date.now() - publishedAt.getTime()) / 3600000);
      const vViews = (stats.views || video.views || video.playCount || 0) / hoursSince;
      const vLikes = (stats.likes || video.likes || video.diggCount || 0) / hoursSince;
      const vComments = (stats.comments || video.comments || video.commentCount || 0) / hoursSince;
      return {
        velocity_views: vViews,
        velocity_likes: vLikes,
        velocity_comments: vComments,
        trend_score: 0.6 * vViews + 0.3 * vLikes + 0.1 * vComments,
        published_at: publishedAt.toISOString(),
      };
    };

    // KZ search queries for fresh content
    const kzQueries = [
      // Хэштеги казахские
      "#қазақ", "#қазақстан", "#қазақша", "#kz", "#казахстан",
      "#алматы", "#астана", "#шымкент", "#караганда", "#актау",
      "#атырау", "#павлодар", "#семей", "#костанай", "#тараз",
      "#актобе", "#орал", "#петропавл", "#кызылорда", "#талдыкорган",
      "#казахстантикток", "#kztiktok", "#қазақтикток", "#казахстантренд",
      "#kztrend", "#қазақвайн", "#казвайн", "#қазақприкол", "#казприкол",
      "#қазақхит", "#казахстанхит", "#kzviral", "#қазақвирал",
      "#казахстанвирал", "#kzfyp", "#қазақfyp", "#казахстанfyp",
      "#қазақмузыка", "#казахстанмузыка", "#kzmusic",
      "#қазақтанцы", "#казахстантанцы", "#kzdance",
      "#қазақчеллендж", "#казахстанчеллендж", "#kzchallenge",
      "#қазақкомедия", "#казахстанкомедия", "#kzcomedy",
      "#қазақблогер", "#казахстанблогер", "#kzblogger",
      "#қазақәндер", "#казахстанпесни", "#kzsong",
      "#алматылайф", "#астаналайф", "#шымкентлайф",
      "#қазақмем", "#казахстанмем", "#kzmeme",
      "#қазақжастар", "#казахстанмолодежь", "#kzyouth",
      "#қазақстайл", "#казахстанстиль", "#kzstyle",
      "#қазақфуд", "#казахстанеда", "#kzfood",
      "#қазақспорт", "#казахстанспорт", "#kzsport",
      "#қазақбизнес", "#казахстанбизнес", "#kzbusiness",
      "#қазақмотивация", "#казахстанмотивация", "#kzmotivation",
      "#қазақтревел", "#казахстанпутешествие", "#kztravel",
      "#қазақбьюти", "#казахстанкрасота", "#kzbeauty",
      "#қазақавто", "#казахстанавто", "#kzauto",
      "#қазақгейм", "#казахстанигры", "#kzgaming",
      "#қазақфитнес", "#казахстанфитнес", "#kzfitness",
      "#қазақрецепт", "#казахстанрецепт", "#kzrecipe",
      "#қазақтой", "#казахстансвадьба", "#kzwedding",
      "#қазақмода", "#казахстанмода", "#kzfashion",
      "#димаш", "#dimash", "#кайрат", "#казахстанзвезды",
      "#қазақскетч", "#казахстанскетч",
      // Слова казахские
      "қазақ тикток тренд", "қазақша тренд 2026", "қазақстан вирал",
      "қазақша приколдар", "қазақша вайн", "қазақша күлкілі",
      "қазақ жастары", "қазақша әндер хит", "қазақша челлендж",
      "қазақ дизайн", "қазақ той", "қазақ мода",
      // Слова русские
      "казахстан тренд тикток", "алматы тренд тикток", "астана тренд тикток",
      "казакша приколы", "казахстан вайн 2026", "казахстан вирусное видео",
      "казахстан юмор тикток", "казахстан танцы тренд", "шымкент тренд тикток",
      "караганда тикток", "казахстан челлендж", "казахстан музыка тренд",
      "казахский тикток популярное", "казахстан блогеры тренд",
      "казахстан мем тикток", "казахстан мотивация", "казахстан спорт тикток",
      "казахстан еда рецепт", "казахстан путешествие", "казахстан авто тикток",
      "казахстан бизнес тикток", "казахстан красота тикток",
      "казахстан свадьба тикток", "казахстан фитнес",
      // English
      "kazakhstan viral tiktok", "kazakhstan trending 2026", "almaty viral",
      "astana tiktok trend", "kazakh tiktok", "kz fyp viral",
      "kazakhstan dance challenge", "kazakh music trending",
      "kazakhstan comedy tiktok", "kazakhstan food tiktok",
    ];

    // World search queries
    const worldQueries = [
      "trending viral tiktok", "fyp trending 2026", "dance trend tiktok",
      "funny viral video", "tiktok challenge trending", "viral music tiktok",
      "#viral", "#trending", "#fyp", "#foryou", "#foryoupage",
      "#dance", "#funny", "#comedy", "#music", "#challenge",
      "#duet", "#trend", "#tiktokviral", "#explore",
      "tiktok viral 2026", "best tiktok trends", "new tiktok challenge",
      "tiktok dance 2026", "viral comedy tiktok", "tiktok music hit",
      "satisfying tiktok", "tiktok life hacks", "tiktok food viral",
      "tiktok fashion trend", "tiktok beauty viral", "tiktok sports viral",
      "tiktok pet viral", "tiktok art trending", "tiktok travel viral",
    ];

    const searchAndSave = async (query: string, region: string) => {
      try {
        const data = await callSocialKit("/tiktok/search", {
          query,
          count: "30",
        });

        let videos: any[] = [];
        if (Array.isArray(data)) videos = data;
        else if (Array.isArray(data?.data?.results)) videos = data.data.results;
        else if (Array.isArray(data?.data)) videos = data.data;
        else if (Array.isArray(data?.items)) videos = data.items;
        else if (Array.isArray(data?.videos)) videos = data.videos;
        else if (Array.isArray(data?.result)) videos = data.result;
        else videos = [];

        let saved = 0;
        for (const v of videos) {
          const videoId = v.id || v.video_id || v.aweme_id;
          if (!videoId) continue;

          const trends = computeTrend(v);

          // Skip videos older than 7 days
          const publishedDate = new Date(trends.published_at);
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000);
          if (publishedDate < sevenDaysAgo) continue;

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
            region,
            ...trends,
          };

          const { error } = await adminClient
            .from("videos")
            .upsert(videoRow, { onConflict: "platform_video_id" });

          if (!error) saved++;
        }
        return saved;
      } catch (err) {
        console.error(`Search failed for "${query}":`, err.message);
        return 0;
      }
    };

    // Check mode: lite, mass, or full (cron)
    let mode = "full";
    try {
      const body = await req.json();
      if (body?.lite) mode = "lite";
      else if (body?.mass) mode = "mass";
    } catch { /* no body = cron call */ }

    const kzCount = mode === "lite" ? 8 : mode === "mass" ? kzQueries.length : 80;
    const worldCount = mode === "lite" ? 2 : mode === "mass" ? worldQueries.length : 20;

    const shuffledKz = kzQueries.sort(() => Math.random() - 0.5).slice(0, kzCount);
    const shuffledWorld = worldQueries.sort(() => Math.random() - 0.5).slice(0, worldCount);

    const allTasks = [
      ...shuffledKz.map(q => ({ q, region: "kz" })),
      ...shuffledWorld.map(q => ({ q, region: "world" })),
    ];

    const results: Record<string, number> = {};
    const BATCH_SIZE = mode === "mass" ? 10 : 5;

    for (let i = 0; i < allTasks.length; i += BATCH_SIZE) {
      const batch = allTasks.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map(({ q, region }) => searchAndSave(q, region))
      );
      batch.forEach(({ q, region }, idx) => {
        const r = batchResults[idx];
        results[`${region}:${q}`] = r.status === "fulfilled" ? r.value : 0;
      });
    }

    console.log("Refresh trends completed, mode:", mode, "total queries:", allTasks.length);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Refresh trends error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
