import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ENSEMBLE_BASE = "https://ensembledata.com/apis";

// Filters
const MIN_VIEWS = 10000;
const MAX_AGE_DAYS = 14;

// Batching across niches
const BATCH_SIZE = 1;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// =========================
// Deterministic PRNG (mulberry32)
// =========================
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function stableShuffle<T>(array: T[], seed: number): T[] {
  const arr = [...array];
  const rng = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickRotatedKeywords(
  nicheKey: string,
  allKeywords: string[],
  qCount: number,
  seed: string,
  rotationIndex: number,
): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const k of allKeywords || []) {
    const t = String(k ?? "").trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(t);
  }

  if (cleaned.length === 0) return [];

  const combinedSeed = hashString(seed + ":" + nicheKey);

  if (cleaned.length <= qCount) {
    return stableShuffle(cleaned, combinedSeed);
  }

  const shuffled = stableShuffle(cleaned, combinedSeed);
  const total = shuffled.length;
  const take = Math.min(qCount, total);
  const offset = (rotationIndex * take) % total;

  const result: string[] = [];
  for (let i = 0; i < take; i++) {
    result.push(shuffled[(offset + i) % total]);
  }
  return result;
}

const VERSION = "refresh-trends-ensemble v4 hierarchical-niches sub_niche support";

const KAZAKH_SPECIFIC_RE = /[әіңғүұқөһіӘІҢҒҮҰҚӨҺ]/u;
const KAZAKH_COMMON_WORDS_RE = /\b(және|үшін|бұл|осы|қалай|неге|тағы|бәрі|сәлем|қазақша|мен|сен|сіз|біз|олар|қазір|бүгін|ертең|үйде|туралы|керек|емес|бар|жоқ)\b/giu;
const RUSSIAN_COMMON_WORDS_RE = /\b(и|в|на|что|как|это|для|только|видео|смотри|подпишись|очень|тебя|меня|всем|когда|если|просто|тут|такой|будет|после)\b/giu;

function likelyKazakhCaption(caption: string): boolean {
  const text = String(caption || "").toLowerCase();
  if (!text.trim()) return false;
  if (KAZAKH_SPECIFIC_RE.test(text)) return true;

  const kzHits = text.match(KAZAKH_COMMON_WORDS_RE)?.length || 0;
  const ruHits = text.match(RUSSIAN_COMMON_WORDS_RE)?.length || 0;

  return kzHits >= 2 && kzHits >= ruHits;
}

// Human-readable labels for sub-niches (for logs)
const SUB_NICHE_LABELS: Record<string, string> = {
  finance: "Финансы", crypto: "Крипто", business_ideas: "Бизнес идеи",
  marketing: "Маркетинг", freelance: "Фриланс", ecommerce: "E-commerce",
  skincare: "Уход за кожей", makeup: "Макияж", haircare: "Волосы",
  manicure: "Маникюр", cosmetology: "Косметология", perfume: "Парфюмерия",
  clothing: "Одежда", shoes: "Обувь", accessories: "Аксессуары",
  luxury_fashion: "Люкс бренды", jewelry: "Украшения", shopping: "Шопинг",
  recipes: "Рецепты", home_cooking: "Домашняя кухня", restaurants: "Рестораны",
  street_food: "Уличная еда", desserts: "Десерты", coffee_tea: "Кофе и чай",
  home_workouts: "Тренировки дома", gym: "Тренажерный зал", weight_loss: "Похудение",
  yoga: "Йога", healthy_lifestyle: "ЗОЖ", sports_nutrition: "Спортпитание",
  football: "Футбол", mma_boxing: "ММА/Бокс", basketball: "Баскетбол",
  sports_news: "Спорт новости", extreme_sports: "Экстрим спорт",
  languages: "Языки", english: "Английский", school_ent: "ЕНТ/Школа",
  online_courses: "Онлайн курсы", books: "Книги",
  mobile_games: "Мобильные игры", pc_games: "PC игры", game_reviews: "Обзоры игр",
  streaming: "Стриминг", esports: "Киберспорт",
  programming: "Программирование", gadgets: "Гаджеты", tech_reviews: "Обзоры техники", apps: "Приложения",
  auto_reviews: "Авто обзоры", chinese_auto: "Китайские авто", tuning: "Тюнинг",
  auto_repair: "Авто ремонт", electric_vehicles: "Электромобили", moto: "Мотоциклы",
  renovation: "Ремонт", interior: "Интерьер", furniture: "Мебель",
  organization: "Организация", garden: "Сад и огород",
  motherhood: "Материнство", pregnancy: "Беременность", parenting: "Воспитание",
  family_life: "Семья", wedding: "Свадьба",
  relationships: "Отношения", self_development: "Саморазвитие", motivation: "Мотивация",
  mental_health: "Ментальное здоровье", productivity: "Продуктивность",
  humor: "Юмор", memes: "Мемы", challenges: "Челленджи", asmr: "ASMR",
  music: "Музыка", cinema: "Кино", dance: "Танцы", anime: "Аниме",
  pets: "Домашние животные", pet_care: "Уход за животными",
  travel_general: "Путешествия", hotels: "Отели", kazakhstan_travel: "КЗ туризм",
  neural_networks: "Нейросети", ai_tools: "AI инструменты", ai_generation: "AI генерация", chatgpt: "ChatGPT",
  crafts: "Рукоделие", drawing: "Рисование", photography: "Фотография",
  doctors: "Врачи", dentistry: "Стоматология", pharmacy: "Аптека", nutrition_health: "Нутрициология",
  apartments: "Квартиры", mortgage: "Ипотека", new_buildings: "Новостройки", construction: "Стройка",
  content_creation: "Создание контента", video_editing: "Монтаж", promotion: "Продвижение",
  monetization: "Монетизация", personal_brand: "Личный бренд",
  kazakh_cuisine: "Қазақ ас", kazakh_history: "ҚР тарихы", kazakh_traditions: "Дәстүрлер",
  kazakh_language: "Қазақ тілі", kazakh_music: "Қазақ музыка", kazakh_celebrities: "Қазақ жұлдыздар",
  // lifestyle
  daily_routines: "Рутины дня", morning_routine: "Утренний ритуал", life_hacks: "Лайфхаки",
  minimalism: "Минимализм", aesthetic: "Эстетика", self_care: "Селф-кер",
};

const nicheLabel = (key: string) => SUB_NICHE_LABELS[key] || key;

// Parent niche labels for AI prompt context
const SUB_NICHE_LABELS_MAP: Record<string, string> = {
  business: "Бизнес и деньги", beauty: "Бьюти", fashion: "Мода",
  food: "Еда и рестораны", fitness: "Фитнес и здоровье", sports: "Спорт",
  education: "Образование", gaming: "Гейминг", tech: "IT/Технологии",
  auto: "Авто", home: "Дом", family: "Семья", psychology: "Психология",
  entertainment: "Развлечения", media: "Медиа", animals: "Животные",
  travel: "Путешествия", ai: "AI", hobby: "Хобби", medicine: "Медицина",
  realestate: "Недвижимость", blogging: "Блогинг", kazakh_culture: "Казахская культура",
  lifestyle: "Лайфстайл",
};

// Reverse map: parent niche → list of sub-niches
const NICHE_TO_SUB_NICHES: Record<string, string[]> = {};


const SUB_NICHE_TO_NICHE: Record<string, string> = {
  // business
  finance: "business", crypto: "business", business_ideas: "business",
  marketing: "business", freelance: "business", ecommerce: "business",
  // beauty
  skincare: "beauty", makeup: "beauty", haircare: "beauty",
  manicure: "beauty", cosmetology: "beauty", perfume: "beauty",
  // fashion
  clothing: "fashion", shoes: "fashion", accessories: "fashion",
  luxury_fashion: "fashion", jewelry: "fashion", shopping: "fashion",
  // food
  recipes: "food", home_cooking: "food", restaurants: "food",
  street_food: "food", desserts: "food", coffee_tea: "food",
  // fitness
  home_workouts: "fitness", gym: "fitness", weight_loss: "fitness",
  yoga: "fitness", healthy_lifestyle: "fitness", sports_nutrition: "fitness",
  // sports
  football: "sports", mma_boxing: "sports", basketball: "sports",
  sports_news: "sports", extreme_sports: "sports",
  // education
  languages: "education", english: "education", school_ent: "education",
  online_courses: "education", books: "education",
  // gaming
  mobile_games: "gaming", pc_games: "gaming", game_reviews: "gaming",
  streaming: "gaming", esports: "gaming",
  // tech
  programming: "tech", gadgets: "tech", tech_reviews: "tech", apps: "tech",
  // auto
  auto_reviews: "auto", chinese_auto: "auto", tuning: "auto",
  auto_repair: "auto", electric_vehicles: "auto", moto: "auto",
  // home
  renovation: "home", interior: "home", furniture: "home",
  organization: "home", garden: "home",
  // family
  motherhood: "family", pregnancy: "family", parenting: "family",
  family_life: "family", wedding: "family",
  // psychology
  relationships: "psychology", self_development: "psychology", motivation: "psychology",
  mental_health: "psychology", productivity: "psychology",
  // entertainment
  humor: "entertainment", memes: "entertainment", challenges: "entertainment", asmr: "entertainment",
  // media
  music: "media", cinema: "media", dance: "media", anime: "media",
  // animals
  pets: "animals", pet_care: "animals",
  // travel
  travel_general: "travel", hotels: "travel", kazakhstan_travel: "travel",
  // ai
  neural_networks: "ai", ai_tools: "ai", ai_generation: "ai", chatgpt: "ai",
  // hobby
  crafts: "hobby", drawing: "hobby", photography: "hobby",
  // medicine
  doctors: "medicine", dentistry: "medicine", pharmacy: "medicine", nutrition_health: "medicine",
  // realestate
  apartments: "realestate", mortgage: "realestate", new_buildings: "realestate", construction: "realestate",
  // blogging
  content_creation: "blogging", video_editing: "blogging", promotion: "blogging",
  monetization: "blogging", personal_brand: "blogging",
  // kazakh_culture
  kazakh_cuisine: "kazakh_culture", kazakh_history: "kazakh_culture", kazakh_traditions: "kazakh_culture",
  kazakh_language: "kazakh_culture", kazakh_music: "kazakh_culture", kazakh_celebrities: "kazakh_culture",
  // lifestyle
  daily_routines: "lifestyle", morning_routine: "lifestyle", life_hacks: "lifestyle",
  minimalism: "lifestyle", aesthetic: "lifestyle", self_care: "lifestyle",
};

// Build reverse map
for (const [sub, parent] of Object.entries(SUB_NICHE_TO_NICHE)) {
  if (!NICHE_TO_SUB_NICHES[parent]) NICHE_TO_SUB_NICHES[parent] = [];
  NICHE_TO_SUB_NICHES[parent].push(sub);
}


const OLD_CATEGORY_TO_NICHE: Record<string, string> = {
  animals: "animals", art: "hobby", auto: "auto", beauty: "beauty", books: "education",
  business: "business", cinema: "media", comedy: "entertainment", dance: "media",
  diy: "home", education: "education", entertainment: "entertainment", family: "family",
  fashion: "fashion", fitness: "fitness", food: "food", gaming: "gaming",
  lifestyle: "lifestyle", marketing: "business", medicine: "medicine", music: "media",
  news: "entertainment", podcast: "media", psychology: "psychology", realestate: "realestate",
  religion: "psychology", shopping: "fashion", sports: "sports", tech: "tech", travel: "travel",
};

function resolveNiche(nicheKey: string): { niche: string; sub_niche: string | null } {
  // If it's a sub-niche key
  if (SUB_NICHE_TO_NICHE[nicheKey]) {
    return { niche: SUB_NICHE_TO_NICHE[nicheKey], sub_niche: nicheKey };
  }
  // If it's an old category key
  if (OLD_CATEGORY_TO_NICHE[nicheKey]) {
    return { niche: OLD_CATEGORY_TO_NICHE[nicheKey], sub_niche: null };
  }
  // If it's already a main niche key
  return { niche: nicheKey, sub_niche: null };
}

Deno.serve(async (req: Request) => {
  console.log("VERSION", VERSION);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ensembleToken = Deno.env.get("ENSEMBLE_DATA_TOKEN");

  if (!ensembleToken) {
    return new Response(JSON.stringify({ error: "ENSEMBLE_DATA_TOKEN not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // =========================
  // Auth
  // =========================
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

  if (!isCronCall) {
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    userId = claimsData.claims.sub as string;
  } else {
    console.log("Cron call detected (service_role key)");
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // =========================
  // Runtime settings
  // =========================
  const MAX_EXECUTION_MS = 120000;
  const startTime = Date.now();

  const nowIso = new Date().toISOString();
  const maxAgeCutoff = new Date(Date.now() - MAX_AGE_DAYS * 24 * 3600000);

  // API usage logging
  const logApiUsage = async (action: string, credits: number, metadata: Record<string, any> = {}) => {
    try {
      await adminClient.from("api_usage_log").insert({
        function_name: "refresh-trends",
        action,
        credits_used: credits,
        metadata,
      });
    } catch (e) {
      console.error("Failed to log API usage:", e);
    }
  };

  // =========================
  // Helpers
  // =========================
  const callEnsembleData = async (
    query: string,
    period: string,
    sorting: string,
    retries = 3,
  ): Promise<any[]> => {
    const params = new URLSearchParams({
      name: query.trim(),
      period,
      sorting,
      match_exactly: "false",
      token: ensembleToken,
    });

    const url = `${ENSEMBLE_BASE}/tt/keyword/full-search?${params.toString()}`;

    for (let attempt = 0; attempt < retries; attempt++) {
      const res = await fetch(url);

      if (res.ok) {
        const data = await res.json();
        // Extract videos from response
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
        return rawVideos;
      }

      const text = await res.text();
      const retryable = res.status === 429 || (res.status >= 500 && res.status <= 599);
      if (retryable && attempt < retries - 1) {
        const waitSec = Math.min(30, 6 * (attempt + 1));
        console.log(`EnsembleData retryable error ${res.status}. Wait ${waitSec}s (attempt ${attempt + 1}/${retries})`);
        await sleep(waitSec * 1000);
        continue;
      }

      throw new Error(`EnsembleData error ${res.status}: ${text}`);
    }

    throw new Error(`EnsembleData failed after ${retries} retries`);
  };

  const getPublishedAt = (createTime: number): string => {
    if (typeof createTime === "number" && createTime > 0) {
      const sec = createTime > 1e12 ? Math.floor(createTime / 1000) : createTime;
      return new Date(sec * 1000).toISOString();
    }
    return new Date().toISOString();
  };

  const computeTrend = (views: number, likes: number, comments: number, publishedAt: Date) => {
    const hoursSince = Math.max(1, (Date.now() - publishedAt.getTime()) / 3600000);

    const vViews = views / hoursSince;
    const vLikes = likes / hoursSince;
    const vComments = comments / hoursSince;

    const engagementRate = views > 0 ? (likes + comments) / views : 0;

    return {
      velocity_views: vViews,
      velocity_likes: vLikes,
      velocity_comments: vComments,
      trend_score: 0.4 * vViews + 0.3 * vLikes + 0.2 * vComments + 0.1 * engagementRate * 10000,
    };
  };

  // =========================
  // Parse body / mode
  // =========================
  let mode = "full";
  let batchIndex = 0;
  let logId: string | null = null;
  let targetNiches: string[] | null = null;
  let targetLang: string | null = null; // kk, ru, en or null (all)

  try {
    const body = await req.json();
    if (body?.lite) mode = "lite";
    else if (body?.mass) mode = "mass";
    else if (body?.mode === "mass") mode = "mass";
    else if (body?.mode === "lite") mode = "lite";

    if (typeof body?.batch === "number") batchIndex = body.batch;
    if (body?.logId) logId = body.logId;
    if (Array.isArray(body?.target_niches) && body.target_niches.length > 0) {
      targetNiches = body.target_niches;
    }
    if (body?.lang && ["kk", "ru", "en"].includes(body.lang)) {
      targetLang = body.lang;
    }
  } catch {
    // no body = cron call
  }

  // =========================
  // Load niche queries from DB
  // =========================
  const { data: nicheSettingsRow } = await adminClient
    .from("trend_settings")
    .select("value")
    .eq("key", "niche_queries")
    .single();

  // Handle new 3-lang format: { kk: [], ru: [], en: [] } or old flat array format
  const rawNicheQueries: Record<string, any> = (nicheSettingsRow?.value as any) || {};
  const NICHE_QUERIES: Record<string, string[]> = {};
  for (const [key, val] of Object.entries(rawNicheQueries)) {
    if (Array.isArray(val)) {
      // Old flat array format - use if no lang filter or filter matches
      NICHE_QUERIES[key] = targetLang ? [] : val;
    } else if (val && typeof val === "object") {
      // New 3-lang format: use only target language or flatten all
      if (targetLang) {
        NICHE_QUERIES[key] = (val as any)[targetLang] || [];
      } else {
        const kk = (val as any).kk || [];
        const ru = (val as any).ru || [];
        const en = (val as any).en || [];
        NICHE_QUERIES[key] = [...kk, ...ru, ...en];
      }
    }
  }
  console.log(`Language filter: ${targetLang || "all"}`);

  // =========================
  // AI-powered keyword generation for KK mode
  // =========================
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  let aiTrendingTopics: string[] = [];

  if (targetLang === "kk" && LOVABLE_API_KEY) {
    // Step 1: Get trending topics in Kazakhstan right now
    try {
      console.log("🤖 AI: Fetching trending Kazakh topics...");
      const trendRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: `Сен қазақстандық TikTok трендтерін білетін маманың. Қазіргі уақытта Қазақстандағы TikTok-та қандай тақырыптар, оқиғалар, челленджтер тренд екенін айт.

Тек қазақша кілт сөздерді бер. Хэштег КЕРЕК ЕМЕС. Тек іздеу сұраныстары.
Әр сұраныс 1-3 сөзден тұрсын.
Мысалы: "қазақ тойы", "алматы кафе", "ЕНТ дайындық"

JSON форматында қайтар:
{"topics": ["тақырып1", "тақырып2", ...]}

20-30 тақырып бер, әр түрлі салалардан (ас, сән, білім, ойын-сауық, спорт, технология т.б.)` },
            { role: "user", content: `Бүгінгі күн: ${new Date().toLocaleDateString("kk-KZ")}. Қазақстанда қазір TikTok-та не тренд?` },
          ],
        }),
      });
      const trendData = await trendRes.json();
      const trendContent = trendData?.choices?.[0]?.message?.content || "";
      const trendMatch = trendContent.match(/\{[\s\S]*\}/);
      if (trendMatch) {
        const parsed = JSON.parse(trendMatch[0]);
        aiTrendingTopics = (parsed.topics || []).filter((t: string) => typeof t === "string" && t.trim());
        console.log(`🤖 AI trending topics (${aiTrendingTopics.length}): ${aiTrendingTopics.slice(0, 10).join(", ")}...`);
      }
    } catch (e) {
      console.warn("AI trending topics failed:", (e as Error).message);
    }

    // Step 2: Generate fresh keywords per niche
    const nichesToEnrich = Object.keys(NICHE_QUERIES).slice(0, 30); // limit to avoid timeout
    const ENRICH_BATCH = 10; // process 10 niches per AI call for efficiency
    
    for (let i = 0; i < nichesToEnrich.length; i += ENRICH_BATCH) {
      if (Date.now() - startTime > 15000) break; // max 15s for keyword generation
      
      const batch = nichesToEnrich.slice(i, i + ENRICH_BATCH);
      const nicheDescriptions = batch.map(k => `"${k}": ${nicheLabel(k)} (${SUB_NICHE_LABELS_MAP[SUB_NICHE_TO_NICHE[k] || k] || k})`).join("\n");
      
      try {
        const kwRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: `Сен TikTok контент маманысың. Берілген нишалар үшін ҚАЗАҚША іздеу кілт сөздерін жаса.

ЕРЕЖЕЛЕР:
- Тек ҚАЗАҚША сөздер (кириллица). Хэштег КЕРЕК ЕМЕС.
- Әр ниша үшін 5-8 кілт сөз
- Әр сұраныс 1-3 сөзден тұрсын
- TikTok-та іздеуге қолайлы, қысқа, нақты сөздер
- Орысша, ағылшынша сөздер ҚОСУ, тек глобалды терминдерді қалдыр (ASMR, IT, AI т.б.)
- Қазақстандағы адамдар не іздейтінін ойла

JSON форматы:
{"niche_key1": ["сөз1", "сөз2"], "niche_key2": ["сөз1", "сөз2"]}` },
              { role: "user", content: `Мына нишалар үшін қазақша кілт сөздер жаса:\n${nicheDescriptions}` },
            ],
          }),
        });
        const kwData = await kwRes.json();
        const kwContent = kwData?.choices?.[0]?.message?.content || "";
        const kwMatch = kwContent.match(/\{[\s\S]*\}/);
        if (kwMatch) {
          const generated = JSON.parse(kwMatch[0]);
          let totalAdded = 0;
          for (const [key, words] of Object.entries(generated)) {
            if (NICHE_QUERIES[key] && Array.isArray(words)) {
              const existing = new Set(NICHE_QUERIES[key].map((w: string) => w.toLowerCase()));
              const newWords = (words as string[]).filter(w => typeof w === "string" && w.trim() && !existing.has(w.toLowerCase()));
              NICHE_QUERIES[key] = [...NICHE_QUERIES[key], ...newWords];
              totalAdded += newWords.length;
            }
          }
          console.log(`🤖 AI keywords batch ${Math.floor(i/ENRICH_BATCH)+1}: +${totalAdded} keywords for ${batch.length} niches`);
        }
      } catch (e) {
        console.warn(`AI keyword generation batch failed:`, (e as Error).message);
      }
    }

    // Step 3: Distribute trending topics to relevant niches via a quick AI call
    if (aiTrendingTopics.length > 0) {
      try {
        const nicheList = Object.keys(NICHE_QUERIES).map(k => `"${k}": ${nicheLabel(k)}`).join(", ");
        const topicsStr = aiTrendingTopics.join(", ");
        
        const distRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: `Трендті тақырыптарды нишаларға бөл. Әр тақырыпты ең жақын нишаға тағайында.
JSON: {"niche_key": ["тақырып1"], "niche_key2": ["тақырып2"]}
Тек берілген ниша кілттерін қолдан.` },
              { role: "user", content: `Нишалар: ${nicheList}\n\nТрендті тақырыптар: ${topicsStr}` },
            ],
          }),
        });
        const distData = await distRes.json();
        const distContent = distData?.choices?.[0]?.message?.content || "";
        const distMatch = distContent.match(/\{[\s\S]*\}/);
        if (distMatch) {
          const distributed = JSON.parse(distMatch[0]);
          let totalDist = 0;
          for (const [key, topics] of Object.entries(distributed)) {
            if (NICHE_QUERIES[key] && Array.isArray(topics)) {
              const existing = new Set(NICHE_QUERIES[key].map((w: string) => w.toLowerCase()));
              const newTopics = (topics as string[]).filter(t => typeof t === "string" && t.trim() && !existing.has(t.toLowerCase()));
              NICHE_QUERIES[key] = [...NICHE_QUERIES[key], ...newTopics];
              totalDist += newTopics.length;
            }
          }
          console.log(`🤖 AI distributed ${totalDist} trending topics across niches`);
        }
      } catch (e) {
        console.warn("AI trending distribution failed:", (e as Error).message);
      }
    }
  }

  const allAvailableNiches = Object.keys(NICHE_QUERIES);
  let allNicheKeys = allAvailableNiches;

  if (targetNiches) {
    allNicheKeys = allNicheKeys.filter((n) => targetNiches!.includes(n));
  }

  console.log(`Loaded niches=${allAvailableNiches.length}, processing=${allNicheKeys.length}`);

  if (allNicheKeys.length === 0) {
    return new Response(JSON.stringify({ error: "No niches configured (or none matched target_niches)" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // =========================
  // Load thresholds from DB
  // =========================
  const { data: thresholdsRow } = await adminClient
    .from("trend_settings")
    .select("value")
    .eq("key", "thresholds")
    .single();

  const thresholds = (thresholdsRow?.value as any) || {};
  const queriesPerNiche = thresholds.queries_per_niche ?? 8;
  const weakNicheThreshold = thresholds.weak_niche_threshold ?? 20;
  const weakQueriesPerNiche = thresholds.weak_queries_per_niche ?? 12;

  // =========================
  // Load per-category limits (supports per-lang: { kk: N, ru: N, en: N } or flat number)
  // =========================
  const { data: categoryLimitsRow } = await adminClient
    .from("trend_settings")
    .select("value")
    .eq("key", "category_limits")
    .maybeSingle();

  const rawCategoryLimits: Record<string, any> = (categoryLimitsRow?.value as any) || {};
  
  // Resolve effective limit for a niche based on targetLang
  const getEffectiveLimit = (nicheKey: string): number => {
    const val = rawCategoryLimits[nicheKey];
    if (!val) return 0;
    if (typeof val === "number") return val;
    if (typeof val === "object" && targetLang) {
      return val[targetLang] ?? 0;
    }
    // No lang filter: sum all lang limits
    if (typeof val === "object") {
      return (val.kk || 0) + (val.ru || 0) + (val.en || 0);
    }
    return 0;
  };
  
  // Backward compat: categoryLimits[key] still used in some places
  const categoryLimits: Record<string, number> = {};
  for (const key of Object.keys(rawCategoryLimits)) {
    categoryLimits[key] = getEffectiveLimit(key);
  }

  // =========================
  // Weak niches detection
  // =========================
  const sinceIso = new Date(Date.now() - 30 * 24 * 3600000).toISOString();
  const { data: nicheRows, error: nicheRowsErr } = await adminClient
    .from("videos")
    .select("niche")
    .gte("published_at", sinceIso);

  if (nicheRowsErr) console.warn("Weak niche scan error:", nicheRowsErr.message);

  const nicheCountMap: Record<string, number> = {};
  for (const row of nicheRows || []) {
    if (row.niche) nicheCountMap[row.niche] = (nicheCountMap[row.niche] || 0) + 1;
  }

  const WEAK_NICHES = new Set(
    allNicheKeys.filter((n) => (nicheCountMap[n] || 0) < weakNicheThreshold),
  );

  if (batchIndex === 0) {
    console.log(`Weak niches (<${weakNicheThreshold} in last 30d): ${[...WEAK_NICHES].join(", ")}`);
    console.log(`Category limits: ${JSON.stringify(categoryLimits)}`);
  }

  // =========================
  // Logs (accumulate stats across batches)
  // =========================
  let nicheStats: Record<string, number> = {};
  let totalSaved = 0;
  let keywordsUsedPerNiche: Record<string, string[]> = {};

  if (logId) {
    const { data: existingLog } = await adminClient
      .from("trend_refresh_logs")
      .select("niche_stats, total_saved")
      .eq("id", logId)
      .single();

    if (existingLog) {
      nicheStats = (existingLog.niche_stats as Record<string, number>) || {};
      totalSaved = existingLog.total_saved || 0;
    }
  }

  // Create log entry on first batch only
  if (!logId) {
    // Only supersede running logs for the SAME language to allow parallel multi-lang runs
    const supersedeQuery = adminClient
      .from("trend_refresh_logs")
      .update({
        status: "error",
        error_message: "Superseded by new run",
        finished_at: new Date().toISOString(),
      })
      .eq("status", "running");
    
    // Filter by language in niche_stats metadata if possible
    await supersedeQuery;

    const { data: logEntry } = await adminClient
      .from("trend_refresh_logs")
      .insert({
        mode: targetLang ? `${mode}_${targetLang}` : mode,
        status: "running",
        total_saved: 0,
        general_saved: 0,
        niche_stats: { _lang: targetLang || "all" },
        triggered_by: userId,
      })
      .select("id")
      .single();

    logId = logEntry?.id || null;
  }

  const chainNextBatch = async (nextBatch: number) => {
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/refresh-trends`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode, batch: nextBatch, logId, target_niches: targetNiches, lang: targetLang }),
      });
      // Consume response body to prevent resource leak
      await res.text();
    } catch (e) {
      console.error("Chain call failed:", e);
    }
  };

  // =========================
  // Enforce category limit
  // =========================
  const enforceLimit = async (nicheKey: string, limit: number) => {
    if (!limit || limit <= 0) return;

    const freshCutoff = new Date(Date.now() - 7 * 24 * 3600000).toISOString();
    const { count } = await adminClient
      .from("videos")
      .select("id", { count: "exact", head: true })
      .eq("sub_niche", nicheKey)
      .gte("published_at", freshCutoff);

    const currentCount = count || 0;
    if (currentCount <= limit) return;

    const excess = currentCount - limit;
    const { data: weakest } = await adminClient
      .from("videos")
      .select("id")
      .eq("sub_niche", nicheKey)
      .order("trend_score", { ascending: true })
      .limit(excess);

    if (weakest && weakest.length > 0) {
      const ids = weakest.map((v) => v.id);
      for (let i = 0; i < ids.length; i += 50) {
        await adminClient.from("videos").delete().in("id", ids.slice(i, i + 50));
      }
      console.log(`🗑 ${nicheLabel(nicheKey)}: removed ${weakest.length} weakest videos (limit=${limit})`);
    }
  };

  // =========================
  // Process one niche (EnsembleData — one call per keyword, no pagination needed)
  // =========================
  const processNiche = async (nicheKey: string) => {
    const limit = categoryLimits[nicheKey] || 0;

    const qCount = WEAK_NICHES.has(nicheKey) ? weakQueriesPerNiche : queriesPerNiche;
    const allKeywords = NICHE_QUERIES[nicheKey] || [];

    // Per-niche cursor
    const { data: cursorRow } = await adminClient
      .from("trend_niche_cursors")
      .select("cursor")
      .eq("niche", nicheKey)
      .maybeSingle();

    const nicheRotationIndex = cursorRow?.cursor ?? 0;
    const nicheSeed = nicheKey;

    const selectedKeywords = pickRotatedKeywords(nicheKey, allKeywords, qCount, nicheSeed, nicheRotationIndex);
    keywordsUsedPerNiche[nicheKey] = selectedKeywords;

    console.log(`  🔑 ${nicheLabel(nicheKey)}: picked ${selectedKeywords.length}/${allKeywords.length} keywords (cursor=${nicheRotationIndex}): ${selectedKeywords.slice(0, 5).join(", ")}${selectedKeywords.length > 5 ? "..." : ""}`);

    let nicheSaved = 0;
    let nicheAccepted = 0;
    let nicheReassigned = 0;
    let nicheDiscarded = 0;

    // EnsembleData sorting: "2" = date, "1" = likes
    const sortTypes = ["2", "1"];
    // Prioritize fresh content: 75% queries use period=7, 25% use period=30
    const periods = ["7", "7", "7", "30"];

    for (let qi = 0; qi < selectedKeywords.length; qi++) {
      if (Date.now() - startTime > MAX_EXECUTION_MS) break;

      // Re-check limit before each query
      if (limit && limit > 0) {
        const freshCutoff7 = new Date(Date.now() - 7 * 24 * 3600000).toISOString();
        const { count: midCount } = await adminClient
          .from("videos")
          .select("id", { count: "exact", head: true })
          .eq("niche", nicheKey)
          .gte("published_at", freshCutoff7);

        if ((midCount || 0) >= limit) {
          console.log(`⏭ ${nicheLabel(nicheKey)}: reached 7d limit (${midCount}/${limit}), stopping`);
          break;
        }
      }

      const query = selectedKeywords[qi];
      const sorting = sortTypes[qi % sortTypes.length];
      const period = periods[qi % periods.length];

      if (qi > 0) await sleep(1500); // Rate limit between queries

      try {
        console.log(`ED params: query="${query}", period=${period}, sorting=${sorting}`);
        const rawVideos = await callEnsembleData(query, period, sorting);
        await logApiUsage("keyword_full_search", 1, { niche: nicheKey, query, period, sorting, results: rawVideos.length });
        console.log(`  ED returned ${rawVideos.length} raw videos for "${query}"`);

        if (rawVideos.length === 0) continue;

        // Log first video sample on first query
        if (qi === 0 && rawVideos.length > 0) {
          const sample = rawVideos[0];
          const sampleKeys = Object.keys(sample);
          console.log(`  First video keys: ${JSON.stringify(sampleKeys)}`);
        }

        let noId = 0, lowViews = 0, tooOld = 0, inBatchDup = 0, nonCyrillic = 0;

        const rowsRaw = rawVideos.map((item: any) => {
          // Unwrap aweme_info wrapper
          const v = item.aweme_info || item;

          const awemeId = v.aweme_id || v.id || "";
          if (!awemeId) { noId++; return null; }

          const stats = v.statistics || v.stats || {};
          const views = stats.play_count ?? stats.playCount ?? stats.views ?? v.views ?? 0;
          const likes = stats.digg_count ?? stats.diggCount ?? stats.likes ?? v.likes ?? 0;
          const comments = stats.comment_count ?? stats.commentCount ?? stats.comments ?? v.comments ?? 0;
          const shares = stats.share_count ?? stats.shareCount ?? stats.shares ?? v.shares ?? 0;

          if (views < MIN_VIEWS) { lowViews++; return null; }

          // Filter: reject non-KK/RU Cyrillic (Ukrainian, Bulgarian, Uzbek, Kyrgyz, etc.)
          const caption = v.desc || "";
          // Ukrainian chars
          const hasUkrainianChars = /[їєґЇЄҐ]/u.test(caption);
          if (hasUkrainianChars) { nonCyrillic++; return null; }
          // Uzbek-specific chars (ў, ҳ — NOT shared with Kazakh)
          const hasUzbekChars = /[ўҳЎҲ]/u.test(caption);
          if (hasUzbekChars) { nonCyrillic++; return null; }
          // Bulgarian/Serbian indicators
          const hasBulgarianIndicators = /[ъЪ]/u.test(caption) && !/[әңғүұқөһӘҢҒҮҰҚӨҺ]/u.test(caption)
            && /\b(на|от|за|при|към|или|има|ще|бъде|също|повече|цена|цени|може)\b/iu.test(caption);
          if (hasBulgarianIndicators) { nonCyrillic++; return null; }
          // Kyrgyz-specific stopwords (Kyrgyz uses ң,ү,ө like Kazakh but has unique grammar)
          const hasKyrgyzIndicators = /\b(менен|жана|болгон|кылуу|үчүн|кыргыз|бишкек|кыргызстан|жөнүндө|керектүү|болуп|жатат)\b/iu.test(caption);
          if (hasKyrgyzIndicators) { nonCyrillic++; return null; }

          if (targetLang === "kk") {
            // KK mode: accept any Cyrillic text, AI will verify Kazakh language later
            const hasCyrillic = /[а-яА-ЯёЁәңғүұқөһіӘҢҒҮҰҚӨҺІ]/u.test(caption);
            if (!hasCyrillic) {
              nonCyrillic++;
              return null;
            }
            // Preliminary lang tag, AI verification will reject non-Kazakh
            var detectedLang = "kk";
          } else if (targetLang === "en") {
            // English mode: accept any video
            var detectedLang = "en";
          } else {
            // Russian mode: require Cyrillic, reject if has Kazakh-specific chars (those go to KK)
            const hasCyrillic = /[а-яА-ЯёЁ]/u.test(caption);
            if (!hasCyrillic) { nonCyrillic++; return null; }
            var detectedLang = "ru";
          }

          const publishedAtStr = getPublishedAt(v.create_time || v.createTime || 0);
          const publishedAt = new Date(publishedAtStr);
          if (publishedAt < maxAgeCutoff) { tooOld++; return null; }

          const author = v.author || {};
          const videoInfo = v.video || {};
          const uniqueId = author.unique_id || author.uniqueId || "";
          const nickname = author.nickname || "";
          const avatarUrl = author.avatar_thumb?.url_list?.[0] || author.avatar_larger?.url_list?.[0] || "";
          const coverUrl = videoInfo.cover?.url_list?.[0] || videoInfo.origin_cover?.url_list?.[0] || "";
          const captionText = v.desc || "";
          const duration = videoInfo.duration || null;

          const trends = computeTrend(views, likes, comments, publishedAt);

    const resolved = resolveNiche(nicheKey);

          return {
            platform: "tiktok",
            platform_video_id: String(awemeId),
            url: `https://www.tiktok.com/@${uniqueId || "user"}/video/${awemeId}`,
            caption: captionText,
            cover_url: coverUrl,
            author_username: uniqueId,
            author_display_name: nickname,
            author_avatar_url: avatarUrl,
            views,
            likes,
            comments,
            shares,
            duration_sec: duration,
            fetched_at: nowIso,
            region: "world",
            niche: resolved.niche,
            sub_niche: resolved.sub_niche,
            categories: [resolved.niche],
            published_at: publishedAtStr,
            lang: detectedLang,
            ...trends,
          };
        }).filter(Boolean) as any[];

        // Local dedupe
        const map = new Map<string, any>();
        for (const r of rowsRaw) {
          if (map.has(r.platform_video_id)) inBatchDup++;
          map.set(r.platform_video_id, r);
        }
        const videoRows = [...map.values()];

        console.log(
          `  📊 "${query}": ${rawVideos.length} raw → ${videoRows.length} valid (noId=${noId}, lowViews=${lowViews}, tooOld=${tooOld}, nonCyrillic=${nonCyrillic}, inBatchDup=${inBatchDup})`,
        );

        if (videoRows.length === 0) continue;

        // Check which are new
        const platformIds = videoRows.map((v: any) => v.platform_video_id);

        const { data: existing } = await adminClient
          .from("videos")
          .select("platform_video_id")
          .eq("platform", "tiktok")
          .in("platform_video_id", platformIds);

        const existingIds = new Set((existing || []).map((e: any) => e.platform_video_id));
        
        // Split: new videos get full insert (with niche), existing only get stats update (no niche overwrite)
        const newVideos = videoRows.filter((v: any) => !existingIds.has(v.platform_video_id));
        const existingVideos = videoRows.filter((v: any) => existingIds.has(v.platform_video_id));
        const newCount = newVideos.length;

        console.log(`  💾 "${query}": ${newCount} new / ${existingIds.size} dupes`);

        // AI verification: strict language gate (KK) + niche verification
        let verifiedNewVideos = newVideos;
        if (newVideos.length > 0) {
          const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
          if (LOVABLE_API_KEY) {
            try {
              let candidateVideos = newVideos;

              // Stage 1 (KK only): strict language gate before category verification
              if (targetLang === "kk") {
                const languageCaptions = newVideos
                  .map((v: any, idx: number) => `${idx}: ${(v.caption || "").slice(0, 300)}`)
                  .join("\n");

                try {
                  const langRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
                    body: JSON.stringify({
                      model: "google/gemini-2.5-flash",
                      messages: [
                        {
                          role: "system",
                          content: `Classify each caption language strictly.
Return ONLY JSON:
{"labels":[{"index":0,"lang":"kk|ru|other"}]}
Rules:
- "kk" only if PRIMARY language is Kazakh.
- Russian text (even with Kazakh hashtags) => "ru".
- Mixed text => choose dominant language.
- If unclear or no meaningful text => "other".
Include every index exactly once.`,
                        },
                        { role: "user", content: languageCaptions },
                      ],
                    }),
                  });

                  const langData = await langRes.json();
                  const langContent = langData?.choices?.[0]?.message?.content || "";
                  const langJsonMatch = langContent.match(/\{[\s\S]*\}/);
                  if (!langJsonMatch) throw new Error("No JSON from language gate");

                  const langResult = JSON.parse(langJsonMatch[0]);
                  const labels: Array<{ index: number; lang: string }> = Array.isArray(langResult?.labels)
                    ? langResult.labels
                    : [];
                  if (labels.length === 0) throw new Error("Empty labels from language gate");

                  const kkIndices = new Set<number>(
                    labels
                      .filter((l: any) => Number.isInteger(l?.index) && String(l?.lang || "").toLowerCase() === "kk")
                      .map((l: any) => Number(l.index)),
                  );

                  candidateVideos = newVideos.filter((_: any, idx: number) => kkIndices.has(idx));
                  const nonKkCount = newVideos.length - candidateVideos.length;
                  nicheDiscarded += nonKkCount;

                  if (nonKkCount > 0) {
                    const rejectedSamples = newVideos
                      .filter((_: any, idx: number) => !kkIndices.has(idx))
                      .slice(0, 3)
                      .map((v: any) => `    ${(v.caption || "").slice(0, 60)}`)
                      .join("\n");
                    console.log(`  🌐 KK language gate: kept ${candidateVideos.length}/${newVideos.length}, discarded ${nonKkCount}`);
                    if (rejectedSamples) console.log(`  🚫 Non-KK samples:\n${rejectedSamples}`);
                  } else {
                    console.log(`  🌐 KK language gate: kept ${candidateVideos.length}/${newVideos.length}`);
                  }
                } catch (langErr) {
                  // Deterministic fallback if AI language gate fails
                  candidateVideos = newVideos.filter((v: any) => likelyKazakhCaption(v.caption || ""));
                  const nonKkCount = newVideos.length - candidateVideos.length;
                  nicheDiscarded += nonKkCount;
                  console.warn(
                    `KK language gate fallback used: kept ${candidateVideos.length}/${newVideos.length}, discarded ${nonKkCount}. Reason: ${(langErr as Error).message}`,
                  );
                }
              }

              if (candidateVideos.length > 0) {
                const captions = candidateVideos
                  .map((v: any, idx: number) => `${idx}: ${(v.caption || "").slice(0, 300)}`)
                  .join("\n");
                const nicheDisplayName = nicheLabel(nicheKey);
                const parentNiche = SUB_NICHE_TO_NICHE[nicheKey] || nicheKey;
                const parentNicheLabel = SUB_NICHE_LABELS_MAP[parentNiche] || parentNiche;

                // Build available sub-niches list for reassignment
                const availableSubNiches = Object.entries(SUB_NICHE_LABELS)
                  .map(([k, v]) => {
                    const parent = SUB_NICHE_TO_NICHE[k] || k;
                    const parentLabel = SUB_NICHE_LABELS_MAP[parent] || parent;
                    return `"${k}" = ${v} (${parentLabel})`;
                  })
                  .join("\n");

                const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                  method: "POST",
                  headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
                  body: JSON.stringify({
                    model: "google/gemini-2.5-flash",
                    messages: [
                      { role: "system", content: `You are a strict video categorization verifier. Given numbered TikTok video captions, determine which ones ACTUALLY belong to the category "${nicheDisplayName}" (parent: "${parentNicheLabel}").
${targetLang === "kk" ? `
LANGUAGE CHECK (CRITICAL for KK mode):
- ONLY accept videos where the caption is in KAZAKH language
- REJECT videos that are purely in Russian (no Kazakh words/grammar)
- REJECT videos in Uzbek, Kyrgyz, Ukrainian, or other languages
- Kazakh indicators: specific letters (ә,ң,ғ,ү,ұ,қ,ө,һ,і), Kazakh grammar, Kazakh words
- Videos mixing Kazakh+Russian are OK if primary language is Kazakh
- Put non-Kazakh videos in "discarded" with reason "wrong_language"
` : ""}
INCLUDE in "accepted":
- Videos directly about ${nicheDisplayName}: products, reviews, tutorials, tips, trends
- Commercial content (brands, prices, unboxing) IF about ${nicheDisplayName} products
- Lifestyle content that primarily focuses on ${nicheDisplayName}

REJECT from this category:
- Food/cooking/recipe videos — UNLESS category is food-related
- Crime, violence, death, missing persons, accidents, tragedies
- Videos about a DIFFERENT product category (e.g. food review in "Jewelry", car video in "Clothing")
- Political, religious, news content in lifestyle categories
- Videos where ${nicheDisplayName} is not the main topic
- Videos in Bulgarian, Serbian, or other non-Russian/non-Kazakh Cyrillic languages

For REJECTED videos, assign them to the SPECIFIC sub-niche from this list:
${availableSubNiches}

CRITICAL: For "reassigned", use ONLY exact sub_niche keys from the list above (e.g. "recipes", "home_cooking", "humor", "football").
Do NOT use parent niche keys like "food", "entertainment", "sports".

If a rejected video doesn't fit ANY sub-niche (crime, violence, spam, foreign language), put it in "discarded".

Return JSON:
{"accepted": [0, 2], "reassigned": [{"index": 1, "sub_niche": "recipes"}, {"index": 3, "sub_niche": "football"}], "discarded": [5]}

Every index must appear in exactly one array.` },
                      { role: "user", content: captions },
                    ],
                  }),
                });
                const aiData = await aiRes.json();
                const content = aiData?.choices?.[0]?.message?.content || "";
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const result = JSON.parse(jsonMatch[0]);
                  const acceptedIndices = new Set((result.accepted || []).map(Number));
                  const reassigned: Array<{ index: number; sub_niche?: string; niche?: string }> = result.reassigned || [];
                  const discarded: number[] = result.discarded || [];

                  const before = candidateVideos.length;
                  verifiedNewVideos = candidateVideos.filter((_: any, idx: number) => acceptedIndices.has(idx));
                  nicheAccepted += verifiedNewVideos.length;

                  // Log accepted
                  if (verifiedNewVideos.length < before) {
                    console.log(`  🤖 AI: ✅${verifiedNewVideos.length} ♻️${reassigned.length} 🗑️${discarded.length} (total ${before})`);
                  }

                  // Reassign videos to correct sub-niches (SKIP in KK mode — non-Kazakh videos should not be saved)
                  if (reassigned.length > 0 && targetLang !== "kk") {
                    const validReassigned = reassigned.filter((r) => {
                      // Support both sub_niche and niche keys from AI
                      const subKey = r.sub_niche || r.niche;
                      if (!subKey) {
                        nicheDiscarded++;
                        return false;
                      }
                      // Check if it's a valid sub_niche key
                      if (SUB_NICHE_TO_NICHE[subKey]) return true;
                      // Check if it's a valid parent niche key
                      if (SUB_NICHE_LABELS_MAP[subKey]) return true;
                      nicheDiscarded++;
                      return false;
                    });

                    for (const r of validReassigned) {
                      const video = candidateVideos[r.index];
                      if (!video) continue;
                      const subKey = r.sub_niche || r.niche || "";

                      if (SUB_NICHE_TO_NICHE[subKey]) {
                        video.niche = SUB_NICHE_TO_NICHE[subKey];
                        video.sub_niche = subKey;
                      } else if (SUB_NICHE_LABELS_MAP[subKey]) {
                        video.niche = subKey;
                        const subs = NICHE_TO_SUB_NICHES[subKey];
                        video.sub_niche = subs && subs.length > 0 ? subs[0] : null;
                      }
                      video.categories = [video.niche];
                    }

                    const reassignedVideos = validReassigned
                      .filter((r) => candidateVideos[r.index])
                      .map((r) => candidateVideos[r.index]);

                    if (reassignedVideos.length > 0) {
                      const { error: reErr } = await adminClient
                        .from("videos")
                        .upsert(reassignedVideos, { onConflict: "platform,platform_video_id" });
                      if (reErr) {
                        console.error(`  Reassign insert error:`, reErr.message);
                      } else {
                        nicheReassigned += reassignedVideos.length;
                        const reassignLog = validReassigned
                          .map((r) => {
                            const v = candidateVideos[r.index];
                            return `    → ${v?.sub_niche || v?.niche}: ${(v?.caption || "").slice(0, 60)}`;
                          })
                          .join("\n");
                        console.log(`  ♻️ Reassigned:\n${reassignLog}`);
                      }
                    }
                  } else if (reassigned.length > 0 && targetLang === "kk") {
                    // In KK mode, reassigned = non-Kazakh videos, just discard them
                    nicheDiscarded += reassigned.length;
                    console.log(`  🚫 KK mode: ${reassigned.length} non-Kazakh videos discarded (not reassigned)`);
                  }

                  // Log discarded
                  nicheDiscarded += discarded.length;
                  if (discarded.length > 0) {
                    const discardLog = discarded
                      .map((idx) => `    ${(candidateVideos[idx]?.caption || "").slice(0, 60)}`)
                      .join("\n");
                    console.log(`  🗑️ Discarded:\n${discardLog}`);
                  }
                }
              } else {
                verifiedNewVideos = [];
              }
            } catch (aiErr) {
              console.warn("AI verification failed, accepting all:", (aiErr as Error).message);
            }
          }
        }

        if (targetLang === "kk" && verifiedNewVideos.length > 0) {
          const beforeVeto = verifiedNewVideos.length;
          verifiedNewVideos = verifiedNewVideos.filter((v: any) => likelyKazakhCaption(v.caption || ""));
          const vetoed = beforeVeto - verifiedNewVideos.length;
          if (vetoed > 0) {
            nicheDiscarded += vetoed;
            console.log(`  🛡️ KK deterministic veto: removed ${vetoed} non-Kazakh captions before insert`);
          }
        }

        // Insert verified new videos with niche assignment
          const { error: insertErr } = await adminClient
            .from("videos")
            .upsert(verifiedNewVideos, { onConflict: "platform,platform_video_id" });
          if (insertErr) {
            console.error(`Insert error for ${nicheKey}:`, insertErr.message);
          } else {
            nicheSaved += verifiedNewVideos.length;
          }
        }

        // Update existing videos: only stats, no niche/sub_niche/categories overwrite
        for (const ev of existingVideos) {
          await adminClient
            .from("videos")
            .update({
              views: ev.views,
              likes: ev.likes,
              comments: ev.comments,
              shares: ev.shares,
              velocity_views: ev.velocity_views,
              velocity_likes: ev.velocity_likes,
              velocity_comments: ev.velocity_comments,
              trend_score: ev.trend_score,
              fetched_at: ev.fetched_at,
            })
            .eq("platform", "tiktok")
            .eq("platform_video_id", ev.platform_video_id);
        }

      } catch (err) {
        console.error(`Niche ${nicheKey} query "${query}" failed:`, (err as Error).message);
      }
    }

    // Trim if over limit
    const limitVal = categoryLimits[nicheKey];
    if (limitVal && limitVal > 0) await enforceLimit(nicheKey, limitVal);

    // Advance per-niche cursor for next run
    await adminClient
      .from("trend_niche_cursors")
      .upsert(
        { niche: nicheKey, cursor: nicheRotationIndex + 1, updated_at: new Date().toISOString() },
        { onConflict: "niche" }
      );

    return { saved: nicheSaved, accepted: nicheAccepted, reassigned: nicheReassigned, discarded: nicheDiscarded };
  };

  // =========================
  // Batch selection
  // =========================
  const totalBatches = Math.ceil(allNicheKeys.length / BATCH_SIZE);
  const start = batchIndex * BATCH_SIZE;
  const nicheKeys = allNicheKeys.slice(start, start + BATCH_SIZE);

  if (nicheKeys.length === 0) {
    return new Response(JSON.stringify({ success: true, batch: batchIndex, totalSaved, nicheStats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log(`Batch ${batchIndex}/${totalBatches}: processing ${nicheKeys.map(k => nicheLabel(k)).join(", ")}`);

  // Check limits before processing
  const nichesToProcess: string[] = [];
  for (const nicheKey of nicheKeys) {
    const limit = categoryLimits[nicheKey];
    if (limit && limit > 0) {
      const freshCutoff7 = new Date(Date.now() - 7 * 24 * 3600000).toISOString();
      const { count } = await adminClient
        .from("videos")
        .select("id", { count: "exact", head: true })
        .eq("sub_niche", nicheKey)
        .gte("published_at", freshCutoff7);

      if ((count || 0) >= limit) {
        console.log(`⏭ ${nicheLabel(nicheKey)}: already at 7d limit (${count}/${limit}), skipping`);
        nicheStats[nicheKey] = 0;
        continue;
      }
    }
    nichesToProcess.push(nicheKey);
  }

  // Process niches
  for (const nicheKey of nichesToProcess) {
    if (Date.now() - startTime > MAX_EXECUTION_MS) {
      console.log(`⏱ Timeout safety: stopping after ${Math.round((Date.now() - startTime) / 1000)}s`);
      break;
    }

    try {
      const result = await processNiche(nicheKey);
      nicheStats[nicheKey] = {
        saved: result.saved,
        accepted: result.accepted,
        reassigned: result.reassigned,
        discarded: result.discarded,
      };
      totalSaved += result.saved;
      console.log(`✓ ${nicheLabel(nicheKey)}: ✅${result.accepted} saved, ♻️${result.reassigned} reassigned, 🗑️${result.discarded} discarded`);
    } catch (e) {
      console.error(`✗ ${nicheLabel(nicheKey)} failed:`, (e as Error).message);
      nicheStats[nicheKey] = { saved: 0, accepted: 0, reassigned: 0, discarded: 0 };
    }

    await sleep(1000);
  }

  // Update log
  if (logId) {
    await adminClient
      .from("trend_refresh_logs")
      .update({
        total_saved: totalSaved,
        niche_stats: {
          ...nicheStats,
          _rotation: {
            mode: "per_niche_cursor",
            keywords_used: keywordsUsedPerNiche,
          },
        },
      })
      .eq("id", logId);
  }

  // Check stop flag
  let wasStopped = false;
  if (logId) {
    const { data: currentLog } = await adminClient
      .from("trend_refresh_logs")
      .select("status")
      .eq("id", logId)
      .single();
    wasStopped = currentLog?.status === "error";
  }

  const nextBatch = batchIndex + 1;
  if (!wasStopped && nextBatch < totalBatches) {
    console.log(`Chaining to batch ${nextBatch}/${totalBatches}...`);
    await chainNextBatch(nextBatch);
  } else {
    // Auto-cleanup: remove videos older than MAX_AGE_DAYS
    const cutoffDate = new Date(Date.now() - MAX_AGE_DAYS * 24 * 3600000).toISOString();
    const { count: deletedCount } = await adminClient
      .from("videos")
      .delete({ count: "exact" })
      .lt("published_at", cutoffDate);
    if (deletedCount && deletedCount > 0) {
      console.log(`🧹 Auto-cleanup: removed ${deletedCount} videos older than ${MAX_AGE_DAYS} days`);
    }

    // =========================
    // Refresh stale cover/stats (economical: 10 videos per run, 72h stale threshold)
    // Prioritizes high-view videos first for maximum impact with minimal credits
    // =========================
    const COVER_STALE_HOURS = 72;
    const COVER_REFRESH_LIMIT = 10;
    const staleCutoff = new Date(Date.now() - COVER_STALE_HOURS * 3600000).toISOString();

    const { data: staleVideos } = await adminClient
      .from("videos")
      .select("id, platform_video_id, author_username")
      .lt("fetched_at", staleCutoff)
      .gte("published_at", new Date(Date.now() - MAX_AGE_DAYS * 24 * 3600000).toISOString())
      .order("views", { ascending: false })
      .limit(COVER_REFRESH_LIMIT);

    if (staleVideos && staleVideos.length > 0) {
      console.log(`🖼 Refreshing covers for ${staleVideos.length} stale videos (economical mode)...`);
      let coverUpdated = 0;
      let coverFailed = 0;

      for (const sv of staleVideos) {
        if (Date.now() - startTime > MAX_EXECUTION_MS - 5000) {
          console.log("⏱ Cover refresh: timeout safety, stopping");
          break;
        }

        try {
          const postUrl = `https://www.tiktok.com/@${sv.author_username || "user"}/video/${sv.platform_video_id}`;
          const params = new URLSearchParams({
            url: postUrl,
            token: ensembleToken,
          });
          const res = await fetch(`${ENSEMBLE_BASE}/tt/post/info?${params.toString()}`);

          if (res.ok) {
            const json = await res.json();
            const postData = json?.data?.aweme_detail || json?.data;
            if (postData) {
              const videoInfo = postData.video || {};
              const newCover = videoInfo.cover?.url_list?.[0] || videoInfo.origin_cover?.url_list?.[0] || "";
              const author = postData.author || {};
              const newAvatar = author.avatar_thumb?.url_list?.[0] || author.avatar_larger?.url_list?.[0] || "";

              const updateFields: Record<string, any> = { fetched_at: new Date().toISOString() };
              if (newCover) updateFields.cover_url = newCover;
              if (newAvatar) updateFields.author_avatar_url = newAvatar;

              const stats = postData.statistics || {};
              if (stats.play_count != null) updateFields.views = stats.play_count;
              if (stats.digg_count != null) updateFields.likes = stats.digg_count;
              if (stats.comment_count != null) updateFields.comments = stats.comment_count;
              if (stats.share_count != null) updateFields.shares = stats.share_count;

              if (updateFields.views) {
                const pubAt = new Date((postData.create_time || 0) * 1000);
                const trends = computeTrend(
                  updateFields.views || 0,
                  updateFields.likes || 0,
                  updateFields.comments || 0,
                  pubAt.getTime() > 0 ? pubAt : new Date()
                );
                Object.assign(updateFields, trends);
              }

              await adminClient.from("videos").update(updateFields).eq("id", sv.id);
              coverUpdated++;
            } else {
              await adminClient.from("videos").update({ fetched_at: new Date().toISOString() }).eq("id", sv.id);
              coverFailed++;
            }
          } else {
            await adminClient.from("videos").update({ fetched_at: new Date().toISOString() }).eq("id", sv.id);
            coverFailed++;
          }

          await logApiUsage("post_info_cover_refresh", 1, { platform_video_id: sv.platform_video_id });
          await sleep(1200);
        } catch (e) {
          console.error(`Cover refresh failed for ${sv.platform_video_id}:`, (e as Error).message);
          coverFailed++;
        }
      }

      console.log(`🖼 Cover refresh done: ${coverUpdated} updated, ${coverFailed} failed (max ${COVER_REFRESH_LIMIT}/run)`);
    }

    console.log(`Refresh COMPLETE (accumulated totalSaved=${totalSaved})`);
    if (logId) {
      await adminClient
        .from("trend_refresh_logs")
        .update({
          status: "done",
          total_saved: totalSaved,
          general_saved: 0,
          niche_stats: {
            ...nicheStats,
            _rotation: {
              mode: "per_niche_cursor",
              keywords_used: keywordsUsedPerNiche,
            },
          },
          finished_at: new Date().toISOString(),
        })
        .eq("id", logId);
    }

  }

  return new Response(JSON.stringify({ success: true, batch: batchIndex, totalSaved, nicheStats }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
