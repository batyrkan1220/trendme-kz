import { Clock, Copy, Sparkles, Flame, Target, Users, Zap, TrendingUp, ThumbsUp, ThumbsDown, Lightbulb, MessageCircle, Eye, Heart, Share2, Timer, BarChart3, Gauge, Rocket } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

const SectionCard = ({ icon: Icon, title, children, accent = false }: { icon?: any; title: string; children: React.ReactNode; accent?: boolean }) => (
  <div className={`rounded-xl border p-3.5 ${accent ? "border-primary/30 bg-primary/5" : "border-border/50 bg-muted/30"}`}>
    <div className="flex items-center gap-2 mb-2.5">
      {Icon && <Icon className={`h-4 w-4 flex-shrink-0 ${accent ? "text-primary" : "text-muted-foreground"}`} />}
      <h3 className={`text-[13px] font-bold ${accent ? "text-primary" : "text-foreground"}`}>{title}</h3>
    </div>
    {children}
  </div>
);

const StatMini = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) => (
  <div className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg bg-card border border-border/30 min-w-0">
    <Icon className="h-3 w-3 text-muted-foreground" />
    <span className="text-[11px] font-bold text-foreground truncate w-full text-center">{value}</span>
    <span className="text-[9px] text-muted-foreground truncate w-full text-center">{label}</span>
  </div>
);

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

const fmtDuration = (sec: number, isKk: boolean) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m > 0) return `${m}${isKk ? " мин" : " мин"} ${s}${isKk ? " сек" : " сек"}`;
  return `${s}${isKk ? " сек" : " сек"}`;
};

export function VideoAnalysisResults({
  summary, transcript, stats, views, likes, commentsCount, shares, er, onGenerateScript, language
}: AnalysisResultsProps) {
  const isKk = language === "kk";
  const duration = Number(stats?.duration || stats?.duration_sec || stats?.video?.duration || 0);

  // ===== Calculated metrics =====
  const erNum = parseFloat(er) || 0;
  const likeRatio = views > 0 ? likes / views : 0;
  const shareRatio = views > 0 ? shares / views : 0;
  const commentRatio = views > 0 ? commentsCount / views : 0;
  const commentToLikeRatio = likes > 0 ? commentsCount / likes : 0;

  const viralityScore = useMemo(() => {
    let s = 0;
    if (erNum > 5) s += 30;
    if (shareRatio > 0.003) s += 25;
    if (likeRatio > 0.02) s += 25;
    if (commentRatio > 0.0005) s += 20;
    return s;
  }, [erNum, shareRatio, likeRatio, commentRatio]);

  const viralityColor = viralityScore > 70
    ? "text-green-500 border-green-500/30 bg-green-500/10"
    : viralityScore >= 40
    ? "text-yellow-500 border-yellow-500/30 bg-yellow-500/10"
    : "text-red-500 border-red-500/30 bg-red-500/10";

  const nicheKey: string | null = summary?.niches?.[0] || null;
  const [bench, setBench] = useState<{ avgViews: number; avgEr: number; count: number } | null>(null);
  useEffect(() => {
    if (!nicheKey) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("videos")
        .select("views, likes, comments, shares")
        .eq("niche", nicheKey)
        .gt("views", 0)
        .order("fetched_at", { ascending: false })
        .limit(200);
      if (cancelled || !data || data.length === 0) return;
      const totalV = data.reduce((a, v: any) => a + Number(v.views || 0), 0);
      const totalEng = data.reduce((a, v: any) => a + Number(v.likes || 0) + Number(v.comments || 0) + Number(v.shares || 0), 0);
      const avgViews = totalV / data.length;
      const avgEr = totalV > 0 ? (totalEng / totalV) * 100 : 0;
      setBench({ avgViews, avgEr, count: data.length });
    })();
    return () => { cancelled = true; };
  }, [nicheKey]);

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
    if (score >= 3) return { label: isKk ? "Күшті" : "Сильный", color: "text-green-500 border-green-500/30 bg-green-500/10", emoji: "⚡", words: words.length };
    if (score >= 2) return { label: isKk ? "Орташа" : "Средний", color: "text-yellow-500 border-yellow-500/30 bg-yellow-500/10", emoji: "✨", words: words.length };
    return { label: isKk ? "Әлсіз" : "Слабый", color: "text-red-500 border-red-500/30 bg-red-500/10", emoji: "💤", words: words.length };
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
    const mm = Math.floor(d / 60);
    const ss = d % 60;
    const fmtT = `${mm}:${String(ss).padStart(2, "0")}`;
    if (d >= 15 && d <= 30) return { fmt: fmtT, label: isKk ? "TikTok үшін оптималды" : "оптимально для TikTok", color: "text-green-500", emoji: "✅" };
    if (d < 15) return { fmt: fmtT, label: isKk ? "тым қысқа" : "слишком коротко", color: "text-yellow-500", emoji: "⚠️" };
    if (d <= 60) return { fmt: fmtT, label: isKk ? "жақсы ұзақтық" : "хорошая длительность", color: "text-green-500", emoji: "👍" };
    return { fmt: fmtT, label: isKk ? "ұзақтау" : "длинновато", color: "text-yellow-500", emoji: "⏱" };
  }, [durationFromStructure, isKk]);

  const sharePotential = useMemo(() => {
    if (shares < 1000) return false;
    const hasEmotion = (summary?.emotions?.length || 0) > 0;
    return hasEmotion || shareRatio >= 0.005;
  }, [shares, summary, shareRatio]);

  const ratioLabel = (ratio: number, low: number, mid: number, high: number) => {
    if (ratio >= high) return { txt: isKk ? "өте жоғары" : "очень высоко", color: "text-green-500" };
    if (ratio >= mid) return { txt: isKk ? "жоғары" : "высоко", color: "text-green-500" };
    if (ratio >= low) return { txt: isKk ? "орташа" : "средне", color: "text-yellow-500" };
    return { txt: isKk ? "төмен" : "низко", color: "text-muted-foreground" };
  };
  const likeR = ratioLabel(likeRatio, 0.01, 0.02, 0.05);
  const shareR = ratioLabel(shareRatio, 0.001, 0.003, 0.01);
  const commentR = ratioLabel(commentToLikeRatio, 0.005, 0.015, 0.03);

  const copyHook = () => {
    if (!summary?.hook_phrase) return;
    navigator.clipboard.writeText(summary.hook_phrase);
    toast.success(isKk ? "Хук көшірілді ✅" : "Хук скопирован ✅");
  };

  return (
    <div className="space-y-2.5">
      {/* Topic + Virality Score + Duration */}
      {summary?.topic && (
        <div className="flex items-start gap-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
              {isKk ? "Тақырып" : "Тема"}
            </p>
            <h2 className="text-base font-bold text-foreground leading-tight line-clamp-2">{summary.topic}</h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {duration > 0 && (
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted border border-border/50">
                  <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="text-[9px] text-muted-foreground">{fmtDuration(duration, isKk)}</span>
              </div>
            )}
            {summary?.virality_score != null && (
              <div className="flex flex-col items-center gap-0.5">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-base ${
                  summary.virality_score >= 7 ? "bg-green-500/15 text-green-500 border border-green-500/30" :
                  summary.virality_score >= 4 ? "bg-yellow-500/15 text-yellow-500 border border-yellow-500/30" :
                  "bg-red-500/15 text-red-500 border border-red-500/30"
                }`}>
                  {summary.virality_score}
                </div>
                <span className="text-[9px] text-muted-foreground">/10</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-5 gap-1">
        <StatMini icon={Eye} label={isKk ? "Көру" : "Просм"} value={fmt(views)} />
        <StatMini icon={Heart} label={isKk ? "Лайк" : "Лайки"} value={fmt(likes)} />
        <StatMini icon={MessageCircle} label={isKk ? "Пікір" : "Комм"} value={fmt(commentsCount)} />
        <StatMini icon={Share2} label={isKk ? "Бөлісу" : "Репост"} value={fmt(shares)} />
        <StatMini icon={TrendingUp} label="ER" value={er + "%"} />
      </div>

      {/* Virality Score 0-100 */}
      <div className={`rounded-xl border p-3 flex items-center justify-between ${viralityColor}`}>
        <div className="flex items-center gap-2 min-w-0">
          <Gauge className="h-4 w-4 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider opacity-70">{isKk ? "Виралдық" : "Виральность"}</p>
            <p className="text-[13px] font-bold truncate">
              {viralityScore >= 70 ? (isKk ? "Жоғары әлеует 🔥" : "Высокий потенциал 🔥") :
               viralityScore >= 40 ? (isKk ? "Орташа әлеует" : "Средний потенциал") :
               (isKk ? "Төмен әлеует" : "Низкий потенциал")}
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-2xl font-black leading-none">{viralityScore}</span>
          <span className="text-[11px] opacity-70">/100</span>
        </div>
      </div>

      {/* Niche benchmark */}
      {bench && bench.count >= 5 && (
        <SectionCard icon={BarChart3} title={isKk ? `«${nicheKey}» нишасымен салыстыру` : `Сравнение с нишей «${nicheKey}»`}>
          <div className="space-y-1.5">
            {bench.avgViews > 0 && (
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">{isKk ? "Көру" : "Просмотры"}</span>
                <span className="font-semibold text-foreground">
                  {views >= bench.avgViews
                    ? `${(views / bench.avgViews).toFixed(1)}x ${isKk ? "жоғары" : "выше среднего"} ↑`
                    : `${(bench.avgViews / Math.max(views, 1)).toFixed(1)}x ${isKk ? "төмен" : "ниже среднего"} ↓`}
                </span>
              </div>
            )}
            {bench.avgEr > 0 && (
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">ER</span>
                <span className="font-semibold text-foreground">
                  {erNum.toFixed(2)}% vs {bench.avgEr.toFixed(2)}% {isKk ? "орташа" : "среднее"}
                  <span className={erNum >= bench.avgEr ? "text-green-500 ml-1" : "text-yellow-500 ml-1"}>
                    {erNum >= bench.avgEr ? "↑" : "↓"}
                  </span>
                </span>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Engagement ratios */}
      {views > 0 && (
        <SectionCard icon={TrendingUp} title={isKk ? "Қатысу коэффициенттері" : "Соотношения вовлечения"}>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-card border border-border/40 p-2 text-center">
              <p className="text-[10px] text-muted-foreground">{isKk ? "Лайк/Көру" : "Лайки/Просм"}</p>
              <p className="text-[13px] font-bold text-foreground">{(likeRatio * 100).toFixed(1)}%</p>
              <p className={`text-[10px] font-semibold ${likeR.color}`}>{likeR.txt}</p>
            </div>
            <div className="rounded-lg bg-card border border-border/40 p-2 text-center">
              <p className="text-[10px] text-muted-foreground">{isKk ? "Бөлісу/Көру" : "Репост/Просм"}</p>
              <p className="text-[13px] font-bold text-foreground">{(shareRatio * 100).toFixed(2)}%</p>
              <p className={`text-[10px] font-semibold ${shareR.color}`}>{shareR.txt}</p>
            </div>
            <div className="rounded-lg bg-card border border-border/40 p-2 text-center">
              <p className="text-[10px] text-muted-foreground">{isKk ? "Пікір/Лайк" : "Комм/Лайки"}</p>
              <p className="text-[13px] font-bold text-foreground">{(commentToLikeRatio * 100).toFixed(1)}%</p>
              <p className={`text-[10px] font-semibold ${commentR.color}`}>{commentR.txt}</p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Hook strength + Duration assessment */}
      {(hookStrength || durationAssessment) && (
        <div className="grid grid-cols-2 gap-2">
          {hookStrength && (
            <div className={`rounded-xl border p-2.5 ${hookStrength.color}`}>
              <p className="text-[10px] uppercase tracking-wider opacity-70">{isKk ? "Хук күші" : "Сила хука"}</p>
              <p className="text-[13px] font-bold mt-0.5">{hookStrength.label} {hookStrength.emoji}</p>
              <p className="text-[10px] opacity-70 mt-0.5">{hookStrength.words} {isKk ? "сөз" : "слов"}</p>
            </div>
          )}
          {durationAssessment && (
            <div className="rounded-xl border border-border/50 bg-muted/30 p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{isKk ? "Ұзақтығы" : "Длина"}</p>
              <p className="text-[13px] font-bold text-foreground mt-0.5">{durationAssessment.fmt} {durationAssessment.emoji}</p>
              <p className={`text-[10px] font-semibold mt-0.5 ${durationAssessment.color}`}>{durationAssessment.label}</p>
            </div>
          )}
        </div>
      )}

      {/* Share potential */}
      {sharePotential && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-start gap-2">
          <Rocket className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-primary">{isKk ? "Тарату әлеуеті жоғары" : "Высокий потенциал распространения"}</p>
            <p className="text-[11px] text-foreground/70 mt-0.5">💬 {isKk ? "Адамдар белсенді бөлісуде — эмоциялық тақырып жұмыс істейді" : "Люди активно делятся — эмоциональная тема работает"}</p>
          </div>
        </div>
      )}

      {/* Tags + Language + Format — horizontal scroll on mobile */}
      <div className="flex flex-wrap gap-1">
        {summary?.language && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-card border border-border/50 text-foreground">
            {summary.language === "Русский" ? "🇷🇺" : summary.language === "English" ? "🇺🇸" : "🌐"} {summary.language}
          </span>
        )}
        {summary?.content_format && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/50 text-accent-foreground border border-accent/30">
            🎬 {summary.content_format}
          </span>
        )}
        {summary?.tags?.slice(0, 5).map((tag: string, i: number) => (
          <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
            {tag}
          </span>
        ))}
      </div>

      {/* Niches */}
      {summary?.niches?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {summary.niches.map((niche: string, i: number) => (
            <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-card border border-border/50 text-foreground/80">
              {niche}
            </span>
          ))}
        </div>
      )}

      {/* Why Viral */}
      {!isUnknown(summary?.why_viral) && (
        <SectionCard icon={Flame} title={isKk ? "Неге атты? 🔥" : "Почему выстрелило? 🔥"} accent>
          <p className="text-[13px] text-foreground/90 leading-relaxed">{summary.why_viral}</p>
        </SectionCard>
      )}

      {/* Emotions */}
      {summary?.emotions?.length > 0 && (
        <SectionCard icon={Zap} title={isKk ? "Эмоциялық триггерлер" : "Эмоциональные триггеры"}>
          <div className="flex flex-wrap gap-1">
            {summary.emotions.map((emotion: string, i: number) => (
              <span key={i} className="px-2 py-1 rounded-lg text-[11px] font-medium bg-card border border-border/50 text-foreground">
                {emotion}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Target Audience */}
      {!isUnknown(summary?.target_audience) && (
        <SectionCard icon={Users} title={isKk ? "Мақсатты аудитория" : "Целевая аудитория"}>
          <p className="text-[13px] text-foreground/80 leading-relaxed">{summary.target_audience}</p>
        </SectionCard>
      )}

      {/* Summary */}
      {summary?.summary && (
        <SectionCard icon={Eye} title={isKk ? "Мазмұны" : "Суть"}>
          <p className="text-[13px] text-foreground/80 leading-relaxed">{summary.summary}</p>
        </SectionCard>
      )}

      {/* Hooks */}
      {(summary?.hook_phrase || summary?.visual_hook || summary?.text_hook) && (
        <div className="space-y-1.5">
          {!isUnknown(summary?.hook_phrase) && (
            <div className="p-2.5 rounded-lg border border-border/50 bg-muted/30">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">🎣 {isKk ? "Хук фраза" : "Хук фраза"}</p>
                <button
                  onClick={copyHook}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border border-border/50"
                >
                  <Copy className="h-3 w-3" />
                  {isKk ? "Көшіру" : "Копировать"}
                </button>
              </div>
              <p className="text-[13px] font-medium text-foreground italic">"{summary.hook_phrase}"</p>
            </div>
          )}
          {!isUnknown(summary?.visual_hook) && (
            <div className="p-2.5 rounded-lg border border-border/50 bg-muted/30">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">👁 {isKk ? "Визуалды хук" : "Визуальный хук"}</p>
              <p className="text-[13px] text-foreground/80">{summary.visual_hook}</p>
            </div>
          )}
          {!isUnknown(summary?.text_hook) && (
            <div className="p-2.5 rounded-lg border border-border/50 bg-muted/30">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">📝 {isKk ? "Мәтіндік хук" : "Текстовый хук"}</p>
              <p className="text-[13px] font-medium text-foreground">"{summary.text_hook}"</p>
            </div>
          )}
        </div>
      )}

      {/* CTA Analysis */}
      {!isUnknown(summary?.cta_analysis) && (
        <SectionCard icon={Target} title={isKk ? "CTA талдауы" : "Анализ CTA"}>
          <p className="text-[13px] text-foreground/80 leading-relaxed">{summary.cta_analysis}</p>
        </SectionCard>
      )}

      {/* Structure / Timeline */}
      {summary?.structure?.length > 0 && (
        <SectionCard icon={Clock} title={isKk ? "Құрылым" : "Структура"}>
          <div className="relative pl-5 space-y-2.5">
            <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-border" />
            {summary.structure.map((seg: any, i: number) => (
              <div key={i} className="relative">
                <div className={`absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                  i === summary.structure.length - 1 ? "bg-primary border-primary" : "bg-card border-border"
                }`}>
                  {i === summary.structure.length - 1 && <div className="w-1 h-1 rounded-full bg-primary-foreground" />}
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5 min-w-[40px] font-mono">
                    {seg.time || seg.timestamp || ""}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-foreground">{seg.title || seg.name || ""}</p>
                    {seg.description && <p className="text-[10px] text-foreground/60 mt-0.5 leading-relaxed line-clamp-3">{seg.description}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Strengths & Weaknesses */}
      {(summary?.strengths?.length > 0 || summary?.weaknesses?.length > 0) && (
        <div className="grid grid-cols-1 gap-2">
          {summary?.strengths?.length > 0 && (
            <SectionCard icon={ThumbsUp} title={isKk ? "Күшті жақтар" : "Сильные стороны"}>
              <ul className="space-y-1">
                {summary.strengths.map((s: string, i: number) => (
                  <li key={i} className="text-[12px] text-foreground/80 flex items-start gap-1.5">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    <span className="line-clamp-2">{s}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
          {summary?.weaknesses?.length > 0 && (
            <SectionCard icon={ThumbsDown} title={isKk ? "Жақсарту нүктелері" : "Точки роста"}>
              <ul className="space-y-1">
                {summary.weaknesses.map((w: string, i: number) => (
                  <li key={i} className="text-[12px] text-foreground/80 flex items-start gap-1.5">
                    <span className="text-yellow-500 mt-0.5 flex-shrink-0">△</span>
                    <span className="line-clamp-2">{w}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </div>
      )}

      {/* Recommendations */}
      {summary?.recommendations?.length > 0 && (
        <SectionCard icon={Lightbulb} title={isKk ? "Ұсыныстар" : "Рекомендации"} accent>
          <ul className="space-y-1.5">
            {summary.recommendations.map((r: string, i: number) => (
              <li key={i} className="text-[12px] text-foreground/80 flex items-start gap-1.5">
                <span className="text-primary font-bold mt-0.5 flex-shrink-0">{i + 1}.</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* Funnel */}
      {summary?.funnel && (summary.funnel.direction || summary.funnel.goal) && (
        <SectionCard icon={Target} title={isKk ? "Воронка / Маркетинг" : "Воронка / Маркетинг"}>
          {summary.funnel.direction && (
            <div className="mb-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{isKk ? "Бағыты" : "Куда ведет"}</p>
              <p className="text-[13px] text-foreground/80">{summary.funnel.direction}</p>
            </div>
          )}
          {summary.funnel.goal && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{isKk ? "Мақсаты" : "Цель"}</p>
              <p className="text-[13px] text-foreground/80">{summary.funnel.goal}</p>
            </div>
          )}
        </SectionCard>
      )}

      {/* Transcription */}
      {transcript && (
        <div className="rounded-xl border border-border/50 bg-muted/30 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[13px] font-bold text-foreground">{isKk ? "Транскрипция" : "Транскрибация"}</h3>
            <button
              onClick={() => { navigator.clipboard.writeText(transcript); toast.success(isKk ? "Көшірілді!" : "Скопировано!"); }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border border-border/50"
            >
              <Copy className="h-3 w-3" />
              {isKk ? "Көшіру" : "Копировать"}
            </button>
          </div>
          <div className="max-h-32 overflow-y-auto">
            <p className="text-[11px] text-foreground/70 leading-relaxed whitespace-pre-wrap">{transcript}</p>
          </div>
        </div>
      )}

      {/* Generate Script Button - Sticky */}
      <div className="sticky bottom-2 z-10 pt-1">
        <button
          onClick={onGenerateScript}
          className="w-full py-3 rounded-xl bg-foreground text-background font-bold text-sm hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2 shadow-glow-primary"
        >
          <Sparkles className="h-4 w-4 text-viral" />
          {isKk ? "Сценарий генерациялау" : "Генерация сценария"}
        </button>
      </div>
    </div>
  );
}
