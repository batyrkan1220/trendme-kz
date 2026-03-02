import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SOCIALKIT_BASE = "https://api.socialkit.dev";

// Niche-specific search queries (KZ/RU + EN)
const NICHE_QUERIES: Record<string, string[]> = {
  finance: ["финансы тикток", "инвестиции 2026", "крипто трейдинг", "заработок онлайн", "пассивный доход", "#финансы", "#инвестиции", "#crypto", "#trading", "finance tips tiktok", "investing viral", "қаржы тикток", "инвестиция қазақша", "#қаржы", "ақша табу", "крипто қазақша", "қор биржасы"],
  marketing: ["маркетинг тикток", "smm продвижение", "таргетированная реклама", "контент маркетинг", "#маркетинг", "#smm", "#digitalmarketing", "marketing strategy tiktok", "social media tips", "маркетинг қазақша", "#smm_kz", "жарнама тикток", "контент жасау", "таргет қазақша"],
  business: ["бизнес тикток", "как заработать 2026", "деньги тикток", "стартап тикток", "продажи тикток", "бизнес идеи", "#бизнес", "#деньги", "#заработок", "#business", "#money", "#hustle", "how to make money tiktok", "side hustle tiktok", "бизнес кеңес", "кәсіпкерлік тикток", "#кәсіпкерлік", "ақша табу тикток", "шағын бизнес", "онлайн бизнес қазақша", "бизнес с нуля тикток", "предприниматель влог", "#entrepreneur", "money tips viral"],
  psychology: ["психология тикток", "саморазвитие", "токсичные люди", "нарцисс признаки", "тревожность как справиться", "#психология", "#саморазвитие", "#mentalhealth", "#psychology", "psychology tiktok", "mental health tips", "самооценка тикток", "как полюбить себя", "психолог объясняет", "манипуляции тикток", "психология қазақша", "өзін-өзі дамыту", "#психолог", "жүйке жүйесі", "emotional intelligence tiktok", "therapy session tiktok", "қарым-қатынас кеңес", "red flags тикток", "attachment style"],
  therapy: ["саморазвитие тикток", "мотивация успех", "медитация утро", "осознанность", "#саморазвитие", "#мотивация", "#mindset", "#meditation", "self improvement tiktok", "motivation viral", "мотивация қазақша", "өзін-өзі дамыту", "#мотивация_kz", "табыс құпиясы"],
  education: ["английский язык тикток", "учеба лайфхаки", "образование онлайн", "уроки тикток", "#английский", "#учеба", "#education", "#learnenglish", "study tips tiktok", "language learning viral", "ағылшын тілі тикток", "қазақ тілі сабақ", "#білім", "оқу лайфхак", "ҰБТ дайындық", "#ҰБТ"],
  mama: ["мама тикток", "мамочка влог", "ребенок первый год", "беременность тикток", "роды история", "#мама", "#материнство", "#momlife", "#momtok", "#baby", "#newborn", "mom hacks tiktok", "baby tips viral", "мама жизнь тикток", "дети приколы тикток", "ана тикток", "бала тікток", "#momhacks", "toddler mom tiktok", "pregnancy tiktok", "нәресте күтімі", "бала тамақтану", "#ана", "мама и малыш", "грудное вскармливание тикток"],
  beauty: ["бьюти тикток", "макияж тренд 2026", "уход за кожей", "косметика обзор", "#бьюти", "#макияж", "#skincare", "#makeup", "#beauty", "beauty hack tiktok viral", "skincare routine", "сұлулық тикток", "макияж қазақша", "#сұлулық", "тері күтімі", "косметика қазақша"],
  fitness: ["фитнес тренировка", "спорт тикток", "похудение упражнения", "зал мотивация", "#фитнес", "#тренировка", "#fitness", "#workout", "#gym", "workout tiktok viral", "gym transformation", "спорт қазақша", "жаттығу тикток", "#спорт_kz", "арықтау жаттығу", "дене шынықтыру"],
  fashion: ["мода тренды 2026", "стиль одежда", "аутфит дня", "шопинг тикток", "#мода", "#стиль", "#outfit", "#fashion", "#ootd", "fashion trend tiktok", "outfit ideas viral", "сән тикток", "киім стиль қазақша", "#сән_kz", "аутфит қазақша", "сән тренд 2026"],
  law: ["юрист советы", "налоги 2026", "закон новый", "юридические лайфхаки", "#юрист", "#налоги", "#закон", "#legal", "legal advice tiktok", "tax tips", "заңгер кеңес қазақша", "салық 2026 қазақша", "#заңгер_kz", "құқық қазақша"],
  realestate: ["недвижимость 2026", "квартира ипотека", "ремонт квартиры", "купить дом", "#недвижимость", "#ипотека", "#квартира", "#realestate", "real estate tiktok", "apartment tour viral", "жылжымайтын мүлік", "пәтер ипотека қазақша", "#пәтер_kz", "үй жөндеу", "баспана қазақша"],
  esoteric: ["таро расклад", "гороскоп 2026", "астрология знаки", "эзотерика энергия", "#таро", "#гороскоп", "#астрология", "#tarot", "#astrology", "tarot reading tiktok", "horoscope viral", "таро қазақша", "жұлдыз жорамал", "#таро_kz", "гороскоп қазақша"],
  food: ["рецепт быстрый", "еда тикток", "готовим вкусно", "выпечка рецепт", "завтрак идеи", "#рецепт", "#еда", "#готовка", "#recipe", "#cooking", "#foodtiktok", "cooking hack tiktok viral", "food recipe easy", "рецепт қазақша", "тағам дайындау", "#рецепт_kz", "қазақ тағамы", "бешбармақ рецепт", "ұлттық тағам", "пісіру тикток"],
  home: ["уют дом тикток", "ремонт своими руками", "интерьер идеи", "организация дома", "уборка лайфхак", "#уют", "#интерьер", "#ремонт", "#home", "#homedecor", "#organization", "home decor tiktok viral", "үй жайлылық", "интерьер қазақша", "#үй_kz", "жөндеу қазақша"],
  travel: ["путешествия тикток", "туризм 2026", "отдых бюджетный", "красивые места", "#путешествия", "#travel", "#туризм", "#wanderlust", "travel tiktok viral", "beautiful places", "саяхат тикток", "қазақстан көрікті жерлер", "#саяхат_kz", "Алматы саяхат", "Маңғыстау", "Бурабай", "Түркістан саяхат"],
  lifestyle: ["лайфстайл влог", "день из жизни", "рутина утро", "мотивация жизнь", "#лайфстайл", "#влог", "#vlog", "#lifestyle", "#routine", "day in my life tiktok", "morning routine viral", "өмір салты тикток", "күнделікті влог қазақша", "#влог_kz", "таңғы рутина қазақша"],
  animals: ["животные тикток", "кот смешной", "собака тренировка", "питомец уход", "#кот", "#собака", "#питомец", "#cat", "#dog", "#pets", "funny cat tiktok", "cute dog viral", "жануарлар тикток", "мысық күлкілі", "#жануар_kz", "ит тәрбиесі", "үй жануары қазақша"],
  gaming: ["игры тикток", "геймер стрим", "новая игра 2026", "ps5 обзор", "#игры", "#геймер", "#gaming", "#gamer", "#ps5", "gaming tiktok viral", "game review", "ойын тикток қазақша", "#ойын_kz", "геймер қазақ"],
  music: ["музыка тикток хит", "новая песня 2026", "кино обзор", "арт творчество", "#музыка", "#кино", "#арт", "#music", "#movie", "#art", "music viral tiktok", "new song trending", "қазақ әні тикток", "жаңа ән 2026", "#қазақәні", "қазақ музыка хит", "димаш", "#dimash"],
  
  career: ["карьера тикток", "фриланс тикток", "удаленка тикток", "работа тикток", "подработка тикток", "#карьера", "#работа", "#фриланс", "#удаленка", "#career", "#freelance", "#remotework", "#worktiktok", "freelance tips tiktok", "work from home tiktok", "resume tips viral", "жұмыс тикток", "мансап тикток", "#жұмыс", "фриланс қазақша", "қашықтан жұмыс", "собеседование тикток", "interview tips tiktok", "подработка для студентов", "IT карьера тикток"],
  auto: ["авто обзор тикток", "машина тюнинг", "мото тикток", "автоновинки 2026", "#авто", "#машина", "#мото", "#car", "#auto", "car tiktok viral", "auto review", "авто қазақша", "көлік шолу тикток", "#авто_kz", "машина тюнинг қазақша", "жаңа көлік 2026"],
  diy: ["своими руками тикток", "рукоделие идеи", "diy проект", "handmade тренд", "#diy", "#рукоделие", "#handmade", "#craft", "diy tiktok viral", "craft ideas", "қолөнер тикток", "өз қолымен жасау", "#қолөнер_kz", "қолөнер идеялар"],
  kids: ["дети тикток", "воспитание советы", "развитие ребенка", "школа лайфхаки", "#дети", "#воспитание", "#kids", "#children", "#parenting", "kids tiktok funny", "parenting tips viral", "балалар тикток", "бала тәрбиесі қазақша", "#балалар_kz", "мектеп лайфхак", "бала дамыту"],
  ai_news: ["нейросети новости 2026", "chatgpt новое", "искусственный интеллект", "#нейросети", "#ии", "#ai", "#chatgpt", "#artificialintelligence", "ai news tiktok", "chatgpt viral", "нейрожелі қазақша", "жасанды интеллект", "#ai_kz"],
  ai_art: ["ai арт генерация", "midjourney новое", "нейросеть рисует", "#aiart", "#midjourney", "#генерация", "ai art tiktok viral", "ai generated", "нейрожелі сурет қазақша", "#aiart_kz"],
  ai_avatar: ["ai аватар тикток", "цифровой аватар", "deepfake тренд", "#aiavatar", "#deepfake", "#digitalavatar", "ai avatar tiktok viral", "ai аватар қазақша"],
  humor: ["юмор тикток", "смешные видео 2026", "приколы тикток", "скетч комедия", "мемы тикток", "#юмор", "#приколы", "#смешно", "#funny", "#comedy", "#memes", "funny tiktok compilation", "comedy sketch viral", "қазақ юмор тикток", "күлкілі видео қазақша", "#қазақприкол", "#қазақвайн", "қазақ мем", "қазақ скетч"],
};

// Extra general KZ/CIS queries to fill gaps
const GENERAL_KZ_QUERIES = [
  "#қазақстан", "#kz", "#казахстан", "#алматы", "#астана",
  "#казахстантренд", "#kztiktok", "#снг", "#рекомендации",
  "қазақ тикток тренд", "казахстан тренд тикток 2026",
  "#қазақша", "#қазақтикток", "#kzviral", "#қазақвирал",
  "қазақстан вирал 2026", "#шымкент", "#караганда", "#актау",
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

    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
    let batchIndex = -1; // -1 = all niches, 0-4 = specific batch
    try {
      const body = await req.json();
      if (body?.lite) mode = "lite";
      else if (body?.mass) mode = "mass";
      if (typeof body?.batch === "number") batchIndex = body.batch;
    } catch { /* no body = cron call */ }

    // How many queries per niche based on mode
    // mass mode (manual refresh): 5 queries per niche, weak get 8
    // cron/full mode: 3 queries per niche, weak get 5  
    // lite mode: 2 queries per niche
    const WEAK_NICHES = new Set(["career", "psychology", "mama", "business", "therapy", "ai_art", "ai_avatar", "ai_news"]);
    const queriesPerNiche = mode === "mass" ? 5 : mode === "lite" ? 2 : 3;
    const weakQueriesPerNiche = mode === "mass" ? 8 : mode === "lite" ? 3 : 5;
    const generalKzCount = mode === "lite" ? 2 : mode === "mass" ? 5 : 3;

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    // AI-powered query generation for niches
    const generateAiQueries = async (niches: string[]): Promise<Record<string, string[]>> => {
      try {
        const nicheDescriptions = niches.map(n => {
          const existing = NICHE_QUERIES[n] || [];
          return `${n}: примеры запросов: ${existing.slice(0, 3).join(", ")}`;
        }).join("\n");

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: `Ты эксперт по TikTok трендам в Казахстане и СНГ. Для каждой ниши сгенерируй 5 актуальных поисковых запросов для поиска вирусных видео. Запросы должны быть на казахском, русском и английском. Используй хештеги, ключевые фразы и названия трендов. Возвращай ТОЛЬКО JSON: {"niche1":["запрос1","запрос2",...],...}` },
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

    // Split niches into batches of 4
    const allNicheKeys = Object.keys(NICHE_QUERIES);
    const BATCH_SIZE = 4;
    let nicheKeys: string[];
    if (batchIndex >= 0) {
      const start = batchIndex * BATCH_SIZE;
      nicheKeys = allNicheKeys.slice(start, start + BATCH_SIZE);
    } else {
      nicheKeys = allNicheKeys;
    }

    // Generate AI queries for this batch of niches
    const aiQueries = await generateAiQueries(nicheKeys);
    
    // Process niches in parallel batches of 5
    for (let ni = 0; ni < nicheKeys.length; ni += 5) {
      const nichesBatch = nicheKeys.slice(ni, ni + 5);
      
      await Promise.all(nichesBatch.map(async (nicheKey) => {
        const qCount = WEAK_NICHES.has(nicheKey) ? weakQueriesPerNiche : queriesPerNiche;
        // Combine static + AI-generated queries, prioritizing AI ones
        const aiNicheQueries = aiQueries[nicheKey] || [];
        const staticQueries = [...NICHE_QUERIES[nicheKey]].sort(() => Math.random() - 0.5);
        const combinedQueries = [...aiNicheQueries, ...staticQueries];
        // Deduplicate and take qCount
        const uniqueQueries = [...new Set(combinedQueries)].slice(0, qCount);
        const queries = uniqueQueries;
        let nicheSaved = 0;

        for (const query of queries) {
          try {
            const data = await callSocialKit("/tiktok/search", { query, count: "30" });
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

    // Also run general KZ queries (tagged region=kz, niche assigned by AI later)
    const shuffledGeneral = GENERAL_KZ_QUERIES.sort(() => Math.random() - 0.5).slice(0, generalKzCount);
    let generalSaved = 0;

    for (let i = 0; i < shuffledGeneral.length; i += 3) {
      const batch = shuffledGeneral.slice(i, i + 3);
      await Promise.all(batch.map(async (query) => {
        try {
          const data = await callSocialKit("/tiktok/search", { query, count: "30" });
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
      if (i + 3 < shuffledGeneral.length) await delay(1000);
    }

    // AI-categorize any uncategorized videos from general queries
    if (generalSaved > 0 && LOVABLE_API_KEY) {
      try {
        const NICHE_KEYS = Object.keys(NICHE_QUERIES).concat(["other"]);
        const { data: uncategorized } = await adminClient
          .from("videos")
          .select("id, caption")
          .is("niche", null)
          .limit(100);

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

    console.log(`Refresh trends done. Mode: ${mode}, total niche: ${totalSaved}, general: ${generalSaved}`);
    console.log("Per-niche stats:", JSON.stringify(nicheStats));

    return new Response(JSON.stringify({ success: true, mode, totalSaved, generalSaved, nicheStats }), {
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
