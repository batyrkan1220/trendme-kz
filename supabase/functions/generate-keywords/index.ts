import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type LangQueries = { kk: string[]; ru: string[]; en: string[] };

function getLangQueries(val: any): LangQueries {
  if (!val) return { kk: [], ru: [], en: [] };
  if (Array.isArray(val)) return { kk: [], ru: val, en: [] };
  return { kk: val.kk || [], ru: val.ru || [], en: val.en || [] };
}

const LANG_PROMPTS: Record<string, { system: string; langRule: string }> = {
  kk: {
    system: "Сен TikTok трендтері бойынша сарапшысыңз. Қазақстандағы қазақ тілді контент бойынша маман.",
    langRule: "ТІКЕЛЕЙ ҚАЗАҚ тілінде ғана жаз. Орыс, ағылшын сөздерін ҚОЛДАНБА. Қазақстандағы қазақ тілді TikTok контентін тап.",
  },
  ru: {
    system: "Ты эксперт по TikTok трендам в Казахстане и СНГ.",
    langRule: "Генерируй ТОЛЬКО на русском языке. НЕ используй казахский или английский язык. Фокусируйся на KZ/RU контент.",
  },
  en: {
    system: "You are a TikTok trends expert focused on global viral content.",
    langRule: "Generate ONLY in English. Do NOT use Russian or Kazakh. Focus on globally trending keywords and hashtags that return maximum video results.",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    // Auth is optional for native mobile
    if (authHeader) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      // validate but don't block if missing
      await userClient.auth.getUser().catch(() => {});
    }

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Forbidden");

    const body = await req.json();
    const { niche, existing_queries, seed_word, bulk, target_niches, lang } = body;
    const activeLang: "kk" | "ru" | "en" = lang || "ru";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // === BULK MODE: regenerate niches ===
    if (bulk) {
      const { data: nicheRow } = await adminClient
        .from("trend_settings")
        .select("value")
        .eq("key", "niche_queries")
        .single();
      const currentNiches: Record<string, any> = (nicheRow?.value as any) || {};
      
      const nicheKeys = target_niches && Array.isArray(target_niches) && target_niches.length > 0
        ? target_niches.filter((n: string) => n in currentNiches || true)
        : Object.keys(currentNiches);
      
      const updatedNiches: Record<string, Record<string, string[]>> = {};

      // Process each language separately
      for (const langKey of ["kk", "ru", "en"] as const) {
        const langPrompt = LANG_PROMPTS[langKey];
        
        for (let i = 0; i < nicheKeys.length; i += 5) {
          const batch = nicheKeys.slice(i, i + 5);
          const nicheDescriptions = batch.map((n: string) => `"${n}"`).join(", ");

          const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content: `${langPrompt.system} Для каждой ниши сгенерируй 10-15 САМЫХ ПОПУЛЯРНЫХ поисковых запросов.

ПРАВИЛА:
- ${langPrompt.langRule}
- Используй ГЛОБАЛЬНО популярные запросы которые дают много результатов
- Включай ТОП хештеги с миллионами просмотров
- Используй КОРОТКИЕ популярные запросы (1-3 слова)
- НЕ используй узкие/специфические запросы
- Верни ТОЛЬКО JSON объект: {"niche1":["запрос1","запрос2",...],...}`
                },
                {
                  role: "user",
                  content: `Сгенерируй ТОП поисковые запросы для этих ниш: ${nicheDescriptions}. 10-15 запросов на нишу.`
                }
              ],
            }),
          });
          const aiData = await res.json();
          const content = aiData?.choices?.[0]?.message?.content || "";
          const match = content.match(/\{[\s\S]*\}/);
          if (match) {
            try {
              const parsed = JSON.parse(match[0]);
              for (const [k, v] of Object.entries(parsed)) {
                if (Array.isArray(v)) {
                  if (!updatedNiches[k]) updatedNiches[k] = { kk: [], ru: [], en: [] };
                  updatedNiches[k][langKey] = v as string[];
                }
              }
            } catch (e) {
              console.error(`Failed to parse AI response for batch ${i} lang ${langKey}:`, e);
            }
          }
        }
      }

      // Merge: for targeted niches, replace only those; keep others unchanged
      const finalNiches: Record<string, LangQueries> = {};
      for (const [k, v] of Object.entries(currentNiches)) {
        finalNiches[k] = getLangQueries(v);
      }
      for (const k of nicheKeys) {
        if (updatedNiches[k]) {
          finalNiches[k] = {
            kk: updatedNiches[k].kk?.length > 0 ? updatedNiches[k].kk : (finalNiches[k]?.kk || []),
            ru: updatedNiches[k].ru?.length > 0 ? updatedNiches[k].ru : (finalNiches[k]?.ru || []),
            en: updatedNiches[k].en?.length > 0 ? updatedNiches[k].en : (finalNiches[k]?.en || []),
          };
        }
      }

      await adminClient
        .from("trend_settings")
        .update({ value: finalNiches, updated_at: new Date().toISOString(), updated_by: user.id })
        .eq("key", "niche_queries");

      const stats: Record<string, number> = {};
      for (const k of nicheKeys) {
        const q = finalNiches[k] || { kk: [], ru: [], en: [] };
        stats[k] = q.kk.length + q.ru.length + q.en.length;
      }

      return new Response(JSON.stringify({ success: true, stats, regenerated: nicheKeys }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === SINGLE NICHE MODE ===
    if (!niche) throw new Error("niche is required");

    // Sanitize user input
    const clean = (s: string, max = 200) =>
      s.replace(/system:|assistant:|user:/gi, '')
       .replace(/ignore.*(previous|above|all)/gi, '')
       .slice(0, max);

    const safeNiche = clean(String(niche), 100);
    const safeSeedWord = seed_word ? clean(String(seed_word), 100) : null;

    const langPrompt = LANG_PROMPTS[activeLang] || LANG_PROMPTS.ru;
    const existingList = (existing_queries || []).slice(0, 50).map((q: string) => clean(String(q), 80)).join(", ");

    const userPrompt = safeSeedWord
      ? `Ниша: "${safeNiche}"
Ключевое слово: "${safeSeedWord}"
Существующие запросы: [${existingList}]

На основе ключевого слова "${safeSeedWord}" сгенерируй 15-25 связанных поисковых запросов и хэштегов для TikTok.
${langPrompt.langRule}`
      : `Ниша: "${safeNiche}"
Существующие запросы: [${existingList}]

Сгенерируй 10-15 новых уникальных поисковых запросов и хэштегов для этой ниши.
${langPrompt.langRule}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `${langPrompt.system} Генерируй поисковые запросы и хэштеги для поиска трендовых видео на TikTok.

Правила:
- ${langPrompt.langRule}
- Включай хэштеги (с #) и текстовые запросы
- НЕ повторяй существующие запросы
- Верни ТОЛЬКО JSON массив строк, без пояснений
- ${seed_word ? "Генерируй 15-25 запросов, все связанных с указанным ключевым словом" : "Генерируй 10-15 новых запросов"}`,
          },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_keywords",
              description: "Return generated keywords as a structured list",
              parameters: {
                type: "object",
                properties: {
                  keywords: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of generated search queries and hashtags",
                  },
                },
                required: ["keywords"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_keywords" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов, попробуйте позже" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Недостаточно кредитов AI" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    let keywords: string[] = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        keywords = parsed.keywords || [];
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }

    const existingSet = new Set((existing_queries || []).map((q: string) => q.toLowerCase().trim()));
    keywords = keywords.filter((k) => !existingSet.has(k.toLowerCase().trim()));

    return new Response(JSON.stringify({ keywords }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-keywords error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
