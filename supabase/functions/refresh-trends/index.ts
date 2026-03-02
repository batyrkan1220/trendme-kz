import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOCIALKIT_BASE = "https://api.socialkit.dev";

// Extra general KZ/CIS queries to fill gaps
const GENERAL_KZ_QUERIES = [
  "#қазақстан", "#kz", "#казахстан", "#алматы", "#астана",
  "#казахстантренд", "#kztiktok", "#снг", "#рекомендации",
  "қазақ тикток тренд", "казахстан тренд тикток 2026",
  "#қазақша", "#қазақтикток", "#kzviral", "#қазақвирал",
  "қазақстан вирал 2026", "#шымкент", "#караганда", "#актау",
  "#қарағанды", "#атырау", "#павлодар", "#тараз", "#өскемен",
  "#қостанай", "#семей", "#маңғыстау", "#түркістан",
  "қазақ блогер тикток", "казахстан влог", "#kztrend",
  "қазақша тикток 2026", "#қазақвайн", "#казахстанвирал",
  "алматы влог 2026", "астана тренд", "#almaty", "#astana",
  "казахстанский тикток", "#қазақстантікток", "#kzfyp",
  "#казнет", "#qazaqstan", "кз тренды", "#kzreels",
  "қазақстандық тікток", "#казахскийтикток", "казакша видео",
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const socialKitKey = Deno.env.get("SOCIALKIT_ACCESS_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const isCronCall = token === serviceRoleKey;
    let userId: string | null = null;

    if (isCronCall) {
      console.log("Cron call detected (service_role key)");
    } else {
      const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = claimsData.claims.sub as string;
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // ===== Load niche queries from DB =====
    const { data: nicheSettingsRow } = await adminClient
      .from("trend_settings")
      .select("value")
      .eq("key", "niche_queries")
      .single();

    const NICHE_QUERIES: Record<string, string[]> = nicheSettingsRow?.value as any || {};
    const allNicheKeys = Object.keys(NICHE_QUERIES);
    console.log(`Loaded ${allNicheKeys.length} niches from DB: ${allNicheKeys.join(", ")}`);

    if (allNicheKeys.length === 0) {
      return new Response(JSON.stringify({ error: "No niches configured in trend_settings" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const extractVideos = (data: any): any[] => {
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.data?.results)) return data.data.results;
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data?.items)) return data.items;
      if (Array.isArray(data?.videos)) return data.videos;
      if (Array.isArray(data?.result)) return data.result;
      return [];
    };

    // Check mode
    let mode = "full";
    let batchIndex = -1;
    try {
      const body = await req.json();
      if (body?.lite) mode = "lite";
      else if (body?.mass) mode = "mass";
      else if (body?.mode === "mass") mode = "mass";
      else if (body?.mode === "lite") mode = "lite";
      if (typeof body?.batch === "number") batchIndex = body.batch;
    } catch { /* no body = cron call */ }

    // Detect weak niches
    const sevenDaysAgoCheck = new Date(Date.now() - 7 * 24 * 3600000).toISOString();
    const { data: nicheCounts } = await adminClient
      .from("videos")
      .select("niche")
      .gte("published_at", sevenDaysAgoCheck);
    
    const nicheCountMap: Record<string, number> = {};
    for (const row of nicheCounts || []) {
      if (row.niche) nicheCountMap[row.niche] = (nicheCountMap[row.niche] || 0) + 1;
    }

    // All niches are weak since DB is empty — no threshold filtering
    const WEAK_NICHES = new Set(
      allNicheKeys.filter(n => (nicheCountMap[n] || 0) < 10)
    );
    console.log(`Weak niches: ${[...WEAK_NICHES].join(", ")}`);

    // Maximize queries — no limits
    const queriesPerNiche = mode === "mass" ? 8 : mode === "lite" ? 3 : 5;
    const weakQueriesPerNiche = mode === "mass" ? 15 : mode === "lite" ? 5 : 8;
    const generalKzCount = mode === "lite" ? 8 : mode === "mass" ? 30 : 15;

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    // AI-powered query generation
    const generateAiQueries = async (niches: string[]): Promise<Record<string, string[]>> => {
      try {
        const nicheDescriptions = niches.map(n => {
          const existing = NICHE_QUERIES[n] || [];
          return `${n}: примеры: ${existing.slice(0, 3).join(", ")}`;
        }).join("\n");

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: `Ты эксперт по TikTok трендам в Казахстане и СНГ. Для каждой ниши сгенерируй 8 актуальных поисковых запросов для поиска вирусных видео. Запросы должны быть на казахском, русском и английском. Используй хештеги, ключевые фразы и названия трендов. Возвращай ТОЛЬКО JSON: {"niche1":["запрос1","запрос2",...],...}` },
              { role: "user", content: `Сгенерируй свежие TikTok поисковые запросы для этих ниш (сегодня ${new Date().toLocaleDateString("ru")}):\n${nicheDescriptions}` }
            ],
          }),
        });
        const aiData = await res.json();
        const content = aiData?.choices?.[0]?.message?.content || "";
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          console.log(`AI generated queries for: ${Object.keys(parsed).join(", ")}`);
          return parsed;
        }
      } catch (e) {
        console.error("AI query generation failed:", e);
      }
      return {};
    };

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000);
    const now = new Date().toISOString();
    const nicheStats: Record<string, number> = {};
    let totalSaved = 0;

    // Batch niches
    const BATCH_SIZE = 4;
    let nicheKeys: string[];
    if (batchIndex >= 0) {
      const start = batchIndex * BATCH_SIZE;
      nicheKeys = allNicheKeys.slice(start, start + BATCH_SIZE);
    } else {
      nicheKeys = allNicheKeys;
    }

    // Generate AI queries
    const aiQueries = await generateAiQueries(nicheKeys);
    
    // Process niches in parallel batches of 5
    for (let ni = 0; ni < nicheKeys.length; ni += 5) {
      const nichesBatch = nicheKeys.slice(ni, ni + 5);
      
      await Promise.all(nichesBatch.map(async (nicheKey) => {
        const qCount = WEAK_NICHES.has(nicheKey) ? weakQueriesPerNiche : queriesPerNiche;
        const aiNicheQueries = aiQueries[nicheKey] || [];
        const staticQueries = [...(NICHE_QUERIES[nicheKey] || [])];
        const isKzRu = (q: string) => /[а-яА-ЯәғқңөұүіӘҒҚҢӨҰҮІ]/.test(q);
        const kzRuQueries = staticQueries.filter(isKzRu).sort(() => Math.random() - 0.5);
        const enQueries = staticQueries.filter(q => !isKzRu(q)).sort(() => Math.random() - 0.5);
        const maxEnQueries = Math.max(1, Math.floor(qCount * 0.3));
        const combinedQueries = [...kzRuQueries, ...aiNicheQueries, ...enQueries.slice(0, maxEnQueries)];
        const uniqueQueries = [...new Set(combinedQueries)].slice(0, qCount);
        let nicheSaved = 0;

        for (const query of uniqueQueries) {
          try {
            const searchCount = "50"; // Maximum results
            const data = await callSocialKit("/tiktok/search", { query, count: searchCount });
            const videos = extractVideos(data);

            const videoRows = videos.map(v => {
              const videoId = v.id || v.video_id || v.aweme_id;
              if (!videoId) return null;
              const trends = computeTrend(v);
              const publishedDate = new Date(trends.published_at);
              if (publishedDate < sevenDaysAgo) return null;
              const stats = v.stats || {};
              const caption = v.desc || v.caption || v.title || "";
              const username = v.author?.uniqueId || v.author?.unique_id || v.author_username || "";

              return {
                platform: "tiktok",
                platform_video_id: String(videoId),
                url: v.url || `https://www.tiktok.com/@${username || "user"}/video/${videoId}`,
                caption,
                cover_url: v.video?.cover || v.cover_url || v.cover || v.originCover || "",
                author_username: username,
                author_display_name: v.author?.nickname || v.author_display_name || "",
                author_avatar_url: v.author?.avatar || v.author?.avatarThumb || v.author_avatar_url || "",
                views: stats.views || v.views || v.playCount || 0,
                likes: stats.likes || v.likes || v.diggCount || 0,
                comments: stats.comments || v.comments || v.commentCount || 0,
                shares: stats.shares || v.shares || v.shareCount || 0,
                duration_sec: v.video?.duration || v.duration_sec || v.duration || null,
                fetched_at: now,
                region: "kz",
                niche: nicheKey,
                ...trends,
              };
            }).filter(Boolean);

            if (videoRows.length > 0) {
              const { data: upserted } = await adminClient
                .from("videos")
                .upsert(videoRows, { onConflict: "platform_video_id" })
                .select("id");
              nicheSaved += upserted?.length || 0;
            }
          } catch (err) {
            console.error(`Niche ${nicheKey} query "${query}" failed:`, err.message);
          }
        }
        nicheStats[nicheKey] = nicheSaved;
        totalSaved += nicheSaved;
        console.log(`Niche ${nicheKey}: saved ${nicheSaved} videos`);
      }));
    }

    // General KZ queries
    const shuffledGeneral = GENERAL_KZ_QUERIES.sort(() => Math.random() - 0.5).slice(0, generalKzCount);
    let generalSaved = 0;

    for (let i = 0; i < shuffledGeneral.length; i += 3) {
      const batch = shuffledGeneral.slice(i, i + 3);
      await Promise.all(batch.map(async (query) => {
        try {
          const data = await callSocialKit("/tiktok/search", { query, count: "50" });
          const videos = extractVideos(data);
          const videoRows = videos.map(v => {
            const videoId = v.id || v.video_id || v.aweme_id;
            if (!videoId) return null;
            const trends = computeTrend(v);
            const publishedDate = new Date(trends.published_at);
            if (publishedDate < sevenDaysAgo) return null;
            const stats = v.stats || {};
            return {
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
              fetched_at: now,
              region: "kz",
              ...trends,
            };
          }).filter(Boolean);

          if (videoRows.length > 0) {
            const { data: upserted } = await adminClient
              .from("videos")
              .upsert(videoRows, { onConflict: "platform_video_id" })
              .select("id");
            generalSaved += upserted?.length || 0;
          }
        } catch (err) {
          console.error(`General query "${query}" failed:`, err.message);
        }
      }));
      if (i + 3 < shuffledGeneral.length) await delay(500);
    }

    // AI-categorize uncategorized videos
    if (generalSaved > 0 && LOVABLE_API_KEY) {
      try {
        const NICHE_KEYS = allNicheKeys.concat(["other"]);
        const { data: uncategorized } = await adminClient
          .from("videos")
          .select("id, caption")
          .is("niche", null)
          .limit(200);

        if (uncategorized && uncategorized.length > 0) {
          for (let i = 0; i < uncategorized.length; i += 30) {
            const batch = uncategorized.slice(i, i + 30);
            const captions = batch.map((v: any, idx: number) => `${idx}: ${(v.caption || "").slice(0, 150)}`).join("\n");
            const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash-lite",
                messages: [
                  { role: "system", content: `Classify each video into ONE niche: ${NICHE_KEYS.join(", ")}. Return ONLY JSON: {"0":"food","1":"humor",...}` },
                  { role: "user", content: captions }
                ],
              }),
            });
            const aiData = await res.json();
            const content = aiData?.choices?.[0]?.message?.content || "";
            const match = content.match(/\{[\s\S]*?\}/);
            if (match) {
              const mapping = JSON.parse(match[0]);
              await Promise.all(Object.entries(mapping).map(([idx, nk]) => {
                const video = batch[Number(idx)];
                if (video && NICHE_KEYS.includes(nk as string)) {
                  return adminClient.from("videos").update({ niche: nk as string }).eq("id", video.id);
                }
              }));
            }
          }
          console.log(`AI-categorized ${uncategorized.length} general videos`);
        }
      } catch (e) {
        console.error("AI categorization failed:", e);
      }
    }

    // Log to trend_refresh_logs
    await adminClient.from("trend_refresh_logs").insert({
      mode,
      status: "done",
      total_saved: totalSaved,
      general_saved: generalSaved,
      niche_stats: nicheStats,
      triggered_by: userId,
      finished_at: new Date().toISOString(),
    });

    console.log(`Refresh done. Mode: ${mode}, total niche: ${totalSaved}, general: ${generalSaved}`);
    console.log("Per-niche stats:", JSON.stringify(nicheStats));

    return new Response(JSON.stringify({ success: true, mode, totalSaved, generalSaved, nicheStats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Refresh trends error:", err);
    return new Response(
      JSON.stringify({ error: "Unable to process request. Please try again later." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
