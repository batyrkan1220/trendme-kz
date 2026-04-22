import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { trackViewContent } from "@/components/TrackingPixels";
import { Eye, Heart, MessageCircle, Share2, ExternalLink, Clock, Loader2, Sparkles, X, Target, Copy, Play } from "lucide-react";
import { ScriptGenerationPanel } from "./ScriptGenerationPanel";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { isNativePlatform } from "@/lib/native";
import { MagicAnalysisLoader } from "./MagicAnalysisLoader";
import { hapticSuccess } from "@/lib/haptics";
import { VideoAnalysisResults } from "./VideoAnalysisResults";

interface VideoData {
  id: string;
  url: string;
  cover_url?: string | null;
  platform_video_id: string;
  author_username?: string | null;
  author_avatar_url?: string | null;
  author_display_name?: string | null;
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  published_at?: string | null;
  caption?: string | null;
}

interface Props {
  video: VideoData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
    if (open && video) {
      trackViewContent(video.caption || video.url);
      // Preload removed to save EnsembleData credits
      // play_url will be fetched on-demand when user clicks Play
    }
  }, [open, video]);

  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const { data: analysis, isPending, mutate: analyze, reset } = useMutation({
    mutationFn: async ({ v, lang }: { v: VideoData; lang: "ru" | "kk" }) => {
      const { data, error } = await supabase.functions.invoke("socialkit", {
        body: {
          action: "analyze_video",
          video_url: v.url,
          platform_video_id: v.platform_video_id,
          author_username: v.author_username || "",
          caption: v.caption || "",
          language: lang,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setAnalysisError(null);
      hapticSuccess();
    },
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

    // Use preloaded URL if available
    if (preloadedUrlRef.current) {
      setPlayUrl(preloadedUrlRef.current);
      return;
    }

    setLoadingPlay(true);
    try {
      // Use the shared deduped fetch from VideoCard to avoid duplicate API calls
      const { fetchPlayUrlDeduped } = await import("./VideoCard");
      const url = await fetchPlayUrlDeduped(video.url);
      if (!url) {
        console.error("Failed to get play URL");
        setPlayUrl(null);
      } else {
        setPlayUrl(url);
      }
    } catch (e) {
      console.error("Play URL fetch error:", e);
      setPlayUrl(null);
    } finally {
      setLoadingPlay(false);
    }
  }, [video]);

  if (!video) return null;

  const views = Number(video.views || 0);
  const likes = Number(video.likes || 0);
  const commentsCount = Number(video.comments || 0);
  const shares = Number(video.shares || 0);
  const er = views > 0 ? ((likes + commentsCount + shares) / views * 100).toFixed(2) : "0";

  const publishedDate = video.published_at
    ? new Date(video.published_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "";

  // Parse summary_json
  const rawSummary = analysis?.summary_json;
  const summary = typeof rawSummary === "string"
    ? (() => { try { return JSON.parse(rawSummary); } catch { return null; } })()
    : rawSummary;

  // Parse transcript
  let transcript = analysis?.transcript_text || "";
  if (typeof transcript !== "string") {
    try { transcript = JSON.stringify(transcript); } catch { transcript = ""; }
  }
  // Clean up transcript if it's still JSON-like
  if (transcript.startsWith("{") || transcript.startsWith("[")) {
    try {
      const parsed = JSON.parse(transcript);
      transcript = parsed?.transcript || parsed?.text || parsed?.data?.transcript || transcript;
    } catch { /* keep as is */ }
  }

  const isUnknownValue = (value: unknown) => {
    if (typeof value !== "string") return false;
    const normalized = value.trim().toLowerCase();
    return ["белгісіз", "неизвестно", "unknown", "n/a", "жоқ", "нет", "-"].includes(normalized);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-4xl p-0 gap-0 border-l border-border/50 overflow-hidden [&>button]:hidden" aria-describedby={undefined} style={{ zIndex: 99998 }}>
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
          {/* Mobile: compact stats bar only (no video) */}
          <div className="flex md:hidden items-center gap-3 p-3 border-b border-border bg-card/95 backdrop-blur-xl" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}>
            {video.cover_url && (
              <img src={video.cover_url} alt="" className="w-11 h-14 rounded-lg object-cover flex-shrink-0 shadow-soft" />
            )}
            <div className="flex-1 min-w-0">
              {video.author_username && (
                <span className="text-xs font-semibold text-primary block truncate mb-1">@{video.author_username}</span>
              )}
              <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[11px] text-foreground/80">
                <span className="flex items-center gap-1"><Eye className="h-3 w-3 text-muted-foreground" /><b className="text-foreground">{fmt(views)}</b></span>
                <span className="flex items-center gap-1"><Heart className="h-3 w-3 text-rose-500" /><b className="text-foreground">{fmt(likes)}</b></span>
                <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3 text-muted-foreground" /><b className="text-foreground">{fmt(commentsCount)}</b></span>
                <span className="flex items-center gap-1"><Target className="h-3 w-3 text-muted-foreground" />ER <b className="text-foreground">{er}%</b></span>
              </div>
            </div>
            <button
              onClick={() => window.open(video.url, "_blank")}
              className="text-muted-foreground hover:text-foreground flex-shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label="Открыть в TikTok"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>

          {/* Desktop: full video + stats sidebar */}
          <div className="hidden md:flex md:w-[280px] flex-shrink-0 border-r border-border/50 overflow-y-auto bg-card flex-col">
            <div className="aspect-[9/16] bg-black relative rounded-2xl overflow-hidden m-2">
              {isPlaying ? (
                <>
                  {loadingPlay ? (
                    <div className="w-full h-full flex items-center justify-center bg-black">
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                  ) : playUrl ? (
                    <video
                      ref={videoRef}
                      src={playUrl}
                      className="w-full h-full object-contain bg-black"
                      controls
                      autoPlay
                      playsInline
                    />
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
                <div className="relative w-full h-full cursor-pointer group" onClick={handlePlay}>
                  <img src={video.cover_url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="h-6 w-6 text-foreground ml-1" fill="currentColor" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center cursor-pointer" onClick={handlePlay}>
                  <Play className="h-12 w-12 text-muted-foreground/30" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-4 pt-3">
              <span className="text-sm text-muted-foreground">{publishedDate}</span>
              <div className="flex items-center gap-2">
                <button className="text-primary hover:scale-110 transition-transform">
                  <Heart className="h-5 w-5" />
                </button>
                <button
                  onClick={() => window.open(video.url, "_blank")}
                  className="text-muted-foreground hover:text-foreground hover:scale-110 transition-transform"
                >
                  <ExternalLink className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3">
              {video.author_avatar_url ? (
                <img src={video.author_avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-border/50" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted" />
              )}
              <span className="text-sm font-semibold text-primary truncate">@{video.author_username}</span>
            </div>

            <div className="px-4 pb-4 space-y-1">
              {[
                { icon: Eye, label: "Просмотры", value: fmt(views) },
                { icon: Heart, label: "Лайки", value: fmt(likes), color: "text-primary" },
                { icon: MessageCircle, label: "Комментарии", value: fmt(commentsCount), color: "text-primary/70" },
                { icon: Share2, label: "Репосты", value: fmt(shares), color: "text-primary/70" },
                { icon: Target, label: "ER", value: er },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <s.icon className={`h-4 w-4 ${s.color || "text-muted-foreground"}`} />
                    <span className="text-sm text-foreground">{s.label}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel — analysis + sticky button */}
          <div className="flex-1 flex flex-col overflow-hidden bg-background relative">
            {/* Fixed close button - always visible */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 md:top-6 md:right-6 z-[70] w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5 text-foreground" />
            </button>
          <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-4 md:pb-6 space-y-4 md:space-y-6 relative">
            {showLangPicker ? (
              <div className="flex flex-col h-full bg-background-subtle -m-3 md:-m-6">
                {/* Header */}
                <div
                  className="flex items-center justify-between px-4 py-3 border-b border-border bg-card"
                  style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary leading-none mb-0.5">
                        AI Анализ
                      </p>
                      <h2 className="text-sm font-bold text-foreground leading-none">
                        Анализ видео
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenChange(false)}
                    className="text-xs text-muted-foreground hover:text-foreground font-semibold px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    Закрыть
                  </button>
                </div>

                {/* Language picker */}
                <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 animate-fade-in">
                  <div className="w-full max-w-sm flex flex-col items-center gap-5">
                    {video.cover_url && (
                      <div className="w-24 h-32 rounded-2xl overflow-hidden shadow-card border border-border">
                        <img src={video.cover_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="text-center space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                        Шаг 1 / 2
                      </p>
                      <h3 className="text-xl font-bold text-foreground tracking-tight">
                        Выберите язык анализа
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Тілді таңдаңыз — AI бірден видеоны талдай бастайды
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                      <button
                        onClick={() => startAnalysis("kk")}
                        className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-semibold text-sm shadow-soft transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2"
                      >
                        🇰🇿 Қазақша
                      </button>
                      <button
                        onClick={() => startAnalysis("ru")}
                        className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary-hover rounded-xl font-semibold text-sm shadow-glow-primary transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2"
                      >
                        🇷🇺 Русский
                      </button>
                    </div>

                    <p className="text-[11px] text-muted-foreground text-center">
                      После выбора языка AI глубоко проанализирует контент, тему, тэги и эффективность
                    </p>
                  </div>
                </div>
              </div>
            ) : isPending ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 animate-fade-in">
                <div className="w-full max-w-lg flex flex-col items-center gap-5">
                  <div className="relative">
                    <span className="absolute inset-0 rounded-2xl bg-viral/40 blur-2xl -z-10" />
                    <div className="w-20 h-20 rounded-2xl bg-viral flex items-center justify-center shadow-glow-primary animate-scale-in ring-1 ring-white/20">
                      <Sparkles className="h-9 w-9 text-foreground animate-pulse" />
                    </div>
                  </div>
                  <p className="text-muted-foreground font-medium text-center text-sm md:text-base animate-fade-in">
                    Анализируем видео...<br />
                    Это займёт 1–2 минуты
                  </p>
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              </div>
            ) : analysis ? (
              <div className="animate-magic-reveal">
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
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Sparkles className="h-10 w-10 text-muted-foreground/20" />
                <p className="text-muted-foreground text-sm">
                  {analysisError ? "Произошла ошибка при анализе" : "Анализ ещё не выполнен"}
                </p>
                {analysisError && (
                  <p className="text-xs text-destructive/70 max-w-xs text-center">{analysisError}</p>
                )}
                <div className="flex flex-col items-center gap-2">
                  {analysisError ? (
                    <button
                      onClick={() => {
                        setAnalysisError(null);
                        setShowLangPicker(true);
                      }}
                      className="px-6 py-3 rounded-xl gradient-hero text-primary-foreground font-semibold text-sm glow-primary hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Попробовать заново
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowLangPicker(true)}
                      className="px-6 py-3 rounded-xl gradient-hero text-primary-foreground font-semibold text-sm glow-primary hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Анализировать
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Scrollable area end */}
          </div>

          {/* Sticky bottom button - only after analysis */}
          {analysis && !isPending && (
            <div className="shrink-0 p-3 md:p-4 border-t border-border/50 bg-background" style={{ paddingBottom: isNativePlatform ? "calc(env(safe-area-inset-bottom, 0px) + 12px)" : undefined }}>
              <button
                onClick={() => setShowScript(true)}
                className="w-full py-4 rounded-xl gradient-hero text-primary-foreground font-bold text-base glow-primary hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Sparkles className="h-5 w-5" />
                Генерация сценария
              </button>
            </div>
          )}

          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
