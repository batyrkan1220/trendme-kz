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

    const { niche, existing_queries, seed_word } = await req.json();
    if (!niche) throw new Error("niche is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const existingList = (existing_queries || []).join(", ");

    // If seed_word provided, generate based on that word
    const userPrompt = seed_word
      ? `Ниша: "${niche}"
Ключевое слово: "${seed_word}"
Существующие запросы: [${existingList}]

На основе ключевого слова "${seed_word}" сгенерируй 15-25 связанных поисковых запросов и хэштегов для TikTok. Включи вариации этого слова, связанные темы, популярные хэштеги с этим словом, фразы на казахском и русском.`
      : `Ниша: "${niche}"
Существующие запросы: [${existingList}]

Сгенерируй 10-15 новых уникальных поисковых запросов и хэштегов для этой ниши.`;

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
- Генерируй на русском и казахском языках
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
