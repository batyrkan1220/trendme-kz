import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ========== New niche/sub-niche system (synced with niches.ts) ==========
const NICHE_GROUPS: Record<string, string[]> = {
  business: ["finance", "crypto", "business_ideas", "marketing", "freelance", "ecommerce"],
  beauty: ["skincare", "makeup", "haircare", "manicure", "cosmetology", "perfume"],
  fashion: ["clothing", "shoes", "accessories", "luxury_fashion", "jewelry", "shopping"],
  food: ["recipes", "home_cooking", "restaurants", "street_food", "desserts", "coffee_tea"],
  fitness: ["home_workouts", "gym", "weight_loss", "yoga", "healthy_lifestyle", "sports_nutrition"],
  sports: ["football", "mma_boxing", "basketball", "sports_news", "extreme_sports"],
  education: ["languages", "english", "school_ent", "online_courses", "books"],
  gaming: ["mobile_games", "pc_games", "game_reviews", "streaming", "esports"],
  tech: ["programming", "gadgets", "tech_reviews", "apps"],
  auto: ["auto_reviews", "chinese_auto", "tuning", "auto_repair", "electric_vehicles", "moto"],
  home: ["renovation", "interior", "furniture", "organization", "garden"],
  family: ["motherhood", "pregnancy", "parenting", "family_life", "wedding"],
  psychology: ["relationships", "self_development", "motivation", "mental_health", "productivity"],
  entertainment: ["humor", "memes", "challenges", "asmr"],
  media: ["music", "cinema", "dance", "anime"],
  animals: ["pets", "pet_care"],
  travel: ["travel_general", "hotels", "kazakhstan_travel"],
  ai: ["neural_networks", "ai_tools", "ai_generation", "chatgpt"],
  hobby: ["crafts", "drawing", "photography"],
  medicine: ["doctors", "dentistry", "pharmacy", "nutrition_health"],
  realestate: ["apartments", "mortgage", "new_buildings", "construction"],
  blogging: ["content_creation", "video_editing", "promotion", "monetization", "personal_brand"],
  kazakh_culture: ["kazakh_cuisine", "kazakh_history", "kazakh_traditions", "kazakh_language", "kazakh_music", "kazakh_celebrities"],
};

// Build reverse map: sub_niche → niche
const SUB_NICHE_TO_NICHE: Record<string, string> = {};
const ALL_SUB_NICHES: string[] = [];
for (const [niche, subs] of Object.entries(NICHE_GROUPS)) {
  for (const sub of subs) {
    SUB_NICHE_TO_NICHE[sub] = niche;
    ALL_SUB_NICHES.push(sub);
  }
}

const MAIN_NICHES = Object.keys(NICHE_GROUPS);

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
    let logId: string | null = null;
    try {
      const body = await req.json();
      if (typeof body?.offset === "number") offset = body.offset;
      if (typeof body?.limit === "number") limit = body.limit;
      if (body?.log_id) logId = body.log_id;
    } catch {}

    // Count total videos for progress tracking
    let totalVideos = 0;
    if (!logId) {
      const { count } = await adminClient.from("videos").select("id", { count: "exact", head: true });
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
    const { data: videos, error: fetchErr } = await adminClient
      .from("videos")
      .select("id, caption, niche, sub_niche, lang, author_username")
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (fetchErr) throw new Error(`Fetch error: ${fetchErr.message}`);
    if (!videos || videos.length === 0) {
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

      const nicheList = MAIN_NICHES.map(n => `${n}: ${NICHE_GROUPS[n].join(", ")}`).join("\n");

      const res = await fetch(AI_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: `You categorize TikTok videos into niches and sub-niches.

Available niches and their sub-niches:
${nicheList}

For each video (given as index|current_niche|caption):
1. Determine the BEST matching sub_niche (exactly 1)
2. Detect caption language precisely:
   - "kk" = Kazakh (MUST contain Kazakh-specific letters: ә,ғ,қ,ң,ө,ұ,ү,і,һ)
   - "ru" = Russian OR Ukrainian (standard Cyrillic without Kazakh-specific letters). Ukrainian letters like є,і,ї,ґ also map to "ru".
   - "en" = English/Latin script
   IMPORTANT: Ukrainian (містить є,і,ї,ґ or Ukrainian words) must be classified as "ru", NOT "kk". Only Kazakh with specific letters ә,ғ,қ,ң,ө,ұ,ү,һ should be "kk".

Return ONLY a JSON array: [[idx, "sub_niche_key", "lang"], ...]
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
        const results: (number | string)[][] = JSON.parse(match[0]);

        for (const result of results) {
          const idx = result[0] as number;
          const subNiche = result[1] as string;
          const video = batch[idx];
          if (!video) continue;

          // Validate sub-niche
          const mainNiche = SUB_NICHE_TO_NICHE[subNiche];
          if (!mainNiche) {
            unchanged++;
            continue;
          }

          // Check if already correct (niche, sub_niche AND lang)
          const resolvedLang = (lang && ["kk", "ru", "en"].includes(lang)) ? lang : null;
          if ((video as any).sub_niche === subNiche && video.niche === mainNiche && (video as any).lang === resolvedLang) {
            unchanged++;
            continue;
          }

          let lang = (result[2] as string) || null;
          // Map Ukrainian to Russian
          if (lang === "uk") lang = "ru";

          const updateData: any = {
            niche: mainNiche,
            sub_niche: subNiche,
            categories: [mainNiche],
            ...(lang && ["kk", "ru", "en"].includes(lang) ? { lang } : {}),
          };

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
        console.error(`Parse error for batch at ${i}:`, (e as any).message);
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
          body: JSON.stringify({ offset: nextOffset, limit, log_id: logId }),
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
