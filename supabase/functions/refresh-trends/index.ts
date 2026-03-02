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

    // KZ + CIS search queries for fresh content
    const kzQueries = [
      // Казахстан хэштеги
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
      "#қазақстайл", "#казахстанстиль", "#kzstyle",
      "#қазақфуд", "#казахстанеда", "#kzfood",
      "#қазақспорт", "#казахстанспорт", "#kzsport",
      "#қазақбизнес", "#казахстанбизнес", "#kzbusiness",
      "#қазақмотивация", "#казахстанмотивация", "#kzmotivation",
      "#қазақтревел", "#казахстанпутешествие", "#kztravel",
      "#қазақбьюти", "#казахстанкрасота", "#kzbeauty",
      "#қазақавто", "#казахстанавто", "#kzauto",
      "#қазақфитнес", "#казахстанфитнес", "#kzfitness",
      "#қазақрецепт", "#казахстанрецепт", "#kzrecipe",
      "#қазақтой", "#казахстансвадьба", "#kzwedding",
      "#қазақмода", "#казахстанмода", "#kzfashion",
      "#димаш", "#dimash", "#кайрат", "#казахстанзвезды",
      "#манғыстау", "#түркістан", "#балхаш", "#бурабай",
      "#қазақстанlife", "#kzlife", "#казреелс",
      // Казахстан фразы
      "қазақ тикток тренд", "қазақша тренд 2026", "қазақстан вирал",
      "казахстан тренд тикток", "алматы тренд тикток", "астана тренд тикток",
      "казахстан вирусное видео", "казахстан юмор тикток",

      // === СНГ СТРАНЫ ===

      // Россия
      "#россия", "#москва", "#питер", "#спб", "#рф",
      "#русскийтикток", "#россиятренд", "#русскийвайн",
      "#российскийтикток", "#москватикток", "#питертикток",
      "#русскийюмор", "#русскиеприколы", "#россиявирал",
      "#рекомендации", "#длятебя", "#русскиймем",
      "#русскаямузыка", "#русскийтренд", "#россияfyp",
      "россия тренд тикток", "русский тикток вирал 2026",
      "москва тренд тикток", "русские приколы тикток",

      // Узбекистан
      "#узбекистан", "#ташкент", "#самарканд", "#бухара",
      "#узбекскийтикток", "#узбекистантренд", "#узбекистанвирал",
      "#uzbekistan", "#uztiktok", "#узбекприкол", "#узбекюмор",
      "#узбекмузыка", "#узбекистанfyp", "#ozbek", "#ozbekiston",
      "#узбекистантанцы", "#узбекистанмем", "#узбекблогер",
      "узбекистан тренд тикток", "узбекский тикток вирал",

      // Кыргызстан
      "#кыргызстан", "#бишкек", "#кыргыз", "#kyrgyzstan",
      "#кыргызтикток", "#кыргызстантренд", "#кыргызстанвирал",
      "#кыргызприкол", "#кыргызюмор", "#кыргызмузыка",
      "#кыргызстанfyp", "#kgtiktok", "#кыргызблогер",
      "кыргызстан тренд тикток", "кыргызский тикток вирал",

      // Таджикистан
      "#таджикистан", "#душанбе", "#таджик", "#tajikistan",
      "#таджикскийтикток", "#таджикистантренд", "#таджикистанвирал",
      "#таджикприкол", "#таджикюмор", "#таджикмузыка",
      "#таджикистанfyp", "#tjtiktok", "#таджикблогер",
      "таджикистан тренд тикток", "таджикский тикток вирал",

      // Туркменистан
      "#туркменистан", "#ашхабад", "#туркмен", "#turkmenistan",
      "#туркменскийтикток", "#туркменистантренд", "#tmtiktok",
      "туркменистан тренд тикток",

      // Азербайджан
      "#азербайджан", "#баку", "#azerbaijan", "#baku",
      "#азербайджантикток", "#азербайджантренд", "#азербайджанвирал",
      "#азерприкол", "#азерюмор", "#азермузыка", "#aztiktok",
      "#азербайджанfyp", "#азербайджанблогер",
      "азербайджан тренд тикток", "азербайджанский тикток вирал",

      // Армения
      "#армения", "#ереван", "#armenia", "#yerevan",
      "#армянскийтикток", "#армениятренд", "#армениявирал",
      "#армянприкол", "#армянюмор", "#армянмузыка", "#amtiktok",
      "армения тренд тикток", "армянский тикток вирал",

      // Грузия
      "#грузия", "#тбилиси", "#georgia", "#tbilisi",
      "#грузинскийтикток", "#грузиятренд", "#грузиявирал",
      "#грузинприкол", "#грузинюмор", "#getiktok",
      "грузия тренд тикток", "грузинский тикток вирал",

      // Беларусь
      "#беларусь", "#минск", "#belarus", "#minsk",
      "#белорусскийтикток", "#беларусьтренд", "#беларусьвирал",
      "#белорусприкол", "#белорусюмор", "#bytiktok",
      "беларусь тренд тикток", "белорусский тикток вирал",

      // Молдова
      "#молдова", "#кишинев", "#moldova", "#chisinau",
      "#молдоватикток", "#молдоватренд", "#молдовавирал",
      "#mdtiktok", "молдова тренд тикток",

      // Общие СНГ
      "#снг", "#снгтикток", "#снгвирал", "#снгтренд",
      "#снгприколы", "#снгюмор", "#снгмузыка", "#снгблогеры",
      "#постсоветское", "#русскоязычный", "#русскоязычныйтикток",
      "снг тренд тикток 2026", "снг вирусное видео", "снг приколы тикток",
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
      // Новые мировые хэштеги
      "#viralvideo", "#tiktok2026", "#trending2026", "#fypシ",
      "#memes", "#relatable", "#storytime", "#pov", "#grwm",
      "#ootd", "#asmr", "#satisfying", "#motivation", "#fitness",
      "#recipe", "#cooking", "#diy", "#tutorial", "#lifehack",
      "#skincare", "#makeup", "#haul", "#unboxing", "#review",
      "#gaming", "#anime", "#cosplay", "#booktok",
      "#gym", "#workout", "#transformation",
      "#cat", "#dog", "#pets", "#nature", "#travel",
      "#ai", "#tech", "#coding", "#entrepreneur", "#startup",
      "#investing", "#crypto", "#finance",
      // Фразы мировые
      "tiktok pov trending", "tiktok grwm viral", "tiktok storytime best",
      "tiktok asmr satisfying", "tiktok transformation viral",
      "tiktok meme compilation 2026", "tiktok couple goals",
      "tiktok cooking hack", "tiktok outfit ideas", "tiktok gym motivation",
    ];


    const searchAndSave = async (query: string, region: string) => {
      try {
        const data = await callSocialKit("/tiktok/search", {
          query,
          count: "50",
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

    const kzCount = mode === "lite" ? 8 : mode === "mass" ? 40 : 120;
    const worldCount = mode === "lite" ? 2 : mode === "mass" ? 10 : 30;

    const shuffledKz = kzQueries.sort(() => Math.random() - 0.5).slice(0, kzCount);
    const shuffledWorld = worldQueries.sort(() => Math.random() - 0.5).slice(0, worldCount);

    const allTasks = [
      ...shuffledKz.map(q => ({ q, region: "kz" })),
      ...shuffledWorld.map(q => ({ q, region: "world" })),
    ];

    const results: Record<string, number> = {};
    const BATCH_SIZE = mode === "mass" ? 5 : 5;

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    for (let i = 0; i < allTasks.length; i += BATCH_SIZE) {
      const batch = allTasks.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map(({ q, region }) => searchAndSave(q, region))
      );
      batch.forEach(({ q, region }, idx) => {
        const r = batchResults[idx];
        results[`${region}:${q}`] = r.status === "fulfilled" ? r.value : 0;
      });
      // Пауза между батчами чтобы не перегружать API
      if (i + BATCH_SIZE < allTasks.length) {
        await delay(1500);
      }
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
