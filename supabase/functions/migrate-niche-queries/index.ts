import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Maps old DB keys → valid sub-niche keys from niches.ts
const MERGE_MAP: Record<string, string> = {
  ai_avatars: "ai_generation",
  ai_video: "ai_generation",
  auto_hacks: "auto_repair",
  bags: "accessories",
  baking: "desserts",
  barbershop: "haircare",
  beauty_hacks: "skincare",
  blogging: "content_creation",
  career: "freelance",
  cats: "pets",
  cleaning: "organization",
  console_games: "pc_games",
  cozy_home: "interior",
  cyber_security: "programming",
  diet: "weight_loss",
  diy: "crafts",
  dogs: "pets",
  dropshipping: "ecommerce",
  exotic_pets: "pets",
  fastfood: "street_food",
  fitness_general: "healthy_lifestyle",
  food_delivery: "restaurants",
  gardening_hobby: "garden",
  habits: "productivity",
  hairstyles: "haircare",
  hockey: "sports_news",
  home_design: "interior",
  investing: "finance",
  kazakh_culture: "kazakh_traditions",
  kids_education: "parenting",
  kpop: "music",
  marketplace: "ecommerce",
  math_science: "school_ent",
  medicine: "doctors",
  men_clothing: "clothing",
  muscle_gain: "gym",
  national_cuisine: "kazakh_cuisine",
  newborns: "motherhood",
  online_business: "ecommerce",
  pedicure: "manicure",
  pop_culture: "humor",
  pranks: "humor",
  psychology_general: "mental_health",
  quick_recipes: "recipes",
  reactions: "humor",
  real_estate: "apartments",
  realestate: "apartments",
  roblox_minecraft: "mobile_games",
  running: "healthy_lifestyle",
  sales: "marketing",
  sketches: "humor",
  smartphones: "gadgets",
  smm: "marketing",
  startups: "business_ideas",
  streetwear: "clothing",
  stretching: "yoga",
  study_tips: "school_ent",
  target_ads: "marketing",
  tennis: "sports_news",
  tourism: "hotels",
  travel_hacks: "travel_general",
  university: "online_courses",
  videography: "video_editing",
  watches: "jewelry",
  web_dev: "programming",
  women_clothing: "clothing",
};

// Keys to completely remove (no matching sub-niche)
const REMOVE_KEYS = new Set(["astrology", "esoteric", "life_hacks", "tarot"]);

// All valid sub-niche keys
const VALID_SUB_NICHES = new Set([
  "finance", "crypto", "business_ideas", "marketing", "freelance", "ecommerce",
  "skincare", "makeup", "haircare", "manicure", "cosmetology", "perfume",
  "clothing", "shoes", "accessories", "luxury_fashion", "jewelry", "shopping",
  "recipes", "home_cooking", "restaurants", "street_food", "desserts", "coffee_tea",
  "home_workouts", "gym", "weight_loss", "yoga", "healthy_lifestyle", "sports_nutrition",
  "football", "mma_boxing", "basketball", "sports_news", "extreme_sports",
  "languages", "english", "school_ent", "online_courses", "books",
  "mobile_games", "pc_games", "game_reviews", "streaming", "esports",
  "programming", "gadgets", "tech_reviews", "apps",
  "auto_reviews", "chinese_auto", "tuning", "auto_repair", "electric_vehicles", "moto",
  "renovation", "interior", "furniture", "organization", "garden",
  "motherhood", "pregnancy", "parenting", "family_life", "wedding",
  "relationships", "self_development", "motivation", "mental_health", "productivity",
  "humor", "memes", "challenges", "asmr",
  "music", "cinema", "dance", "anime",
  "pets", "pet_care",
  "travel_general", "hotels", "kazakhstan_travel",
  "neural_networks", "ai_tools", "ai_generation", "chatgpt",
  "crafts", "drawing", "photography",
  "doctors", "dentistry", "pharmacy", "nutrition_health",
  "apartments", "mortgage", "new_buildings", "construction",
  "content_creation", "video_editing", "promotion", "monetization", "personal_brand",
  "kazakh_cuisine", "kazakh_history", "kazakh_traditions", "kazakh_language", "kazakh_music", "kazakh_celebrities",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // Read current niche_queries
  const { data: row } = await adminClient
    .from("trend_settings")
    .select("value")
    .eq("key", "niche_queries")
    .single();

  const oldQueries: Record<string, string[]> = (row?.value as any) || {};
  const newQueries: Record<string, string[]> = {};

  // Initialize all valid sub-niches with empty arrays
  for (const key of VALID_SUB_NICHES) {
    newQueries[key] = [];
  }

  const mergeLog: string[] = [];
  const removedKeys: string[] = [];

  for (const [oldKey, queries] of Object.entries(oldQueries)) {
    if (REMOVE_KEYS.has(oldKey)) {
      removedKeys.push(oldKey);
      continue;
    }

    let targetKey = oldKey;
    if (MERGE_MAP[oldKey]) {
      targetKey = MERGE_MAP[oldKey];
      mergeLog.push(`${oldKey} → ${targetKey} (${queries.length} queries)`);
    } else if (!VALID_SUB_NICHES.has(oldKey)) {
      removedKeys.push(oldKey);
      continue;
    }

    // Merge queries, deduplicating
    const existing = new Set((newQueries[targetKey] || []).map(q => q.toLowerCase()));
    for (const q of queries) {
      if (!existing.has(q.toLowerCase())) {
        newQueries[targetKey] = newQueries[targetKey] || [];
        newQueries[targetKey].push(q);
        existing.add(q.toLowerCase());
      }
    }
  }

  // Save
  const { error } = await adminClient
    .from("trend_settings")
    .update({ value: newQueries as any, updated_at: new Date().toISOString() })
    .eq("key", "niche_queries");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Also update category_limits keys
  const { data: limitsRow } = await adminClient
    .from("trend_settings")
    .select("value")
    .eq("key", "category_limits")
    .maybeSingle();

  if (limitsRow?.value) {
    const oldLimits: Record<string, number> = limitsRow.value as any;
    const newLimits: Record<string, number> = {};

    for (const [oldKey, limit] of Object.entries(oldLimits)) {
      let targetKey = oldKey;
      if (MERGE_MAP[oldKey]) targetKey = MERGE_MAP[oldKey];
      else if (!VALID_SUB_NICHES.has(oldKey)) continue;

      // Keep the higher limit when merging
      newLimits[targetKey] = Math.max(newLimits[targetKey] || 0, limit);
    }

    await adminClient
      .from("trend_settings")
      .update({ value: newLimits as any, updated_at: new Date().toISOString() })
      .eq("key", "category_limits");
  }

  const totalKeys = Object.keys(newQueries).length;
  const totalQueries = Object.values(newQueries).reduce((sum, arr) => sum + arr.length, 0);
  const emptyKeys = Object.entries(newQueries).filter(([_, v]) => v.length === 0).map(([k]) => k);

  return new Response(JSON.stringify({
    success: true,
    totalSubNiches: totalKeys,
    totalQueries,
    merged: mergeLog,
    removed: removedKeys,
    emptySubNiches: emptyKeys,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
