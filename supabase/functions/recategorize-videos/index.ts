import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ACTIVE_CATEGORIES = [
  "animals", "art", "auto", "beauty", "books", "business", "cinema", "comedy",
  "dance", "diy", "education", "entertainment", "family", "fashion", "fitness",
  "food", "gaming", "lifestyle", "marketing", "medicine", "music", "news",
  "podcast", "psychology", "realestate", "religion", "shopping", "sports",
  "tech", "travel"
];

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
