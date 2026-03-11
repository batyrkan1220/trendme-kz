import { Clock, Copy, Sparkles, Flame, Target, Users, Zap, TrendingUp, ThumbsUp, ThumbsDown, Lightbulb, MessageCircle, Eye, Heart, Share2 } from "lucide-react";
import { toast } from "sonner";

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
  <div className={`rounded-xl border p-4 ${accent ? "border-primary/30 bg-primary/5" : "border-border/50 bg-muted/30"}`}>
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />}
      <h3 className={`text-sm font-bold ${accent ? "text-primary" : "text-foreground"}`}>{title}</h3>
    </div>
    {children}
  </div>
);

const StatMini = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) => (
  <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-card border border-border/30">
    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
    <span className="text-xs font-bold text-foreground">{value}</span>
    <span className="text-[10px] text-muted-foreground">{label}</span>
  </div>
);

const fmt = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
};

export function VideoAnalysisResults({
  summary, transcript, stats, views, likes, commentsCount, shares, er, onGenerateScript, language
}: AnalysisResultsProps) {
  const isKk = language === "kk";

  return (
    <div className="space-y-3">
      {/* Topic + Virality Score */}
      {summary?.topic && (
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              {isKk ? "Тақырып" : "Тема"}
            </p>
            <h2 className="text-lg md:text-xl font-bold text-foreground leading-tight">{summary.topic}</h2>
          </div>
          {summary?.virality_score != null && (
            <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
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
      )}

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-5 gap-1.5">
        <StatMini icon={Eye} label={isKk ? "Көру" : "Просм"} value={fmt(views)} />
        <StatMini icon={Heart} label={isKk ? "Лайк" : "Лайки"} value={fmt(likes)} />
        <StatMini icon={MessageCircle} label={isKk ? "Пікір" : "Комм"} value={fmt(commentsCount)} />
        <StatMini icon={Share2} label={isKk ? "Бөлісу" : "Репост"} value={fmt(shares)} />
        <StatMini icon={TrendingUp} label="ER" value={er + "%"} />
      </div>

      {/* Tags + Language + Format */}
      <div className="flex flex-wrap gap-1.5">
        {summary?.language && (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-card border border-border/50 text-foreground">
            {summary.language === "Русский" ? "🇷🇺" : summary.language === "English" ? "🇺🇸" : "🌐"} {summary.language}
          </span>
        )}
        {summary?.content_format && (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-accent/50 text-accent-foreground border border-accent/30">
            🎬 {summary.content_format}
          </span>
        )}
        {summary?.tags?.map((tag: string, i: number) => (
          <span key={i} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
            {tag}
          </span>
        ))}
      </div>

      {/* Niches */}
      {summary?.niches?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {summary.niches.map((niche: string, i: number) => (
            <span key={i} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-card border border-border/50 text-foreground/80">
              {niche}
            </span>
          ))}
        </div>
      )}

      {/* Why Viral - HIGHLIGHT SECTION */}
      {summary?.why_viral && summary.why_viral !== "белгісіз" && summary.why_viral !== "неизвестно" && (
        <SectionCard icon={Flame} title={isKk ? "Неге атты? 🔥" : "Почему выстрелило? 🔥"} accent>
          <p className="text-sm text-foreground/90 leading-relaxed">{summary.why_viral}</p>
        </SectionCard>
      )}

      {/* Emotions */}
      {summary?.emotions?.length > 0 && (
        <SectionCard icon={Zap} title={isKk ? "Эмоциялық триггерлер" : "Эмоциональные триггеры"}>
          <div className="flex flex-wrap gap-1.5">
            {summary.emotions.map((emotion: string, i: number) => (
              <span key={i} className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-card border border-border/50 text-foreground">
                {emotion}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Target Audience */}
      {summary?.target_audience && summary.target_audience !== "белгісіз" && summary.target_audience !== "неизвестно" && (
        <SectionCard icon={Users} title={isKk ? "Мақсатты аудитория" : "Целевая аудитория"}>
          <p className="text-sm text-foreground/80 leading-relaxed">{summary.target_audience}</p>
        </SectionCard>
      )}

      {/* Summary / Суть */}
      {summary?.summary && (
        <SectionCard icon={Eye} title={isKk ? "Мазмұны" : "Суть"}>
          <p className="text-sm text-foreground/80 leading-relaxed">{summary.summary}</p>
        </SectionCard>
      )}

      {/* Hooks - Compact Grid */}
      {(summary?.hook_phrase || summary?.visual_hook || summary?.text_hook) && (
        <div className="grid grid-cols-1 gap-2">
          {summary?.hook_phrase && summary.hook_phrase !== "белгісіз" && summary.hook_phrase !== "неизвестно" && (
            <div className="p-3 rounded-lg border border-border/50 bg-muted/30">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                🎣 {isKk ? "Хук фраза" : "Хук фраза"}
              </p>
              <p className="text-sm font-medium text-foreground italic">"{summary.hook_phrase}"</p>
            </div>
          )}
          {summary?.visual_hook && summary.visual_hook !== "белгісіз" && summary.visual_hook !== "неизвестно" && (
            <div className="p-3 rounded-lg border border-border/50 bg-muted/30">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                👁 {isKk ? "Визуалды хук" : "Визуальный хук"}
              </p>
              <p className="text-sm text-foreground/80">{summary.visual_hook}</p>
            </div>
          )}
          {summary?.text_hook && summary.text_hook !== "белгісіз" && summary.text_hook !== "неизвестно" && (
            <div className="p-3 rounded-lg border border-border/50 bg-muted/30">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                📝 {isKk ? "Мәтіндік хук" : "Текстовый хук"}
              </p>
              <p className="text-sm font-medium text-foreground">"{summary.text_hook}"</p>
            </div>
          )}
        </div>
      )}

      {/* CTA Analysis */}
      {summary?.cta_analysis && summary.cta_analysis !== "белгісіз" && summary.cta_analysis !== "неизвестно" && (
        <SectionCard icon={Target} title={isKk ? "CTA талдауы" : "Анализ CTA"}>
          <p className="text-sm text-foreground/80 leading-relaxed">{summary.cta_analysis}</p>
        </SectionCard>
      )}

      {/* Structure / Timeline */}
      {summary?.structure?.length > 0 && (
        <SectionCard icon={Clock} title={isKk ? "Құрылым" : "Структура"}>
          <div className="relative pl-6 space-y-3">
            <div className="absolute left-[9px] top-1 bottom-1 w-0.5 bg-border" />
            {summary.structure.map((seg: any, i: number) => (
              <div key={i} className="relative">
                <div className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  i === summary.structure.length - 1 ? "bg-primary border-primary" : "bg-card border-border"
                }`}>
                  {i === summary.structure.length - 1 && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5 min-w-[50px] font-mono">
                    {seg.time || seg.timestamp || ""}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-foreground">{seg.title || seg.name || ""}</p>
                    {seg.description && <p className="text-[11px] text-foreground/60 mt-0.5 leading-relaxed">{seg.description}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Strengths & Weaknesses */}
      {(summary?.strengths?.length > 0 || summary?.weaknesses?.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {summary?.strengths?.length > 0 && (
            <SectionCard icon={ThumbsUp} title={isKk ? "Күшті жақтар" : "Сильные стороны"}>
              <ul className="space-y-1.5">
                {summary.strengths.map((s: string, i: number) => (
                  <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
          {summary?.weaknesses?.length > 0 && (
            <SectionCard icon={ThumbsDown} title={isKk ? "Жақсарту нүктелері" : "Точки роста"}>
              <ul className="space-y-1.5">
                {summary.weaknesses.map((w: string, i: number) => (
                  <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                    <span className="text-yellow-500 mt-0.5 flex-shrink-0">△</span>
                    {w}
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
          <ul className="space-y-2">
            {summary.recommendations.map((r: string, i: number) => (
              <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5 flex-shrink-0">{i + 1}.</span>
                {r}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* Funnel */}
      {summary?.funnel && (summary.funnel.direction || summary.funnel.goal) && (
        <SectionCard icon={Target} title={isKk ? "Воронка / Маркетинг" : "Воронка / Маркетинг"}>
          {summary.funnel.direction && (
            <div className="mb-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{isKk ? "Бағыты" : "Куда ведет"}</p>
              <p className="text-sm text-foreground/80">{summary.funnel.direction}</p>
            </div>
          )}
          {summary.funnel.goal && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{isKk ? "Мақсаты" : "Цель"}</p>
              <p className="text-sm text-foreground/80">{summary.funnel.goal}</p>
            </div>
          )}
        </SectionCard>
      )}

      {/* Transcription */}
      {transcript && (
        <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-foreground">{isKk ? "Транскрипция" : "Транскрибация"}</h3>
            <button
              onClick={() => { navigator.clipboard.writeText(transcript); toast.success(isKk ? "Көшірілді!" : "Скопировано!"); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border border-border/50"
            >
              <Copy className="h-3 w-3" />
              {isKk ? "Көшіру" : "Копировать"}
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto">
            <p className="text-xs text-foreground/70 leading-relaxed whitespace-pre-wrap">{transcript}</p>
          </div>
        </div>
      )}

      {/* Generate Script Button - Sticky */}
      <button
        onClick={onGenerateScript}
        className="w-full py-3.5 rounded-xl gradient-hero text-primary-foreground font-bold text-sm glow-primary hover:opacity-90 transition-opacity flex items-center justify-center gap-2 sticky bottom-3 z-10"
      >
        <Sparkles className="h-4 w-4" />
        {isKk ? "Сценарий генерациялау" : "Генерация сценария"}
      </button>
    </div>
  );
}
