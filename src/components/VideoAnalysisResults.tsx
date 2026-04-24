import {
  Clock, Copy, Sparkles, Flame, Target, Users, Zap, TrendingUp, ThumbsUp, ThumbsDown,
  Lightbulb, MessageCircle, Eye, Heart, Share2, Timer, BarChart3, Gauge, Rocket,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { useMemo, useState } from "react";

interface AnalysisResultsProps {
  summary: any;
  transcript: string;
  stats: any;
  views: number;
  likes: number;
  commentsCount: number;
  shares: number;
  er: string;
  onGenerateScript: () => void;
  language: "ru" | "kk" | null;
}

// ───────────────────────── Helpers ─────────────────────────
const fmt = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
};

const isUnknown = (v: unknown) => {
  if (typeof v !== "string") return true;
  const n = v.trim().toLowerCase();
  return !n || ["белгісіз", "неизвестно", "unknown", "n/a", "жоқ", "нет", "-"].includes(n);
};

const fmtDuration = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m > 0) return `${m}:${String(s).padStart(2, "0")}`;
  return `0:${String(s).padStart(2, "0")}`;
};

// ───────────────────────── Atoms ─────────────────────────
const Section = ({
  icon: Icon, title, children, accent = false, variant = "default",
}: {
  icon?: any;
  title: string;
  children: React.ReactNode;
  accent?: boolean;
  variant?: "default" | "ghost" | "hero";
}) => {
  const base =
    variant === "hero"
      ? "rounded-2xl border p-4 md:p-5"
      : variant === "ghost"
      ? "rounded-xl p-3 md:p-3.5"
      : "rounded-xl border p-3.5 md:p-4";
  const tone = accent
    ? "border-viral/40 bg-viral/8"
    : variant === "ghost"
    ? "bg-transparent"
    : "border-border/50 bg-card";
  return (
    <div className={`${base} ${tone}`}>
      <div className="flex items-center gap-2 mb-2.5">
        {Icon && (
          <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
            accent ? "bg-viral/20 text-foreground" : "bg-muted text-muted-foreground"
          }`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
        <h3 className={`text-[13px] md:text-[14px] font-bold tracking-tight ${
          accent ? "text-foreground" : "text-foreground"
        }`}>{title}</h3>
      </div>
      {children}
    </div>
  );
};

const StatPill = ({
  icon: Icon, label, value, accent = false,
}: {
  icon: any; label: string; value: string | number; accent?: boolean;
}) => (
  <div
    className={`flex flex-col items-start justify-between gap-1 p-2.5 md:p-3 rounded-xl border min-h-[68px] ${
      accent
        ? "border-viral/40 bg-viral/8"
        : "border-border/50 bg-card"
    }`}
  >
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      <span className="text-[11px] font-medium truncate">{label}</span>
    </div>
    <span className={`text-[18px] md:text-[20px] font-black tabular-nums leading-none ${
      accent ? "text-foreground" : "text-foreground"
    }`}>
      {value}
    </span>
  </div>
);

// Radial gauge SVG — 0-100 score
const RadialGauge = ({ score, label, sublabel }: { score: number; label: string; sublabel: string }) => {
  const r = 38;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const hue = score >= 70 ? 142 : score >= 40 ? 45 : 0; // green / yellow / red
  return (
    <div className="flex items-center gap-3 md:gap-4">
      <div className="relative w-[96px] h-[96px] md:w-[108px] md:h-[108px] flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={r} stroke="hsl(var(--border))" strokeWidth="8" fill="none" />
          <circle
            cx="50" cy="50" r={r}
            stroke={`hsl(${hue} 70% 50%)`}
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 900ms ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[26px] md:text-[30px] font-black leading-none tabular-nums text-foreground">
            {score}
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground mt-0.5">/100</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground leading-none mb-1">
          {label}
        </p>
        <p className="text-[15px] md:text-[17px] font-bold text-foreground leading-tight tracking-tight">
          {sublabel}
        </p>
      </div>
    </div>
  );
};

// ───────────────────────── Main ─────────────────────────
export function VideoAnalysisResults({
  summary, transcript, stats, views, likes, commentsCount, shares, er, onGenerateScript, language,
}: AnalysisResultsProps) {
  const isKk = language === "kk";
  const duration = Number(stats?.duration || stats?.duration_sec || stats?.video?.duration || 0);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  // ===== Metrics =====
  const erNum = parseFloat(er) || 0;
  const likeRatio = views > 0 ? likes / views : 0;
  const shareRatio = views > 0 ? shares / views : 0;
  const commentRatio = views > 0 ? commentsCount / views : 0;
  const commentToLikeRatio = likes > 0 ? commentsCount / likes : 0;

  const viralityScore = useMemo(() => {
    let s = 0;

    // 1) Reach (абсолютные просмотры) — до 35 баллов
    //    Логарифмическая шкала: 10k=10, 100k=20, 1M=28, 10M=33, 50M+=35
    if (views >= 50_000_000) s += 35;
    else if (views >= 10_000_000) s += 33;
    else if (views >= 1_000_000) s += 28;
    else if (views >= 100_000) s += 20;
    else if (views >= 10_000) s += 10;
    else if (views >= 1_000) s += 4;

    // 2) Engagement Rate — до 25 баллов
    if (erNum >= 10) s += 25;
    else if (erNum >= 5) s += 18;
    else if (erNum >= 2) s += 10;
    else if (erNum >= 0.5) s += 4;

    // 3) Share velocity (репосты — главный сигнал вирусности) — до 20 баллов
    if (shareRatio >= 0.01) s += 20;
    else if (shareRatio >= 0.003) s += 14;
    else if (shareRatio >= 0.001) s += 8;
    else if (shareRatio >= 0.0003) s += 3;

    // 4) Like ratio — до 12 баллов
    if (likeRatio >= 0.08) s += 12;
    else if (likeRatio >= 0.04) s += 9;
    else if (likeRatio >= 0.02) s += 6;
    else if (likeRatio >= 0.01) s += 3;

    // 5) Comment ratio — до 8 баллов
    if (commentRatio >= 0.005) s += 8;
    else if (commentRatio >= 0.002) s += 6;
    else if (commentRatio >= 0.0005) s += 3;

    return Math.min(100, s);
  }, [views, erNum, shareRatio, likeRatio, commentRatio]);

  const viralityLabel = viralityScore >= 70
    ? (isKk ? "Жоғары әлеует" : "Высокий потенциал")
    : viralityScore >= 40
    ? (isKk ? "Орташа әлеует" : "Средний потенциал")
    : (isKk ? "Төмен әлеует" : "Низкий потенциал");

  const hookStrength = useMemo(() => {
    if (!transcript) return null;
    const words = transcript.trim().split(/\s+/).slice(0, 15);
    const text = words.join(" ");
    let score = 0;
    if (words.length >= 8 && words.length <= 15) score += 2;
    else if (words.length >= 5) score += 1;
    if (/[?？]/.test(text)) score += 1;
    const emo = /(шок|невероятн|секрет|никогда|почему|как|вот|представь|удивительн|потрясающ|таңғажайып|керемет|құпия|неге|қалай|мынау|wow|amazing|secret|never|how|why|shocking)/i;
    if (emo.test(text)) score += 1;
    const tone = score >= 3 ? "strong" : score >= 2 ? "mid" : "weak";
    const label = tone === "strong" ? (isKk ? "Күшті" : "Сильный")
      : tone === "mid" ? (isKk ? "Орташа" : "Средний")
      : (isKk ? "Әлсіз" : "Слабый");
    const emoji = tone === "strong" ? "⚡" : tone === "mid" ? "✨" : "💤";
    const dot = tone === "strong" ? "bg-green-500" : tone === "mid" ? "bg-yellow-500" : "bg-red-500";
    return { label, emoji, dot, words: words.length };
  }, [transcript, isKk]);

  const durationFromStructure = useMemo(() => {
    const last = summary?.structure?.[summary.structure.length - 1];
    const t: string = last?.time || last?.timestamp || "";
    const m = t.match(/(\d+):(\d+)/);
    if (m) return Number(m[1]) * 60 + Number(m[2]);
    const m2 = t.match(/(\d+)\s*(сек|s)/i);
    if (m2) return Number(m2[1]);
    return duration;
  }, [summary, duration]);

  const durationAssessment = useMemo(() => {
    const d = durationFromStructure;
    if (!d) return null;
    const fmtT = fmtDuration(d);
    if (d >= 15 && d <= 30) return { fmt: fmtT, label: isKk ? "TikTok үшін оптималды" : "Оптимально для TikTok", tone: "good" as const };
    if (d < 15) return { fmt: fmtT, label: isKk ? "Тым қысқа" : "Слишком коротко", tone: "warn" as const };
    if (d <= 60) return { fmt: fmtT, label: isKk ? "Жақсы ұзақтық" : "Хорошая длительность", tone: "good" as const };
    return { fmt: fmtT, label: isKk ? "Ұзақтау" : "Длинновато", tone: "warn" as const };
  }, [durationFromStructure, isKk]);

  const sharePotential = useMemo(() => {
    if (shares < 1000) return false;
    const hasEmotion = (summary?.emotions?.length || 0) > 0;
    return hasEmotion || shareRatio >= 0.005;
  }, [shares, summary, shareRatio]);

  const ratioLabel = (ratio: number, low: number, mid: number, high: number) => {
    if (ratio >= high) return { txt: isKk ? "өте жоғары" : "очень высоко", color: "text-green-500", bar: "bg-green-500" };
    if (ratio >= mid) return { txt: isKk ? "жоғары" : "высоко", color: "text-green-500", bar: "bg-green-500" };
    if (ratio >= low) return { txt: isKk ? "орташа" : "средне", color: "text-yellow-500", bar: "bg-yellow-500" };
    return { txt: isKk ? "төмен" : "низко", color: "text-muted-foreground", bar: "bg-muted-foreground/50" };
  };
  const likeR = ratioLabel(likeRatio, 0.01, 0.02, 0.05);
  const shareR = ratioLabel(shareRatio, 0.001, 0.003, 0.01);
  const commentR = ratioLabel(commentToLikeRatio, 0.005, 0.015, 0.03);

  const copyHook = () => {
    if (!summary?.hook_phrase) return;
    navigator.clipboard.writeText(summary.hook_phrase);
    toast.success(isKk ? "Хук көшірілді ✅" : "Хук скопирован ✅");
  };

  const metaChips: { key: string; label: string; emoji: string; tone: "neutral" | "accent" }[] = [];
  if (summary?.language) {
    metaChips.push({
      key: "lang",
      label: summary.language,
      emoji: summary.language === "Русский" ? "🇷🇺" : summary.language === "English" ? "🇺🇸" : "🌐",
      tone: "neutral",
    });
  }
  if (summary?.content_format) {
    metaChips.push({ key: "fmt", label: summary.content_format, emoji: "🎬", tone: "neutral" });
  }
  if (duration) {
    metaChips.push({ key: "dur", label: fmtDuration(duration), emoji: "⏱", tone: "neutral" });
  }

  return (
    <div className="space-y-4 md:space-y-5">
      {/* ═════ HERO ═════ */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card to-muted/30 p-4 md:p-5 shadow-soft">
        {summary?.topic && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground leading-none mb-1.5">
              {isKk ? "Тақырып" : "Тема видео"}
            </p>
            <h2 className="text-[18px] md:text-[22px] font-bold text-foreground leading-tight tracking-tight mb-4 line-clamp-2">
              {summary.topic}
            </h2>
          </>
        )}

        <div className="flex items-center justify-between gap-4">
          <RadialGauge score={viralityScore} label={isKk ? "Виралдық" : "Виральность"} sublabel={viralityLabel} />

          {summary?.virality_score != null && (
            <div className="hidden sm:flex flex-col items-center justify-center rounded-xl border border-border/50 bg-background/50 px-4 py-3 min-w-[88px]">
              <span className={`text-[28px] font-black leading-none tabular-nums ${
                summary.virality_score >= 7 ? "text-green-500" :
                summary.virality_score >= 4 ? "text-yellow-500" :
                "text-red-500"
              }`}>
                {summary.virality_score}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">
                AI /10
              </span>
            </div>
          )}
        </div>

        {/* Meta chips */}
        {metaChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-border/40">
            {metaChips.map((c) => (
              <span key={c.key} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-background border border-border/60 text-foreground/80">
                <span className="text-xs leading-none">{c.emoji}</span>
                {c.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ═════ QUICK STATS ═════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <StatPill icon={Eye} label={isKk ? "Көрулер" : "Просмотры"} value={fmt(views)} accent />
        <StatPill icon={Heart} label={isKk ? "Лайктар" : "Лайки"} value={fmt(likes)} />
        <StatPill icon={MessageCircle} label={isKk ? "Пікірлер" : "Комментарии"} value={fmt(commentsCount)} />
        <StatPill icon={Share2} label={isKk ? "Бөлісулер" : "Репосты"} value={fmt(shares)} />
        <StatPill icon={TrendingUp} label="ER" value={er + "%"} accent />
      </div>

      {/* ═════ KEY INSIGHTS ROW (Hook + Duration + Share potential) ═════ */}
      {(hookStrength || durationAssessment || sharePotential) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {hookStrength && (
            <div className="rounded-xl border border-border/50 bg-card p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {isKk ? "Хук күші" : "Сила хука"}
                </p>
                <span className={`w-2 h-2 rounded-full ${hookStrength.dot}`} />
              </div>
              <p className="text-[16px] font-bold text-foreground leading-none">
                {hookStrength.label} <span className="text-[18px]">{hookStrength.emoji}</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {hookStrength.words} {isKk ? "сөз бастапқы фразада" : "слов в начальной фразе"}
              </p>
            </div>
          )}

          {durationAssessment && (
            <div className="rounded-xl border border-border/50 bg-card p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {isKk ? "Ұзақтығы" : "Длительность"}
                </p>
                <span className={`w-2 h-2 rounded-full ${durationAssessment.tone === "good" ? "bg-green-500" : "bg-yellow-500"}`} />
              </div>
              <p className="text-[16px] font-bold text-foreground leading-none tabular-nums">
                {durationAssessment.fmt}
              </p>
              <p className={`text-[11px] mt-1.5 ${durationAssessment.tone === "good" ? "text-green-600" : "text-yellow-600"}`}>
                {durationAssessment.label}
              </p>
            </div>
          )}

          {sharePotential && (
            <div className="rounded-xl border border-viral/40 bg-viral/8 p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">
                  {isKk ? "Тарату әлеуеті" : "Потенциал шеринга"}
                </p>
                <Rocket className="h-3.5 w-3.5 text-foreground" />
              </div>
              <p className="text-[16px] font-bold text-foreground leading-none">
                {isKk ? "Жоғары 🚀" : "Высокий 🚀"}
              </p>
              <p className="text-[11px] text-foreground/70 mt-1.5">
                {isKk ? "Эмоциялық тақырып жұмыс істейді" : "Эмоции работают на шеринг"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═════ ENGAGEMENT RATIOS (visual bars) ═════ */}
      {views > 0 && (
        <Section icon={TrendingUp} title={isKk ? "Қатысу коэффициенттері" : "Соотношения вовлечения"}>
          <div className="space-y-3">
            {[
              { label: isKk ? "Лайктар / Көрулер" : "Лайки / Просмотры", pct: likeRatio * 100, tone: likeR, scale: 5 },
              { label: isKk ? "Бөлісулер / Көрулер" : "Репосты / Просмотры", pct: shareRatio * 100, tone: shareR, scale: 1 },
              { label: isKk ? "Пікірлер / Лайктар" : "Комменты / Лайки", pct: commentToLikeRatio * 100, tone: commentR, scale: 3 },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] text-muted-foreground">{row.label}</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[14px] font-bold tabular-nums text-foreground">
                      {row.pct.toFixed(row.scale === 1 ? 2 : 1)}%
                    </span>
                    <span className={`text-[10px] font-semibold ${row.tone.color}`}>{row.tone.txt}</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${row.tone.bar} transition-all duration-700 ease-out`}
                    style={{ width: `${Math.min(100, (row.pct / row.scale) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ═════ 2-COLUMN ANALYSIS GRID (desktop) ═════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {/* Why viral */}
        {!isUnknown(summary?.why_viral) && (
          <div className="lg:col-span-2">
            <Section icon={Flame} title={isKk ? "Неге атты? 🔥" : "Почему выстрелило? 🔥"} accent>
              <p className="text-[13.5px] md:text-[14px] text-foreground/90 leading-relaxed">{summary.why_viral}</p>
            </Section>
          </div>
        )}

        {/* Summary */}
        {summary?.summary && (
          <Section icon={Eye} title={isKk ? "Мазмұны" : "Суть видео"}>
            <p className="text-[13px] text-foreground/85 leading-relaxed">{summary.summary}</p>
          </Section>
        )}

        {/* Target audience */}
        {!isUnknown(summary?.target_audience) && (
          <Section icon={Users} title={isKk ? "Мақсатты аудитория" : "Целевая аудитория"}>
            <p className="text-[13px] text-foreground/85 leading-relaxed">{summary.target_audience}</p>
          </Section>
        )}

        {/* Emotions */}
        {summary?.emotions?.length > 0 && (
          <Section icon={Zap} title={isKk ? "Эмоциялық триггерлер" : "Эмоциональные триггеры"}>
            <div className="flex flex-wrap gap-1.5">
              {summary.emotions.map((emotion: string, i: number) => (
                <span key={i} className="px-2.5 py-1 rounded-lg text-[12px] font-medium bg-muted text-foreground/90 border border-border/40">
                  {emotion}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* CTA Analysis */}
        {!isUnknown(summary?.cta_analysis) && (
          <Section icon={Target} title={isKk ? "CTA талдауы" : "Анализ CTA"}>
            <p className="text-[13px] text-foreground/85 leading-relaxed">{summary.cta_analysis}</p>
          </Section>
        )}
      </div>

      {/* ═════ HOOKS GROUP ═════ */}
      {(summary?.hook_phrase || summary?.visual_hook || summary?.text_hook) && (
        <Section icon={Sparkles} title={isKk ? "Хуктар" : "Хуки"}>
          <div className="space-y-2">
            {!isUnknown(summary?.hook_phrase) && (
              <div className="p-3 rounded-lg border border-border/60 bg-muted/30">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    🎣 {isKk ? "Хук фраза" : "Хук-фраза"}
                  </p>
                  <button
                    onClick={copyHook}
                    className="inline-flex items-center gap-1 px-2 h-6 rounded-md text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-background transition-colors border border-border/50"
                  >
                    <Copy className="h-3 w-3" />
                    {isKk ? "Көшіру" : "Копировать"}
                  </button>
                </div>
                <p className="text-[13.5px] font-medium text-foreground italic leading-relaxed">"{summary.hook_phrase}"</p>
              </div>
            )}
            {!isUnknown(summary?.visual_hook) && (
              <div className="p-3 rounded-lg border border-border/60 bg-muted/30">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  👁 {isKk ? "Визуалды хук" : "Визуальный хук"}
                </p>
                <p className="text-[13px] text-foreground/85 leading-relaxed">{summary.visual_hook}</p>
              </div>
            )}
            {!isUnknown(summary?.text_hook) && (
              <div className="p-3 rounded-lg border border-border/60 bg-muted/30">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  📝 {isKk ? "Мәтіндік хук" : "Текстовый хук"}
                </p>
                <p className="text-[13px] font-medium text-foreground leading-relaxed">"{summary.text_hook}"</p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ═════ STRUCTURE TIMELINE ═════ */}
      {summary?.structure?.length > 0 && (
        <Section icon={Clock} title={isKk ? "Видео құрылымы" : "Структура видео"}>
          <div className="relative pl-5 space-y-3">
            <div className="absolute left-[7px] top-1.5 bottom-1 w-0.5 bg-border" />
            {summary.structure.map((seg: any, i: number) => {
              const isLast = i === summary.structure.length - 1;
              return (
                <div key={i} className="relative">
                  <div className={`absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                    isLast ? "bg-viral border-viral" : "bg-card border-border"
                  }`}>
                    {isLast && <div className="w-1 h-1 rounded-full bg-foreground" />}
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap mt-0.5 min-w-[44px] bg-muted px-1.5 py-0.5 rounded">
                      {seg.time || seg.timestamp || ""}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold text-foreground leading-tight">{seg.title || seg.name || ""}</p>
                      {seg.description && (
                        <p className="text-[11.5px] text-foreground/65 mt-1 leading-relaxed">{seg.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ═════ STRENGTHS & WEAKNESSES ═════ */}
      {(summary?.strengths?.length > 0 || summary?.weaknesses?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {summary?.strengths?.length > 0 && (
            <Section icon={ThumbsUp} title={isKk ? "Күшті жақтар" : "Сильные стороны"}>
              <ul className="space-y-1.5">
                {summary.strengths.map((s: string, i: number) => (
                  <li key={i} className="text-[12.5px] text-foreground/85 flex items-start gap-2 leading-relaxed">
                    <span className="text-green-500 font-bold mt-0.5 flex-shrink-0">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {summary?.weaknesses?.length > 0 && (
            <Section icon={ThumbsDown} title={isKk ? "Жақсарту нүктелері" : "Точки роста"}>
              <ul className="space-y-1.5">
                {summary.weaknesses.map((w: string, i: number) => (
                  <li key={i} className="text-[12.5px] text-foreground/85 flex items-start gap-2 leading-relaxed">
                    <span className="text-yellow-500 font-bold mt-0.5 flex-shrink-0">△</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}

      {/* ═════ RECOMMENDATIONS — prominent accent ═════ */}
      {summary?.recommendations?.length > 0 && (
        <Section icon={Lightbulb} title={isKk ? "AI ұсыныстары" : "Рекомендации AI"} accent>
          <ol className="space-y-2">
            {summary.recommendations.map((r: string, i: number) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-md bg-foreground text-background text-[11px] font-bold flex items-center justify-center tabular-nums">
                  {i + 1}
                </span>
                <span className="text-[13px] text-foreground/90 leading-relaxed">{r}</span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* ═════ TAGS & NICHES ═════ */}
      {(summary?.tags?.length > 0 || summary?.niches?.length > 0) && (
        <Section icon={Target} title={isKk ? "Тегтер мен ниша" : "Теги и ниши"} variant="ghost">
          <div className="flex flex-wrap gap-1.5">
            {summary?.niches?.map((niche: string, i: number) => (
              <span key={`n-${i}`} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-foreground text-background">
                {niche}
              </span>
            ))}
            {summary?.tags?.slice(0, 12).map((tag: string, i: number) => (
              <span key={`t-${i}`} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-card border border-border/60 text-foreground/80">
                #{tag.replace(/^#/, "")}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* ═════ FUNNEL ═════ */}
      {summary?.funnel && (summary.funnel.direction || summary.funnel.goal) && (
        <Section icon={Target} title={isKk ? "Воронка / Маркетинг" : "Воронка / Маркетинг"}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {summary.funnel.direction && (
              <div className="rounded-lg bg-muted/40 p-2.5 border border-border/40">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  {isKk ? "Бағыты" : "Куда ведёт"}
                </p>
                <p className="text-[12.5px] text-foreground/85 leading-relaxed">{summary.funnel.direction}</p>
              </div>
            )}
            {summary.funnel.goal && (
              <div className="rounded-lg bg-muted/40 p-2.5 border border-border/40">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  {isKk ? "Мақсаты" : "Цель"}
                </p>
                <p className="text-[12.5px] text-foreground/85 leading-relaxed">{summary.funnel.goal}</p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ═════ TRANSCRIPTION — collapsible ═════ */}
      {transcript && (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <button
            onClick={() => setTranscriptOpen((o) => !o)}
            className="w-full flex items-center justify-between px-3.5 py-3 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
                <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <h3 className="text-[13px] md:text-[14px] font-bold text-foreground">
                {isKk ? "Транскрипция" : "Транскрибация"}
              </h3>
              <span className="text-[10px] font-semibold text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                {transcript.split(/\s+/).length} {isKk ? "сөз" : "слов"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(transcript); toast.success(isKk ? "Көшірілді!" : "Скопировано!"); }}
                className="inline-flex items-center gap-1 px-2 h-6 rounded-md text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-background transition-colors border border-border/50"
              >
                <Copy className="h-3 w-3" />
              </button>
              {transcriptOpen
                ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </button>
          {transcriptOpen && (
            <div className="px-3.5 pb-3.5 border-t border-border/40 pt-3 animate-fade-in">
              <div className="max-h-48 overflow-y-auto">
                <p className="text-[12px] text-foreground/75 leading-relaxed whitespace-pre-wrap font-mono">
                  {transcript}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom spacer so sticky CTA never hides content */}
      <div className="h-2" />
    </div>
  );
}
