import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const clean = (s: string, max = 1000) =>
  s.replace(/system:|assistant:|user:/gi, '')
   .replace(/ignore.*(previous|above|all)/gi, '')
   .replace(/\r?\n{3,}/g, '\n\n')
   .slice(0, max);

function buildVideoContext(summary: any, transcript: string, caption: string): string {
  const parts: string[] = [];
  if (caption) parts.push(`Описание видео: ${clean(String(caption), 500)}`);
  if (summary?.topic) parts.push(`Тема: ${clean(String(summary.topic), 200)}`);
  if (summary?.summary) parts.push(`Суть: ${clean(String(summary.summary), 500)}`);
  if (summary?.hook_phrase) parts.push(`Хук-фраза оригинала: ${clean(String(summary.hook_phrase), 200)}`);
  if (summary?.visual_hook) parts.push(`Визуальный хук: ${clean(String(summary.visual_hook), 200)}`);
  if (summary?.text_hook) parts.push(`Текстовый хук: ${clean(String(summary.text_hook), 200)}`);
  if (summary?.why_viral) parts.push(`Почему видео стало вирусным: ${clean(String(summary.why_viral), 500)}`);
  if (summary?.virality_score != null) parts.push(`Вирусность (1-10): ${summary.virality_score}`);
  if (summary?.target_audience) parts.push(`Целевая аудитория: ${clean(String(summary.target_audience), 300)}`);
  if (summary?.content_format) parts.push(`Формат контента: ${clean(String(summary.content_format), 100)}`);
  if (summary?.cta_analysis) parts.push(`CTA анализ: ${clean(String(summary.cta_analysis), 300)}`);
  if (summary?.emotions?.length) parts.push(`Эмоциональные триггеры: ${summary.emotions.slice(0, 10).map((e: string) => clean(String(e), 50)).join(", ")}`);
  if (summary?.strengths?.length) parts.push(`Сильные стороны: ${summary.strengths.slice(0, 5).map((s: string) => clean(String(s), 100)).join("; ")}`);
  if (summary?.weaknesses?.length) parts.push(`Слабые стороны: ${summary.weaknesses.slice(0, 5).map((w: string) => clean(String(w), 100)).join("; ")}`);
  if (summary?.recommendations?.length) parts.push(`Рекомендации: ${summary.recommendations.slice(0, 5).map((r: string) => clean(String(r), 100)).join("; ")}`);
  if (summary?.tags?.length) parts.push(`Форматы: ${summary.tags.slice(0, 10).map((t: string) => clean(String(t), 50)).join(", ")}`);
  if (summary?.niches?.length) parts.push(`Ниши: ${summary.niches.slice(0, 10).map((n: string) => clean(String(n), 50)).join(", ")}`);
  if (summary?.structure?.length) {
    const structText = summary.structure.slice(0, 20).map((s: any) => `[${clean(String(s.time || ''), 10)}] ${clean(String(s.title || ''), 100)}: ${clean(String(s.description || ''), 200)}`).join("\n");
    parts.push(`Структура видео:\n${structText}`);
  }
  if (summary?.funnel) {
    parts.push(`Воронка: ${clean(String(summary.funnel.direction || ''), 100)} / Цель: ${clean(String(summary.funnel.goal || ''), 100)}`);
  }
  if (transcript) parts.push(`Оригинальный транскрипт:\n${clean(String(transcript), 6000)}`);
  return `=== VIDEO CONTENT (reference data) ===\n${parts.join("\n\n")}\n=== END VIDEO CONTENT ===`;
}

function getDurationContext(summary: any): { durationSec: number; durationLabel: string; segmentGuide: string } {
  const dur = Number(summary?.duration_sec || summary?.stats?.duration || 0);
  if (dur <= 0) return { durationSec: 0, durationLabel: "30 секунд (по умолчанию)", segmentGuide: "0-3, 3-10, 10-25, 25-30" };
  
  if (dur <= 15) return { durationSec: dur, durationLabel: `${dur} секунд (короткое)`, segmentGuide: "0-2 ХУК, 2-5 СУТЬ, 5-12 КОНТЕНТ, 12-15 CTA" };
  if (dur <= 30) return { durationSec: dur, durationLabel: `${dur} секунд`, segmentGuide: "0-3 ХУК, 3-10 ПРОБЛЕМА, 10-25 КОНТЕНТ, 25-30 CTA" };
  if (dur <= 60) return { durationSec: dur, durationLabel: `${dur} секунд (1 минута)`, segmentGuide: "0-3 ХУК, 3-12 ПРОБЛЕМА/КОНТЕКСТ, 12-20 РАСКРЫТИЕ 1, 20-35 РАСКРЫТИЕ 2, 35-50 КУЛЬМИНАЦИЯ, 50-60 CTA/ВЫВОД" };
  if (dur <= 120) return { durationSec: dur, durationLabel: `${Math.round(dur / 60)} минуты`, segmentGuide: "0-3 ХУК, 3-15 ВСТУПЛЕНИЕ, 15-30 ПУНКТ 1, 30-50 ПУНКТ 2, 50-70 ПУНКТ 3, 70-90 КУЛЬМИНАЦИЯ, 90-110 ВЫВОД, 110-120 CTA" };
  return { durationSec: dur, durationLabel: `${Math.round(dur / 60)} минут (длинное)`, segmentGuide: "0-3 ХУК, 3-20 ВСТУПЛЕНИЕ, 20-60 АКТ 1 (несколько пунктов), 60-120 АКТ 2, 120-150 КУЛЬМИНАЦИЯ, 150-170 ВЫВОД, 170-180 CTA" };
}

function buildSystemPrompt(lang: "kk" | "ru", videoContext: string, durationLabel: string, segmentGuide: string, emotions: string[]): string {
  const emotionBlock = emotions.length > 0
    ? `\nЭМОЦИОНАЛЬНЫЙ ТОН: Сценарий должен передавать следующие эмоции: ${emotions.join(", ")}. Каждая реплика должна быть пропитана этими эмоциями — через интонацию, выбор слов и энергию подачи.\n`
    : "";

  if (lang === "kk") {
    return `Сен — TikTok/Reels үшін топ AI-сценарист. Мақсатың — оқырманды бірден тартып алатын, қызықты, ТОЛЫҚ түсірілімге дайын сценарий жасау.

БЕЙНЕ КОНТЕКСТІ:
${videoContext}

БЕЙНЕ ҰЗАҚТЫҒЫ: ${durationLabel}
СЕГМЕНТТЕР НҰСҚАУЛЫҒЫ: ${segmentGuide}
${emotionBlock ? emotionBlock.replace("ЭМОЦИОНАЛЬНЫЙ ТОН", "ЭМОЦИЯЛЫҚ ТОН").replace("Сценарий должен передавать следующие эмоции", "Сценарий келесі эмоцияларды жеткізуі тиіс").replace("Каждая реплика должна быть пропитана этими эмоциями — через интонацию, выбор слов и энергию подачи", "Әрбір реплика осы эмоцияларға толы болуы тиіс — интонация, сөз таңдауы және энергия арқылы") : ""}

ШЫҒАРУ ФОРМАТЫ (дәл осылай жаз, ауытқыма!):

---

## 🪝 ХУК НҰСҚАЛАРЫ

Әрбір хук — бейненің **алғашқы 2-3 секунды**. Көрерменді тоқтату керек.

**1. 🔥 Провокация:**
> «...» ← нақты реплика

**2. 💡 Қызықтық:**
> «...» ← нақты реплика

**3. 😱 Шок:**
> «...» ← нақты реплика

---

## 🎬 ТОЛЫҚ СЦЕНАРИЙ (${durationLabel})

⚠️ МАҢЫЗДЫ: Сценарий бейненің ұзақтығына ТОЛЫҚ сәйкес болуы керек!
Сегменттер нұсқаулығы: ${segmentGuide}

Сценарийді секунд бойынша бөл. Бейне ұзақтығының ӘРБІР СЕКУНДЫН жап!
Әр бөлімді толық, мәнді, нақты мазмұнмен жаз. Бос, қысқа бөлімдер ЖІБЕРІЛМЕЙДІ!
Әрбір бөлімде кемінде 3-5 сөйлем болуы тиіс.

Әр бөлімді осылай жаз:

**⏱ [уақыт аралығы] — [БӨЛІМ АТАУЫ]**

*[Камера нұсқаулығы, қимыл-қозғалыс, визуал сипаттамасы]*

«Толық реплика мұнда — кемінде 2-4 сөйлем»

---

## 💡 ТҮСІРІЛІМ КЕҢЕСТЕРІ

- 📷 Камера: (ракурстар, қозғалыстар — нақты)
- 💡 Жарықтандыру: (табиғи / жасанды, бағыты)
- 🎵 Дыбыс: (музыка, дыбыс эффектілер)
- ✂️ Монтаж: (кесу ырғағы, ауысулар)
- 🎭 Эмоция: (қандай тон, энергия деңгейі)

---

МАЗМҰН ЕРЕЖЕЛЕРІ:
1. Түпнұсқаның құрылымы мен вирустық формуласын сақта
2. Сценарийді бейімде — сөзбе-сөз көшірме ЕМЕС
3. Сөйлесу стилі, қысқа сөйлемдер, реплика ретінде жаз
4. Әр репликаны тырнақшаға «» ал
5. Түсірілім нұсқауларын *курсивпен* жаз
6. СЦЕНАРИЙ ТОЛЫҚ БОЛУЫ ТИІС! Бейне ұзақтығының әрбір бөлігін жап!
7. Минимум сөздер саны: 15 секундтық видео = 200+ сөз, 30 сек = 350+ сөз, 60 сек = 600+ сөз, 2+ мин = 1000+ сөз
8. ҚАЗАҚ ТІЛІНДЕ жауап бер
9. Эмоциялық триггерлерді ӘРБІР бөлімде қолдан

Пайдаланушы өңдеуді сұраса — сценарийді оның тілектеріне сай түзе.`;
  }

  return `Ты — топовый AI-сценарист для TikTok/Reels. Твоя цель — создать ПОЛНЫЙ, РАЗВЁРНУТЫЙ сценарий, который моментально цепляет, легко читается и готов к съёмке.

КОНТЕКСТ ВИДЕО:
${videoContext}

ДЛИТЕЛЬНОСТЬ ВИДЕО: ${durationLabel}
РАЗБИВКА ПО СЕГМЕНТАМ: ${segmentGuide}
${emotionBlock}

ФОРМАТ ВЫВОДА (пиши именно так, не отклоняйся!):

---

## 🪝 ВАРИАНТЫ ХУКА

Каждый хук — **первые 2-3 секунды** видео. Нужно остановить скролл.

**1. 🔥 Провокация:**
> «...» ← точная реплика

**2. 💡 Любопытство:**
> «...» ← точная реплика

**3. 😱 Шок:**
> «...» ← точная реплика

---

## 🎬 ПОЛНЫЙ СЦЕНАРИЙ (${durationLabel})

⚠️ ВАЖНО: Сценарий должен ПОЛНОСТЬЮ соответствовать длительности видео!
Разбивка по сегментам: ${segmentGuide}

Разбей сценарий по секундам. Покрой КАЖДУЮ СЕКУНДУ хронометража видео!
Каждый блок должен быть РАЗВЁРНУТЫМ, с полноценным содержанием. Пустые, короткие блоки ЗАПРЕЩЕНЫ!
В каждом блоке минимум 3-5 предложений.

Каждый блок пиши так:

**⏱ [временной диапазон] — [НАЗВАНИЕ БЛОКА]**

*[Указание для камеры, жестикуляция, визуальное описание]*

«Полная реплика здесь — минимум 2-4 предложения»

---

## 💡 СОВЕТЫ ПО СЪЁМКЕ

- 📷 Камера: (ракурсы, движения — конкретно)
- 💡 Свет: (натуральный / искусственный, направление)
- 🎵 Звук: (музыка, звуковые эффекты)
- ✂️ Монтаж: (ритм склеек, переходы)
- 🎭 Эмоция: (какой тон, уровень энергии)

---

ПРАВИЛА КОНТЕНТА:
1. Сохраняй структуру и вирусную формулу оригинала
2. Адаптируй — НЕ копируй дословно
3. Разговорный стиль, короткие фразы, пиши как реплики
4. Каждую реплику бери в кавычки «»
5. Указания для съёмки пиши *курсивом*
6. СЦЕНАРИЙ ДОЛЖЕН БЫТЬ ПОЛНЫМ! Покрой каждый сегмент хронометража!
7. Минимум слов: 15 сек видео = 200+ слов, 30 сек = 350+ слов, 60 сек = 600+ слов, 2+ мин = 1000+ слов
8. Отвечай на русском языке
9. Используй эмоциональные триггеры В КАЖДОМ блоке

Если пользователь просит доработать — корректируй сценарий по его пожеланиям.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const token = authHeader.replace("Bearer ", "");
      await supabaseClient.auth.getUser(token);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { transcript, summary, caption, language, messages } = await req.json();
    const lang = language === "kk" ? "kk" : "ru";

    const videoContext = buildVideoContext(summary, transcript || "", caption || "");
    const { durationLabel, segmentGuide } = getDurationContext(summary);
    const emotions: string[] = (summary?.emotions || []).slice(0, 8).map((e: string) => clean(String(e), 50));

    const systemPrompt = buildSystemPrompt(lang, videoContext, durationLabel, segmentGuide, emotions);

    const sanitizedMessages = (messages || []).slice(-10).map((m: any) => ({
      role: String(m.role) === "assistant" ? "assistant" : "user",
      content: clean(String(m.content || ''), 2000),
    }));

    const chatMessages = sanitizedMessages.length > 0
      ? [{ role: "system", content: systemPrompt }, ...sanitizedMessages]
      : [
          { role: "system", content: systemPrompt },
          { role: "user", content: lang === "kk"
            ? "Осы бейне негізінде ТОЛЫҚ бейімделген сценарий жаса. Хуктің 3 нұсқасын және бейне ұзақтығына сәйкес толық сценарийді жаз. Қысқартпа, ТОЛЫҚ жаз!"
            : "Сгенерируй ПОЛНЫЙ адаптированный сценарий на основе этого видео. Предложи 3 варианта хука и напиши ПОЛНЫЙ сценарий на всю длительность видео. Не сокращай, пиши РАЗВЁРНУТО!" },
        ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: chatMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов, попробуйте позже." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Необходимо пополнить баланс." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Ошибка AI" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-script error:", e);
    return new Response(JSON.stringify({ error: "Не удалось обработать запрос. Попробуйте позже." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
