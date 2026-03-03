import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    if (!authHeader) throw new Error("Unauthorized");

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Forbidden");

    const body = await req.json();
    const { niche, existing_queries, seed_word, bulk, target_niches } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // === BULK MODE: regenerate niches ===
    if (bulk) {
      const { data: nicheRow } = await adminClient
        .from("trend_settings")
        .select("value")
        .eq("key", "niche_queries")
        .single();
      const currentNiches: Record<string, string[]> = (nicheRow?.value as any) || {};
      
      // If target_niches provided, only regenerate those; otherwise all
      const nicheKeys = target_niches && Array.isArray(target_niches) && target_niches.length > 0
        ? target_niches.filter((n: string) => n in currentNiches || true)
        : Object.keys(currentNiches);
      
      const updatedNiches: Record<string, string[]> = {};

      // Process in batches of 5 niches per AI call
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
                content: `Ты эксперт по TikTok трендам и вирусному контенту. Для каждой ниши сгенерируй 30-40 САМЫХ ПОПУЛЯРНЫХ поисковых запросов, которые дают МАКСИМУМ результатов на TikTok.

ГЛАВНАЯ ЦЕЛЬ: Каждый запрос должен возвращать ТЫСЯЧИ видео. Используй только самые массовые, популярные, часто используемые слова и хештеги.

ПРАВИЛА:
- Используй ГЛОБАЛЬНО популярные запросы которые дают много результатов
- Комбинируй языки: казахский, русский И английский — главное чтобы было МНОГО результатов
- Включай ТОП хештеги с миллионами просмотров: #fyp #viral #trending #foryou #тренд #хит
- Используй КОРОТКИЕ популярные запросы (1-3 слова) — они дают больше результатов
- Включай самые вирусные хештеги каждой ниши на ВСЕХ языках
- НЕ используй узкие/специфические запросы которые дают мало результатов
- НЕ используй длинные фразы с названиями городов — они слишком узкие
- Фокус на ОБЪЁМ результатов, а не на локальность
- Включай английские тренды: они дают в 10-100 раз больше видео
- Примеры хороших запросов: "makeup tutorial", "бьюти хак", "#beauty", "#skincare", "рецепт", "#cooking"
- Примеры ПЛОХИХ запросов: "макияж алматы 2026", "рецепт бешбармак караганда" — слишком узкие!

Верни ТОЛЬКО JSON объект: {"niche1":["запрос1","запрос2",...],...}`
              },
              {
                role: "user",
                content: `Сгенерируй ТОП поисковые запросы (сегодня ${new Date().toLocaleDateString("ru")}) для этих ниш: ${nicheDescriptions}. Нужны ТОЛЬКО самые массовые запросы которые дают МАКСИМУМ видео! Короткие, вирусные, глобальные + казахские/русские. 30-40 запросов на нишу.`
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
              if (Array.isArray(v)) updatedNiches[k] = v as string[];
            }
          } catch (e) {
            console.error(`Failed to parse AI response for batch ${i}:`, e);
          }
        }
      }

      // Merge: for targeted niches, replace only those; keep others unchanged
      const finalNiches: Record<string, string[]> = { ...currentNiches };
      for (const k of nicheKeys) {
        if (updatedNiches[k] && updatedNiches[k].length > 0) {
          finalNiches[k] = updatedNiches[k];
        }
      }

      await adminClient
        .from("trend_settings")
        .update({ value: finalNiches, updated_at: new Date().toISOString(), updated_by: user.id })
        .eq("key", "niche_queries");

      const stats: Record<string, number> = {};
      for (const k of nicheKeys) stats[k] = (finalNiches[k] || []).length;

      return new Response(JSON.stringify({ success: true, stats, regenerated: nicheKeys }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === SINGLE NICHE MODE ===
    if (!niche) throw new Error("niche is required");

    const existingList = (existing_queries || []).join(", ");

    const userPrompt = seed_word
      ? `Ниша: "${niche}"
Ключевое слово: "${seed_word}"
Существующие запросы: [${existingList}]

На основе ключевого слова "${seed_word}" сгенерируй 15-25 связанных поисковых запросов и хэштегов для TikTok. Включи вариации этого слова, связанные темы, популярные хэштеги с этим словом, фразы на казахском и русском. НЕ используй английский язык.`
      : `Ниша: "${niche}"
Существующие запросы: [${existingList}]

Сгенерируй 10-15 новых уникальных поисковых запросов и хэштегов для этой ниши. Только на казахском и русском языках!`;

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
            content: `Ты — эксперт по TikTok трендам в Казахстане и СНГ. Генерируй поисковые запросы и хэштеги для поиска трендовых видео на TikTok.

Правила:
- Генерируй ТОЛЬКО на русском и казахском языках
- НЕ используй английский язык
- Включай хэштеги (с #) и текстовые запросы
- Фокусируйся на KZ/RU контент
- Включай города Казахстана, местные тренды
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
