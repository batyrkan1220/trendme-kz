import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { trackViewContent } from "@/components/TrackingPixels";
import {
  Eye, Heart, MessageCircle, Share2, ExternalLink, Loader2, Sparkles, X, Target, Play,
  TrendingUp,
} from "lucide-react";
import { ScriptGenerationPanel } from "./ScriptGenerationPanel";
import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { isNativePlatform } from "@/lib/native";
import { hapticSuccess } from "@/lib/haptics";
import { VideoAnalysisResults } from "./VideoAnalysisResults";
import { analyzeVideo, type NormalizedAnalysis } from "@/lib/api/videoAnalysis";
import type { DialogVideoInput, VideoDialogProps } from "@/lib/types/dialogVideo";

type VideoData = DialogVideoInput;
type Props = VideoDialogProps;

const fmt = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
};

export function VideoAnalysisDialog({ video, open, onOpenChange }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [language, setLanguage] = useState<"ru" | "kk">("ru");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [loadingPlay, setLoadingPlay] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastAnalyzedUrl = useRef<string | null>(null);
  const preloadedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (open && video) trackViewContent(video.caption || video.url);
  }, [open, video]);

  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const { data: analysis, isPending, mutate: analyze, reset } = useMutation<
    NormalizedAnalysis, Error, { v: VideoData; lang: "ru" | "kk" }
  >({
    mutationFn: ({ v, lang }) =>
      analyzeVideo({
        url: v.url,
        platform_video_id: v.platform_video_id ?? "",
        author_username: v.author_username,
        caption: v.caption,
        language: lang,
      }),
    onSuccess: () => { setAnalysisError(null); hapticSuccess(); },
    onError: (err: Error) => {
      setAnalysisError(err.message);
      toast.error("Не удалось проанализировать: " + err.message);
    },
  });

  useEffect(() => {
    if (open && video && video.url !== lastAnalyzedUrl.current) {
      lastAnalyzedUrl.current = video.url;
      reset();
      setShowLangPicker(true);
    }
    if (!open) {
      lastAnalyzedUrl.current = null;
      setIsPlaying(false);
      setShowScript(false);
      setShowLangPicker(false);
      setPlayUrl(null);
      setLoadingPlay(false);
      preloadedUrlRef.current = null;
    }
  }, [open, video]);

  const startAnalysis = async (lang: "ru" | "kk") => {
    if (!video) return;
    setLanguage(lang);
    setShowLangPicker(false);
    analyze({ v: video, lang });
  };

  const handlePlay = useCallback(async () => {
    if (!video) return;
    setIsPlaying(true);
    if (preloadedUrlRef.current) { setPlayUrl(preloadedUrlRef.current); return; }
    setLoadingPlay(true);
    try {
      const { resolvePlayback } = await import("@/lib/api/videoPlayback");
      const { value } = await resolvePlayback(video.url);
      setPlayUrl(value);
    } finally { setLoadingPlay(false); }
  }, [video]);

  if (!video) return null;

  const views = Number(video.views || 0);
  const likes = Number(video.likes || 0);
  const commentsCount = Number(video.comments || 0);
  const shares = Number(video.shares || 0);
  const er = views > 0 ? ((likes + commentsCount + shares) / views * 100).toFixed(2) : "0";

  const publishedDate = video.published_at
    ? new Date(video.published_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  const summary = analysis?.summary ?? null;
  const transcript = analysis?.transcript ?? "";

  // ─────────────────────────────────────────────────────────
  // VIDEO PLAYER block — reused desktop & mobile
  const VideoPlayer = ({ className = "" }: { className?: string }) => (
    <div className={`aspect-[9/16] bg-black relative overflow-hidden ${className}`}>
      {isPlaying ? (
        <>
          {loadingPlay ? (
            <div className="w-full h-full flex items-center justify-center bg-black">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          ) : playUrl === "instagram_embed" ? (
            <iframe
              src={`https://www.instagram.com/reel/${video.platform_video_id}/embed/`}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : playUrl === "tiktok_embed_fallback" ? (
            <iframe
              src={`https://www.tiktok.com/player/v1/${video.platform_video_id}?music_info=1&description=0&muted=0&play_button=1&volume_control=1`}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
            />
          ) : playUrl ? (
            <video ref={videoRef} src={playUrl} className="w-full h-full object-contain bg-black" controls autoPlay playsInline />
          ) : (
            <iframe
              src={`https://www.tiktok.com/player/v1/${video.platform_video_id}?music_info=1&description=0&muted=0&play_button=1&volume_control=1`}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
            />
          )}
          <button
            onClick={() => { setIsPlaying(false); setPlayUrl(null); }}
            className="absolute top-2 right-2 z-20 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
            aria-label="Закрыть видео"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      ) : video.cover_url ? (
        <button onClick={handlePlay} className="relative w-full h-full cursor-pointer group block">
          <img src={video.cover_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/35 transition-colors">
            <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
              <Play className="h-7 w-7 text-foreground ml-1" fill="currentColor" />
            </div>
          </div>
        </button>
      ) : (
        <button onClick={handlePlay} className="w-full h-full flex items-center justify-center cursor-pointer">
          <Play className="h-12 w-12 text-muted-foreground/30" />
        </button>
      )}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-5xl p-0 gap-0 border-l border-border/50 overflow-hidden [&>button]:hidden"
        aria-describedby={undefined}
        style={{ zIndex: 99998 }}
      >
        <SheetTitle className="sr-only">Анализ видео</SheetTitle>
        {showScript ? (
          <ScriptGenerationPanel
            transcript={transcript}
            summary={summary}
            caption={video.caption || ""}
            language={language}
            videoUrl={video.url}
            coverUrl={video.cover_url}
            onBack={() => setShowScript(false)}
          />
        ) : (
          <div className="flex flex-col md:flex-row h-full">
            {/* ═════════ MOBILE HEADER (<md) ═════════ */}
            <header
              className="flex md:hidden items-center gap-3 px-4 py-3 border-b border-border/60 shrink-0"
              style={{
                paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)",
                background: "hsl(var(--background) / 0.88)",
                backdropFilter: "blur(20px) saturate(1.2)",
                WebkitBackdropFilter: "blur(20px) saturate(1.2)",
              }}
            >
              {video.cover_url && (
                <button
                  onClick={handlePlay}
                  className="relative w-11 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-soft border border-border/60 group"
                >
                  <img src={video.cover_url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition-colors">
                    <Play className="h-3.5 w-3.5 text-white" fill="currentColor" />
                  </div>
                </button>
              )}
              <div className="flex-1 min-w-0">
                {video.author_username && (
                  <span className="text-[13px] font-semibold text-foreground block truncate mb-1 tracking-tight">
                    @{video.author_username}
                  </span>
                )}
                <div className="flex items-center gap-3 text-[11.5px] text-muted-foreground tabular-nums">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <b className="text-foreground/85 font-semibold">{fmt(views)}</b>
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    <b className="text-foreground/85 font-semibold">{fmt(likes)}</b>
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    <b className="text-foreground/85 font-semibold">{fmt(commentsCount)}</b>
                  </span>
                  <span className="flex items-center gap-1 hidden xs:inline-flex">
                    <TrendingUp className="h-3 w-3" />
                    <b className="text-foreground/85 font-semibold">{er}%</b>
                  </span>
                </div>
              </div>
              <button
                onClick={() => window.open(video.url, "_blank")}
                className="h-9 w-9 rounded-full border border-border bg-background hover:bg-muted flex items-center justify-center transition-colors active:scale-95 shrink-0"
                aria-label="Открыть оригинал"
              >
                <ExternalLink className="h-3.5 w-3.5 text-foreground/70" />
              </button>
              <button
                onClick={() => onOpenChange(false)}
                className="h-9 w-9 rounded-full border border-border bg-background hover:bg-muted flex items-center justify-center transition-colors active:scale-95 shrink-0"
                aria-label="Закрыть"
              >
                <X className="h-4 w-4 text-foreground/70" />
              </button>
            </header>

            {/* ═════════ DESKTOP VIDEO + META SIDEBAR (md+) ═════════ */}
            <aside className="hidden md:flex md:w-[320px] lg:w-[360px] flex-shrink-0 border-r border-border/50 overflow-y-auto bg-card flex-col">
              <div className="p-3">
                <VideoPlayer className="rounded-2xl border border-border/50" />
              </div>

              <div className="px-4 pt-1 pb-3">
                <div className="flex items-center gap-2.5">
                  {video.author_avatar_url ? (
                    <img src={video.author_avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border border-border/60" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-bold text-foreground truncate tracking-tight">
                      @{video.author_username}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{publishedDate}</p>
                  </div>
                  <button
                    onClick={() => window.open(video.url, "_blank")}
                    className="h-8 w-8 rounded-full border border-border bg-background hover:bg-muted flex items-center justify-center transition-colors"
                    title="Открыть в соцсети"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-foreground/70" />
                  </button>
                </div>
              </div>

              {/* Desktop stat rows */}
              <div className="px-4 pb-4 space-y-1">
                {[
                  { icon: Eye, label: "Просмотры", value: fmt(views) },
                  { icon: Heart, label: "Лайки", value: fmt(likes) },
                  { icon: MessageCircle, label: "Комментарии", value: fmt(commentsCount) },
                  { icon: Share2, label: "Репосты", value: fmt(shares) },
                  { icon: TrendingUp, label: "Engagement Rate", value: er + "%", accent: true },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={`flex items-center justify-between py-2.5 px-2.5 rounded-lg ${
                      s.accent ? "bg-viral/10 border border-viral/30" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <s.icon className={`h-3.5 w-3.5 ${s.accent ? "text-foreground" : "text-muted-foreground"}`} />
                      <span className={`text-[12.5px] ${s.accent ? "text-foreground font-semibold" : "text-foreground/80"}`}>
                        {s.label}
                      </span>
                    </div>
                    <span className="text-[13.5px] font-bold text-foreground tabular-nums">{s.value}</span>
                  </div>
                ))}
              </div>

              {video.caption && (
                <div className="px-4 pb-4 mt-auto">
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Подпись
                    </p>
                    <p className="text-[11.5px] text-foreground/75 leading-relaxed line-clamp-6">
                      {video.caption}
                    </p>
                  </div>
                </div>
              )}
            </aside>

            {/* ═════════ ANALYSIS PANEL ═════════ */}
            <div className="flex-1 flex flex-col overflow-hidden bg-background relative">
              {/* Fixed close button — desktop only, mobile has it in header */}
              <button
                onClick={() => onOpenChange(false)}
                className="hidden md:flex absolute top-4 right-4 z-[70] h-9 w-9 rounded-full border border-border bg-background/90 backdrop-blur-md hover:bg-muted shadow-soft items-center justify-center transition-colors active:scale-95"
                aria-label="Закрыть"
              >
                <X className="h-4 w-4 text-foreground/70" strokeWidth={2} />
              </button>

              <div className="flex-1 overflow-y-auto">
                {showLangPicker ? (
                  <LanguagePicker video={video} onPick={startAnalysis} />
                ) : isPending ? (
                  <LoadingState />
                ) : analysis ? (
                  <div className="p-4 md:p-6 animate-fade-in">
                    <VideoAnalysisResults
                      summary={summary}
                      transcript={transcript}
                      stats={{
                        duration: 0,
                        caption: video.caption,
                        channelName: video.author_username,
                        author: { uniqueId: video.author_username, avatarThumb: video.author_avatar_url },
                      }}
                      views={views}
                      likes={likes}
                      commentsCount={commentsCount}
                      shares={shares}
                      er={er}
                      language={language}
                      onGenerateScript={() => setShowScript(true)}
                    />
                  </div>
                ) : (
                  <ErrorState
                    error={analysisError}
                    onRetry={() => { setAnalysisError(null); setShowLangPicker(true); }}
                  />
                )}
              </div>

              {/* ═════════ Sticky CTA — viral bottom bar ═════════ */}
              {analysis && !isPending && (
                <div
                  className="shrink-0 px-3 md:px-5 pt-3 pb-3 md:pb-4 border-t border-border/60 bg-background/85 backdrop-blur-xl"
                  style={{ paddingBottom: isNativePlatform ? "calc(env(safe-area-inset-bottom, 0px) + 12px)" : undefined }}
                >
                  <button
                    onClick={() => setShowScript(true)}
                    className="w-full h-13 py-3.5 rounded-xl bg-viral text-viral-foreground font-bold text-[15px] md:text-[16px] shadow-glow-viral hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 ring-1 ring-foreground/10"
                  >
                    <Sparkles className="h-4 w-4" />
                    Сгенерировать сценарий
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─────────────────────── Sub-components ───────────────────────
function LanguagePicker({ video, onPick }: { video: any; onPick: (l: "ru" | "kk") => void }) {
  return (
    <div className="flex flex-col h-full bg-background md:[background-image:var(--gradient-mesh)]">
      <div
        className="flex items-center justify-between px-5 py-3 border-b border-border/60 shrink-0"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
          background: "hsl(var(--background) / 0.85)",
          backdropFilter: "blur(20px) saturate(1.2)",
          WebkitBackdropFilter: "blur(20px) saturate(1.2)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-viral/15 ring-1 ring-viral/30 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-foreground" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground leading-none mb-0.5">
              AI Анализ
            </p>
            <h2 className="text-[16px] font-bold text-foreground leading-none tracking-tight">
              Анализ видео
            </h2>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-6 animate-fade-in">
        <div className="w-full max-w-sm flex flex-col items-center gap-6">
          {video.cover_url && (
            <div className="relative w-28 h-36 rounded-2xl overflow-hidden shadow-card border border-border/60">
              <img src={video.cover_url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          )}

          <div className="text-center space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Шаг 1 / 2 — Выбор языка
            </p>
            <h3 className="text-[22px] md:text-[24px] font-bold text-foreground tracking-tight leading-tight">
              На каком языке анализировать?
            </h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              AI проанализирует контент, тему, тэги, эмоции и даст рекомендации
            </p>
          </div>

          <div className="flex flex-col gap-2.5 w-full">
            <button
              onClick={() => onPick("ru")}
              className="w-full h-13 bg-viral text-viral-foreground hover:brightness-105 rounded-xl font-bold text-[15px] shadow-glow-viral transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2"
            >
              <span className="text-lg">🇷🇺</span> Русский язык
            </button>
            <button
              onClick={() => onPick("kk")}
              className="w-full h-13 bg-card border border-border hover:border-foreground/20 hover:bg-muted/50 text-foreground rounded-xl font-bold text-[15px] shadow-soft transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2"
            >
              <span className="text-lg">🇰🇿</span> Қазақ тілі
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-viral" />
              1–2 мин
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-viral" />
              20+ метрик
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-viral" />
              AI-советы
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  const steps = [
    "Загружаем видео...",
    "Транскрибируем аудио...",
    "Анализируем хуки и CTA...",
    "Считаем метрики вирусности...",
  ];
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 animate-fade-in">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <div className="relative">
          <span className="absolute inset-0 rounded-2xl bg-viral/50 blur-2xl -z-10 animate-viral-pulse" />
          <div className="w-24 h-24 rounded-2xl bg-viral flex items-center justify-center shadow-glow-viral animate-scale-in ring-1 ring-foreground/10">
            <Sparkles className="h-10 w-10 text-viral-foreground animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-foreground font-bold text-[17px] tracking-tight">
            Анализируем видео
          </p>
          <p className="text-[13px] text-muted-foreground">
            Обычно занимает 1–2 минуты
          </p>
        </div>
        <div className="w-full space-y-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-card border border-border/50"
              style={{ animation: `fade-in 400ms ease-out ${i * 180}ms both` }}
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin text-viral" />
              <span className="text-[12.5px] text-foreground/80">{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
        <Sparkles className="h-7 w-7 text-muted-foreground/40" />
      </div>
      <div className="text-center space-y-1.5 max-w-xs">
        <p className="text-[15px] font-bold text-foreground">
          {error ? "Не удалось проанализировать" : "Анализ ещё не запущен"}
        </p>
        {error && (
          <p className="text-[12px] text-destructive/80 leading-relaxed">{error}</p>
        )}
      </div>
      <button
        onClick={onRetry}
        className="px-6 h-12 rounded-xl bg-viral text-viral-foreground font-bold text-[14px] shadow-glow-viral hover:brightness-105 transition-all active:scale-95 flex items-center gap-2"
      >
        <Sparkles className="h-4 w-4" />
        {error ? "Попробовать снова" : "Запустить анализ"}
      </button>
    </div>
  );
}
