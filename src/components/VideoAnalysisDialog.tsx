import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { trackViewContent } from "@/components/TrackingPixels";
import { Eye, Heart, MessageCircle, Share2, ExternalLink, Clock, Loader2, Sparkles, X, Target, Copy, Play } from "lucide-react";
import { ScriptGenerationPanel } from "./ScriptGenerationPanel";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { isNativePlatform } from "@/lib/native";

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
  const { checkAndLog } = useSubscription();

  useEffect(() => {
    if (open && video) {
      trackViewContent(video.caption || video.url);
      // Preload removed to save EnsembleData credits
      // play_url will be fetched on-demand when user clicks Play
    }
  }, [open, video]);

  const { data: analysis, isPending, mutate: analyze, reset } = useMutation({
    mutationFn: async ({ v, lang }: { v: VideoData; lang: "ru" | "kk" }) => {
      const { data, error } = await supabase.functions.invoke("socialkit", {
        body: { action: "analyze_video", video_url: v.url, caption: v.caption || "", language: lang },
      });
      if (error) throw error;
      return data;
    },
    onError: (err: Error) => {
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
    const ok = await checkAndLog("video_analysis", `Анализ видео: ${video.url}`);
    if (!ok) return;
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
          <div className="flex md:hidden items-center gap-3 p-3 border-b border-border/50 bg-card" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}>
            {video.cover_url && (
              <img src={video.cover_url} alt="" className="w-12 h-16 rounded-lg object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              {video.author_username && (
                <span className="text-xs font-semibold text-primary block truncate mb-1">@{video.author_username}</span>
              )}
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                <span className="flex items-center gap-1"><Eye className="h-3 w-3 text-muted-foreground" /><b>{fmt(views)}</b></span>
                <span className="flex items-center gap-1"><Heart className="h-3 w-3 text-primary" /><b>{fmt(likes)}</b></span>
                <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3 text-primary/70" /><b>{fmt(commentsCount)}</b></span>
                <span className="flex items-center gap-1"><Share2 className="h-3 w-3 text-primary/70" /><b>{fmt(shares)}</b></span>
                <span className="flex items-center gap-1"><Target className="h-3 w-3 text-muted-foreground" />ER <b>{er}%</b></span>
              </div>
            </div>
            <button
              onClick={() => window.open(video.url, "_blank")}
              className="text-muted-foreground flex-shrink-0"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>

          {/* Desktop: full video + stats sidebar */}
          <div className="hidden md:flex md:w-[280px] flex-shrink-0 border-r border-border/50 overflow-y-auto bg-card flex-col">
            <div className="aspect-[9/14] bg-black relative rounded-2xl overflow-hidden m-2">
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

          {/* Right panel — analysis */}
          <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-28 md:pb-6 space-y-4 md:space-y-6 bg-background relative">
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 md:top-6 md:right-6 z-[70] w-10 h-10 rounded-full bg-background border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5 text-foreground" />
            </button>
            {showLangPicker ? (
              <div className="flex flex-col items-center justify-center py-10 md:py-20 gap-5">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl gradient-hero flex items-center justify-center glow-primary">
                  <Sparkles className="h-7 w-7 md:h-8 md:w-8 text-primary-foreground" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-base font-bold text-foreground">Тілді таңдаңыз / Выберите язык</p>
                  <p className="text-sm text-muted-foreground">Анализ будет на выбранном языке</p>
                </div>
                <div className="flex gap-3 w-full max-w-xs">
                  <button
                    onClick={() => startAnalysis("kk")}
                    className="flex-1 px-4 py-3 rounded-xl gradient-hero text-primary-foreground font-semibold text-sm glow-primary hover:opacity-90 transition-opacity"
                  >
                    🇰🇿 Қазақ тілі
                  </button>
                  <button
                    onClick={() => startAnalysis("ru")}
                    className="flex-1 px-4 py-3 rounded-xl gradient-hero text-primary-foreground font-semibold text-sm glow-primary hover:opacity-90 transition-opacity"
                  >
                    🇷🇺 Русский язык
                  </button>
                </div>
              </div>
            ) : isPending ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl gradient-hero flex items-center justify-center glow-primary">
                    <Sparkles className="h-8 w-8 text-primary-foreground animate-pulse" />
                  </div>
                </div>
                <p className="text-muted-foreground font-medium text-center">
                  Анализируем, транскрибируем и переводим видео...
                </p>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : analysis ? (
              <>
                {/* Topic */}
                {summary?.topic && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Тема видео</p>
                    <h2 className="text-xl font-bold text-foreground leading-tight">{summary.topic}</h2>
                  </div>
                )}

                {/* Language */}
                {summary?.language && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Язык:</span>
                    <span className="font-medium text-foreground">
                      {summary.language === "Русский" ? "🇷🇺 " : summary.language === "English" ? "🇺🇸 " : ""}
                      {summary.language}
                    </span>
                  </div>
                )}

                {/* Tags */}
                {summary?.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {summary.tags.map((tag: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Niches */}
                {summary?.niches?.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">К каким категориям подойдет</p>
                    <div className="flex flex-wrap gap-2">
                      {summary.niches.map((niche: string, i: number) => (
                        <span key={i} className="px-3 py-1.5 rounded-full text-xs font-medium bg-card border border-border/50 text-foreground">
                          {niche}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transcription */}
                {transcript && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-foreground">Транскрибация</h3>
                      <button
                        onClick={() => { navigator.clipboard.writeText(transcript); toast.success("Скопировано!"); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border border-border/50"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Копировать
                      </button>
                    </div>
                    <div className="bg-card rounded-xl border border-border/50 p-4 max-h-60 overflow-y-auto">
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{transcript}</p>
                    </div>
                  </div>
                )}

                {/* Generate Scenario Button */}
                <button
                  onClick={async () => {
                    if (!isNativePlatform) {
                      const ok = await checkAndLog("ai_script", `AI Сценарий из трендов: ${video.url}`);
                      if (!ok) return;
                    }
                    setShowScript(true);
                  }}
                  className="w-full py-4 rounded-xl gradient-hero text-primary-foreground font-bold text-base glow-primary hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-5 w-5" />
                  Генерация сценария
                </button>

                {/* Summary / Суть */}
                {summary?.summary && (
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-3">Суть</h3>
                    <div className="bg-card rounded-xl border border-border/50 p-4">
                      <p className="text-sm text-foreground/80 leading-relaxed">{summary.summary}</p>
                    </div>
                  </div>
                )}

                {/* Structure / Timeline */}
                {summary?.structure?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-4">Структура</h3>
                    <div className="relative pl-8 space-y-6">
                      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
                      {summary.structure.map((seg: any, i: number) => (
                        <div key={i} className="relative">
                          <div className={`absolute -left-8 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            i === summary.structure.length - 1
                              ? "bg-primary border-primary"
                              : "bg-card border-border"
                          }`}>
                            {i === summary.structure.length - 1 && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5 min-w-[70px]">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {seg.time || seg.timestamp || ""}
                            </span>
                            <div>
                              <p className="text-sm font-bold text-foreground">{seg.title || seg.name || ""}</p>
                              {seg.description && (
                                <p className="text-xs text-foreground/70 mt-1 leading-relaxed">{seg.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hook phrase */}
                {summary?.hook_phrase && (
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">Хук фраза</h3>
                    <p className="text-sm text-foreground/80">{summary.hook_phrase}</p>
                  </div>
                )}

                {/* Visual hook */}
                {summary?.visual_hook && (
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">Визуальный хук</h3>
                    <p className="text-sm text-foreground/80">{summary.visual_hook}</p>
                  </div>
                )}

                {/* Text hook */}
                {summary?.text_hook && (
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">Текстовый хук</h3>
                    <p className="text-sm text-foreground/80">{summary.text_hook}</p>
                  </div>
                )}

                {/* Marketing funnel */}
                {summary?.funnel && (
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-3">Воронка / Маркетинг</h3>
                    <div className="bg-card rounded-xl border border-border/50 p-4 space-y-2">
                      {summary.funnel.direction && (
                        <div>
                          <p className="text-sm font-bold text-foreground">Куда ведет</p>
                          <p className="text-sm text-foreground/80">{summary.funnel.direction}</p>
                        </div>
                      )}
                      {summary.funnel.goal && (
                        <div>
                          <p className="text-sm font-bold text-foreground">Цель</p>
                          <p className="text-sm text-foreground/80">{summary.funnel.goal}</p>
                        </div>
                      )}
                      {typeof summary.funnel === "string" && (
                        <p className="text-sm text-foreground/80">{summary.funnel}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Fallback: raw JSON if no structured data */}
                {!summary?.topic && !summary?.summary && analysis?.summary_json && (
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-3">Анализ (raw)</h3>
                    <pre className="text-xs text-foreground/80 bg-card rounded-xl border border-border/50 p-4 overflow-auto max-h-96 whitespace-pre-wrap">
                      {typeof analysis.summary_json === "string"
                        ? analysis.summary_json
                        : JSON.stringify(analysis.summary_json, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Sparkles className="h-10 w-10 text-muted-foreground/20" />
                <p className="text-muted-foreground text-sm">Анализ қолжетімсіз, бірақ сценарий жасауға болады</p>
                <button
                  onClick={async () => {
                    if (!isNativePlatform) {
                      const ok = await checkAndLog("ai_script", `AI Сценарий из трендов: ${video.url}`);
                      if (!ok) return;
                    }
                    setShowScript(true);
                  }}
                  className="px-6 py-3 rounded-xl gradient-hero text-primary-foreground font-bold text-sm glow-primary hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Генерация сценария
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
