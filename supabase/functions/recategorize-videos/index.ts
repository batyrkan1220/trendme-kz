import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAIN_NICHES = [
  "business", "beauty", "fashion", "food", "fitness", "auto", "home",
  "family", "psychology", "entertainment", "media", "animals", "travel",
  "ai", "hobby", "other"
];

const ALL_SUB_NICHES = [
  // business
  "finance", "investing", "crypto", "business_ideas", "startups", "marketing",
  "smm", "target_ads", "sales", "online_business", "freelance", "career",
  // beauty
  "cosmetology", "skincare", "makeup", "haircare", "hairstyles", "barbershop",
  "manicure", "pedicure", "laser_epilation", "plastic_surgery", "beauty_hacks",
  // fashion
  "clothing", "women_clothing", "men_clothing", "kids_clothing", "shoes",
  "bags", "accessories", "streetwear", "luxury_fashion", "branded_clothing", "shopping",
  // food
  "recipes", "quick_recipes", "home_cooking", "national_cuisine", "fastfood",
  "restaurants", "restaurant_reviews", "cafes", "street_food", "food_delivery",
  "cooking_hacks", "desserts", "baking",
  // fitness
  "fitness_general", "home_workouts", "gym", "weight_loss", "muscle_gain",
  "yoga", "pilates", "healthy_lifestyle", "diet", "sports_nutrition",
  // auto
  "auto_reviews", "chinese_auto", "tuning", "auto_hacks", "auto_repair",
  "auto_news", "car_dealership", "electric_vehicles",
  // home
  "renovation", "interior", "home_design", "furniture", "cozy_home", "organization", "garden",
  // family
  "motherhood", "pregnancy", "newborns", "parenting", "family_life",
  // psychology
  "psychology_general", "relationships", "self_development", "motivation", "mental_health",
  // entertainment
  "humor", "sketches", "memes", "challenges", "reactions",
  // media
  "music", "cinema", "series", "pop_culture", "dance",
  // animals
  "dogs", "cats", "pets", "pet_care",
  // travel
  "travel_general", "hotels", "tourism", "travel_hacks",
  // ai
  "neural_networks", "ai_tools", "ai_generation", "ai_avatars", "ai_video",
  // hobby
  "crafts", "diy", "drawing", "photography",
  // other
  "esoteric", "tarot", "astrology",
];

const SUB_NICHE_TO_NICHE: Record<string, string> = {
  finance: "business", investing: "business", crypto: "business", business_ideas: "business",
  startups: "business", marketing: "business", smm: "business", target_ads: "business",
  sales: "business", online_business: "business", freelance: "business", career: "business",
  cosmetology: "beauty", skincare: "beauty", makeup: "beauty", haircare: "beauty",
  hairstyles: "beauty", barbershop: "beauty", manicure: "beauty", pedicure: "beauty",
  laser_epilation: "beauty", plastic_surgery: "beauty", beauty_hacks: "beauty",
  clothing: "fashion", women_clothing: "fashion", men_clothing: "fashion", kids_clothing: "fashion",
  shoes: "fashion", bags: "fashion", accessories: "fashion", streetwear: "fashion",
  luxury_fashion: "fashion", branded_clothing: "fashion", shopping: "fashion",
  recipes: "food", quick_recipes: "food", home_cooking: "food", national_cuisine: "food",
  fastfood: "food", restaurants: "food", restaurant_reviews: "food", cafes: "food",
  street_food: "food", food_delivery: "food", cooking_hacks: "food", desserts: "food", baking: "food",
  fitness_general: "fitness", home_workouts: "fitness", gym: "fitness", weight_loss: "fitness",
  muscle_gain: "fitness", yoga: "fitness", pilates: "fitness", healthy_lifestyle: "fitness",
  diet: "fitness", sports_nutrition: "fitness",
  auto_reviews: "auto", chinese_auto: "auto", tuning: "auto", auto_hacks: "auto",
  auto_repair: "auto", auto_news: "auto", car_dealership: "auto", electric_vehicles: "auto",
  renovation: "home", interior: "home", home_design: "home", furniture: "home",
  cozy_home: "home", organization: "home", garden: "home",
  motherhood: "family", pregnancy: "family", newborns: "family", parenting: "family", family_life: "family",
  psychology_general: "psychology", relationships: "psychology", self_development: "psychology",
  motivation: "psychology", mental_health: "psychology",
  humor: "entertainment", sketches: "entertainment", memes: "entertainment",
  challenges: "entertainment", reactions: "entertainment",
  music: "media", cinema: "media", series: "media", pop_culture: "media", dance: "media",
  dogs: "animals", cats: "animals", pets: "animals", pet_care: "animals",
  travel_general: "travel", hotels: "travel", tourism: "travel", travel_hacks: "travel",
  neural_networks: "ai", ai_tools: "ai", ai_generation: "ai", ai_avatars: "ai", ai_video: "ai",
  crafts: "hobby", diy: "hobby", drawing: "hobby", photography: "hobby",
  esoteric: "other", tarot: "other", astrology: "other",
};

const BATCH_SIZE = 50;
const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    let offset = 0;
    let limit = 200;
    let onlyOther = false;
    let logId: string | null = null;
    try {
      const body = await req.json();
      if (typeof body?.offset === "number") offset = body.offset;
      if (typeof body?.limit === "number") limit = body.limit;
      if (body?.only_other === true) onlyOther = true;
      if (body?.log_id) logId = body.log_id;
    } catch {}

    // Count total videos for progress tracking
    let totalVideos = 0;
    if (!logId) {
      // First call — create log entry
      let countQuery = adminClient.from("videos").select("id", { count: "exact", head: true });
      if (onlyOther) countQuery = countQuery.eq("niche", "other");
      const { count } = await countQuery;
      totalVideos = count || 0;

      const { data: logData, error: logErr } = await adminClient.from("recat_logs").insert({
        status: "running",
        total_videos: totalVideos,
        current_offset: 0,
      }).select("id").single();

      if (logErr) console.error("Failed to create log:", logErr.message);
      else logId = logData.id;
    }

    // Check if stopped
    if (logId) {
      const { data: currentLog } = await adminClient.from("recat_logs").select("status").eq("id", logId).single();
      if (currentLog && currentLog.status !== "running") {
        console.log(`Recategorization ${logId} was stopped. Aborting.`);
        return new Response(JSON.stringify({ stopped: true, logId }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch videos
    let q = adminClient
      .from("videos")
      .select("id, caption, niche, categories, author_username")
      .order("created_at", { ascending: true });

    if (onlyOther) q = q.eq("niche", "other");

    const { data: videos, error: fetchErr } = await q.range(offset, offset + limit - 1);

    if (fetchErr) throw new Error(`Fetch error: ${fetchErr.message}`);
    if (!videos || videos.length === 0) {
      // Done — mark log as done
      if (logId) {
        await adminClient.from("recat_logs").update({
          status: "done",
          finished_at: new Date().toISOString(),
          current_offset: offset,
        }).eq("id", logId);
      }
      return new Response(JSON.stringify({ done: true, message: "No more videos", offset, logId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${videos.length} videos from offset ${offset}`);

    let updated = 0;
    let unchanged = 0;

    for (let i = 0; i < videos.length; i += BATCH_SIZE) {
      // Check stop signal every batch
      if (logId) {
        const { data: check } = await adminClient.from("recat_logs").select("status").eq("id", logId).single();
        if (check && check.status !== "running") {
          console.log(`Stopped mid-batch at offset ${offset}, batch ${i}`);
          return new Response(JSON.stringify({ stopped: true, offset, processed: i, updated, unchanged, logId }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const batch = videos.slice(i, i + BATCH_SIZE);

      const videoList = batch.map((v, idx) => {
        const caption = (v.caption || "").slice(0, 200);
        return `${idx}|${v.niche || "unknown"}|${caption}`;
      }).join("\n");

      const res = await fetch(AI_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: `You categorize TikTok videos. Available categories: ${ACTIVE_CATEGORIES.join(", ")}.
For each video (given as index|current_niche|caption), return ALL matching categories (1-3 max).
The primary niche should always be included.
Return ONLY a JSON array: [[idx, ["cat1","cat2"]], ...]
No explanation, no markdown, just JSON.`
            },
            { role: "user", content: videoList }
          ],
        }),
      });

      const aiData = await res.json();
      const content = aiData?.choices?.[0]?.message?.content || "";
      const match = content.match(/\[[\s\S]*\]/);

      if (!match) {
        console.error(`AI returned no valid JSON for batch at ${i}`);
        continue;
      }

      try {
        const results: [number, string[]][] = JSON.parse(match[0]);

        for (const [idx, cats] of results) {
          const video = batch[idx];
          if (!video) continue;

          const validCats = cats.filter(c => ACTIVE_CATEGORIES.includes(c));
          if (video.niche && !validCats.includes(video.niche)) {
            validCats.unshift(video.niche);
          }
          if (validCats.length === 0) continue;

          const currentCats = video.categories || [];
          const sortedNew = [...validCats].sort();
          const sortedOld = [...currentCats].sort();

          if (JSON.stringify(sortedNew) === JSON.stringify(sortedOld)) {
            unchanged++;
            continue;
          }

          const updateData: any = { categories: validCats };
          if (!video.niche || video.niche === 'other' || !ACTIVE_CATEGORIES.includes(video.niche)) {
            updateData.niche = validCats[0];
          }

          const { error: upErr } = await adminClient
            .from("videos")
            .update(updateData)
            .eq("id", video.id);

          if (upErr) {
            console.error(`Update error for ${video.id}: ${upErr.message}`);
          } else {
            updated++;
          }
        }
      } catch (e) {
        console.error(`Parse error for batch at ${i}:`, e.message);
      }

      // Update progress in log after each batch
      if (logId) {
        await adminClient.from("recat_logs").update({
          current_offset: offset + i + batch.length,
          total_processed: offset + i + batch.length,
          total_updated: updated,
          total_unchanged: unchanged,
        }).eq("id", logId);
      }
    }

    const hasMore = videos.length === limit;
    console.log(`Done: ${updated} updated, ${unchanged} unchanged, hasMore=${hasMore}`);

    // Update log
    if (logId) {
      const updatePayload: any = {
        current_offset: offset + videos.length,
        total_processed: offset + videos.length,
        total_updated: updated,
        total_unchanged: unchanged,
      };
      if (!hasMore) {
        updatePayload.status = "done";
        updatePayload.finished_at = new Date().toISOString();
      }
      await adminClient.from("recat_logs").update(updatePayload).eq("id", logId);
    }

    // Self-chain if more videos
    if (hasMore) {
      const nextOffset = offset + limit;
      console.log(`Chaining to offset ${nextOffset}...`);
      try {
        await fetch(`${supabaseUrl}/functions/v1/recategorize-videos`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ offset: nextOffset, limit, only_other: onlyOther, log_id: logId }),
        });
      } catch (e) {
        console.error("Chain failed:", e);
      }
    }

    return new Response(JSON.stringify({
      success: true, offset, processed: videos.length, updated, unchanged, hasMore, logId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Recategorize error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
