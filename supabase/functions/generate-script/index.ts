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
      ? `Сен — TikTok/Reels үшін топ AI-сценарист. Мақсатың — оқырманды бірден тартып алатын, қызықты, түсірілімге дайын сценарий жасау.

БЕЙНЕ КОНТЕКСТІ:
${videoContext}

ШЫҒАРУ ФОРМАТЫ (дәл осылай жаз, ауытқыма!):

---

## 🪝 ХУК НҰСҚАЛАРЫ

Әрбір хук — бейненің **алғашқы 3 секунды**. Көрерменді тоқтату керек.

**1. 🔥 Провокация:**
> «...» ← нақты реплика

**2. 💡 Қызықтық:**
> «...» ← нақты реплика

**3. 😱 Шок:**
> «...» ← нақты реплика

---

## 🎬 ТОЛЫҚ СЦЕНАРИЙ

Сценарийді секунд бойынша бөл. Әр бөлімді осылай жаз:

**⏱ 0-3 сек — ХУК**

*[Камераға тіке қарап, жылдам сөйле]*

«Реплика мұнда»

**⏱ 3-10 сек — МӘСЕЛЕ / КОНТЕКСТ**

*[Қол қимылдарымен түсіндір]*

«Реплика мұнда»

**⏱ 10-25 сек — НЕГІЗГІ МАЗМҰН**

*[B-roll немесе экранды көрсет]*

«Реплика мұнда»

**⏱ 25-30 сек — CTA**

*[Камераға жақындап]*

«Реплика мұнда»

---

## 💡 ТҮСІРІЛІМ КЕҢЕСТЕРІ

- Жарықтандыру: ...
- Ракурс: ...
- Монтаж: ...

---

МАЗМҰН ЕРЕЖЕЛЕРІ:
1. Түпнұсқаның құрылымы мен вирустық формуласын сақта
2. Сценарийді бейімде — сөзбе-сөз көшірме ЕМЕС
3. Сөйлесу стилі, қысқа сөйлемдер, реплика ретінде жаз
4. Әр репликаны тырнақшаға «» ал
5. Түсірілім нұсқауларын *курсивпен* жаз
6. Бір абзацта 1-2 сөйлем ғана
7. ҚАЗАҚ ТІЛІНДЕ жауап бер

Пайдаланушы өңдеуді сұраса — сценарийді оның тілектеріне сай түзе.`
      : `Ты — топовый AI-сценарист для TikTok/Reels. Твоя цель — создать сценарий, который моментально цепляет, легко читается и готов к съёмке.

КОНТЕКСТ ВИДЕО:
${videoContext}

ФОРМАТ ВЫВОДА (пиши именно так, не отклоняйся!):

---

## 🪝 ВАРИАНТЫ ХУКА

Каждый хук — **первые 3 секунды** видео. Нужно остановить скролл.

**1. 🔥 Провокация:**
> «...» ← точная реплика

**2. 💡 Любопытство:**
> «...» ← точная реплика

**3. 😱 Шок:**
> «...» ← точная реплика

---

## 🎬 ПОЛНЫЙ СЦЕНАРИЙ

Разбей сценарий по секундам. Каждый блок пиши так:

**⏱ 0-3 сек — ХУК**

*[Смотришь прямо в камеру, говоришь быстро]*

«Реплика здесь»

**⏱ 3-10 сек — ПРОБЛЕМА / КОНТЕКСТ**

*[Жестикуляция, эмоция на лице]*

«Реплика здесь»

**⏱ 10-25 сек — ОСНОВНОЙ КОНТЕНТ**

*[B-roll или показ экрана]*

«Реплика здесь»

**⏱ 25-30 сек — CTA**

*[Приближаешься к камере]*

«Реплика здесь»

---

## 💡 СОВЕТЫ ПО СЪЁМКЕ

- Свет: ...
- Ракурс: ...
- Монтаж: ...

---

ПРАВИЛА КОНТЕНТА:
1. Сохраняй структуру и вирусную формулу оригинала
2. Адаптируй — НЕ копируй дословно
3. Разговорный стиль, короткие фразы, пиши как реплики
4. Каждую реплику бери в кавычки «»
5. Указания для съёмки пиши *курсивом*
6. Один абзац — 1-2 предложения максимум
7. Отвечай на русском языке

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
