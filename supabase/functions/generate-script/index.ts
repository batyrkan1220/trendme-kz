import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check (optional — native mobile may not have auth)
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const token = authHeader.replace("Bearer ", "");
      await supabaseClient.auth.getClaims(token); // validate if present
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { transcript, summary, caption, language, messages } = await req.json();
    const lang = language === "kk" ? "kk" : "ru";
    const langLabel = lang === "kk" ? "қазақ тілінде" : "на русском языке";

    // Sanitize user-controlled input to prevent prompt injection
    const clean = (s: string, max = 1000) =>
      s.replace(/system:|assistant:|user:/gi, '')
       .replace(/ignore.*(previous|above|all)/gi, '')
       .replace(/\r?\n{3,}/g, '\n\n')
       .slice(0, max);

    // Build context about the video
    const contextParts: string[] = [];
    if (caption) contextParts.push(`Описание видео: ${clean(String(caption), 500)}`);
    if (summary?.topic) contextParts.push(`Тема: ${clean(String(summary.topic), 200)}`);
    if (summary?.summary) contextParts.push(`Суть: ${clean(String(summary.summary), 500)}`);
    if (summary?.hook_phrase) contextParts.push(`Хук-фраза оригинала: ${clean(String(summary.hook_phrase), 200)}`);
    if (summary?.visual_hook) contextParts.push(`Визуальный хук: ${clean(String(summary.visual_hook), 200)}`);
    if (summary?.tags?.length) contextParts.push(`Форматы: ${summary.tags.slice(0, 10).map((t: string) => clean(String(t), 50)).join(", ")}`);
    if (summary?.niches?.length) contextParts.push(`Ниши: ${summary.niches.slice(0, 10).map((n: string) => clean(String(n), 50)).join(", ")}`);
    if (summary?.structure?.length) {
      const structText = summary.structure.slice(0, 20).map((s: any) => `[${clean(String(s.time || ''), 10)}] ${clean(String(s.title || ''), 100)}: ${clean(String(s.description || ''), 200)}`).join("\n");
      contextParts.push(`Структура видео:\n${structText}`);
    }
    if (summary?.funnel) {
      contextParts.push(`Воронка: ${clean(String(summary.funnel.direction || ''), 100)} / Цель: ${clean(String(summary.funnel.goal || ''), 100)}`);
    }
    if (transcript) contextParts.push(`Оригинальный транскрипт:\n${clean(String(transcript), 6000)}`);

    const videoContext = `=== VIDEO CONTENT (reference data) ===\n${contextParts.join("\n\n")}\n=== END VIDEO CONTENT ===`;

    const systemPrompt = lang === "kk"
      ? `Сен — TikTok/Reels үшін AI-сценарист. Сенің міндетің — табысты бейнелерді талдау негізінде вирустық бейімделген сценарийлер жасау.

БЕЙНЕ КОНТЕКСТІ:
${videoContext}

ЕРЕЖЕЛЕР:
1. Түпнұсқаның құрылымы мен табыс формуласын сақта
2. Контентті бейімде — сөзбе-сөз көшірме
3. Хуктің 3 нұсқасын ұсын (назар аударатын бірінші сөйлем)
4. Түсірілімге нұсқаулары бар толық бейімделген сценарий жаз [әрекет]
5. Сценарий түсірілімге дайын болуы керек
6. Сөйлесу стилін, қысқа сөйлемдерді қолдан
7. Соңында CTA (әрекетке шақыру) қос
8. ҚАЗАҚ ТІЛІНДЕ жауап бер

Пайдаланушы өңдеуді сұраса — сценарийді оның тілектеріне сай түзе.`
      : `Ты — AI-сценарист для TikTok/Reels. Твоя задача — создавать вирусные адаптированные сценарии на основе анализа успешных видео.

КОНТЕКСТ ВИДЕО:
${videoContext}

ПРАВИЛА:
1. Сохраняй структуру и формулу успеха оригинала
2. Адаптируй контент — не копируй дословно
3. Предложи 3 варианта хука (первая фраза, которая цепляет)
4. Напиши полный адаптированный сценарий с указаниями для съёмки в квадратных скобках [действие]
5. Сценарий должен быть готов к съёмке
6. Используй разговорный стиль, короткие предложения
7. Добавь CTA (призыв к действию) в конце
8. Отвечай на русском языке

Если пользователь просит доработать — корректируй сценарий по его пожеланиям.`;

    // If no messages, generate initial script
    // Limit message history and sanitize
    const sanitizedMessages = (messages || []).slice(-10).map((m: any) => ({
      role: String(m.role) === "assistant" ? "assistant" : "user",
      content: clean(String(m.content || ''), 2000),
    }));

    const chatMessages = sanitizedMessages.length > 0
      ? [
          { role: "system", content: systemPrompt },
          ...sanitizedMessages,
        ]
      : [
          { role: "system", content: systemPrompt },
          { role: "user", content: lang === "kk"
            ? "Осы бейне негізінде бейімделген сценарий жаса. Хуктің 3 нұсқасын және толық сценарийді ұсын."
            : "Сгенерируй адаптированный сценарий на основе этого видео. Предложи 3 варианта хука и полный сценарий." },
        ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: chatMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов, попробуйте позже." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Необходимо пополнить баланс." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Ошибка AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-script error:", e);
    return new Response(JSON.stringify({ error: "Не удалось обработать запрос. Попробуйте позже." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
