import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Detect language of a keyword
function detectLang(text: string): "kk" | "ru" | "en" {
  // Kazakh-specific characters
  if (/[әіңғүұқөһӘІҢҒҮҰҚӨҺ]/u.test(text)) return "kk";
  // Cyrillic = Russian
  if (/[а-яА-ЯёЁ]/u.test(text)) return "ru";
  // Default to English
  return "en";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: row } = await adminClient
    .from("trend_settings")
    .select("value")
    .eq("key", "niche_queries")
    .single();

  const oldQueries: Record<string, any> = (row?.value as any) || {};
  const newQueries: Record<string, { kk: string[]; ru: string[]; en: string[] }> = {};

  let totalMigrated = 0;

  for (const [key, value] of Object.entries(oldQueries)) {
    // If already in new format, keep as-is
    if (value && typeof value === "object" && !Array.isArray(value) && ("kk" in value || "ru" in value || "en" in value)) {
      newQueries[key] = {
        kk: (value as any).kk || [],
        ru: (value as any).ru || [],
        en: (value as any).en || [],
      };
      continue;
    }

    // Old format: flat array
    if (Array.isArray(value)) {
      const kk: string[] = [];
      const ru: string[] = [];
      const en: string[] = [];

      for (const q of value) {
        const lang = detectLang(String(q));
        if (lang === "kk") kk.push(q);
        else if (lang === "en") en.push(q);
        else ru.push(q);
      }

      newQueries[key] = { kk, ru, en };
      totalMigrated++;
    }
  }

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

  // Sample stats
  const stats: Record<string, { kk: number; ru: number; en: number }> = {};
  for (const [key, val] of Object.entries(newQueries)) {
    stats[key] = { kk: val.kk.length, ru: val.ru.length, en: val.en.length };
  }

  return new Response(JSON.stringify({
    success: true,
    totalSubNiches: Object.keys(newQueries).length,
    totalMigrated,
    stats,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
