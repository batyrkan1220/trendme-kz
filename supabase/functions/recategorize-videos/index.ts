import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Load niche keys
    const { data: nicheSettingsRow } = await adminClient
      .from("trend_settings")
      .select("value")
      .eq("key", "niche_queries")
      .single();
    const NICHE_QUERIES: Record<string, string[]> = nicheSettingsRow?.value as any || {};
    const NICHE_KEYS = Object.keys(NICHE_QUERIES).concat(["other"]);

    // Get ALL unique original videos (exclude duplicates)
    const { data: allVideos, error } = await adminClient
      .from("videos")
      .select("*")
      .not("platform_video_id", "like", "%\\_%")
      .order("trend_score", { ascending: false })
      .limit(1000);

    if (error) throw error;
    if (!allVideos || allVideos.length === 0) {
      return new Response(JSON.stringify({ message: "No videos to recategorize" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Recategorizing ${allVideos.length} videos...`);
    let processed = 0;
    let duplicatesCreated = 0;

    // Process in batches of 30
    for (let i = 0; i < allVideos.length; i += 30) {
      const batch = allVideos.slice(i, i + 30);
      const captions = batch.map((v: any, idx: number) => 
        `${idx}: ${(v.caption || "").slice(0, 150)}`
      ).join("\n");

      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { 
              role: "system", 
              content: `Classify each video into 1-3 matching categories from: ${NICHE_KEYS.join(", ")}. A video can belong to multiple categories if it truly fits. Return ONLY JSON: {"0":["food","lifestyle"],"1":["humor"],...}` 
            },
            { role: "user", content: captions }
          ],
        }),
      });

      const aiData = await res.json();
      const content = aiData?.choices?.[0]?.message?.content || "";
      const match = content.match(/\{[\s\S]*?\}/);
      
      if (match) {
        const mapping = JSON.parse(match[0]);
        for (const [idx, categories] of Object.entries(mapping)) {
          const video = batch[Number(idx)];
          if (!video) continue;

          const cats: string[] = Array.isArray(categories) ? categories : [categories as string];
          const validCats = cats.filter(c => NICHE_KEYS.includes(c) && c !== "other");
          
          if (validCats.length === 0) continue;

          // Update original with first category
          await adminClient.from("videos").update({ niche: validCats[0] }).eq("id", video.id);

          // Create copies for additional categories
          for (let ci = 1; ci < validCats.length; ci++) {
            const dupId = `${video.platform_video_id}_${validCats[ci]}`;
            const { id, created_at, ...rest } = video;
            await adminClient.from("videos").upsert({
              ...rest,
              platform_video_id: dupId,
              niche: validCats[ci],
            }, { onConflict: "platform_video_id" });
            duplicatesCreated++;
          }
          processed++;
        }
      }
      console.log(`Batch ${Math.floor(i/30)+1}: processed ${Math.min(i+30, allVideos.length)}/${allVideos.length}`);
    }

    // Get final stats
    const { data: finalStats } = await adminClient
      .from("videos")
      .select("niche");
    const finalMap: Record<string, number> = {};
    for (const v of finalStats || []) {
      const n = v.niche || "uncategorized";
      finalMap[n] = (finalMap[n] || 0) + 1;
    }

    const result = {
      success: true,
      processed,
      duplicatesCreated,
      totalVideosNow: finalStats?.length || 0,
      categories: Object.entries(finalMap).sort(([,a],[,b]) => b - a),
    };
    console.log("Recategorization complete:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Recategorize error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
