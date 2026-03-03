import { AppLayout } from "@/components/layout/AppLayout";
import { Video, Eye, Heart, MessageCircle, Share2, ExternalLink, Clock, Loader2, Sparkles, Target, Copy, Play, X } from "lucide-react";
import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ScriptGenerationPanel } from "@/components/ScriptGenerationPanel";

const fmt = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
};

// Extract video ID from TikTok URL
const extractVideoId = (url: string): string => {
  const match = url.match(/video\/(\d+)/);
  return match ? match[1] : "";
};

export default function VideoAnalysis() {
  const [url, setUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [language, setLanguage] = useState<"ru" | "kk" | null>(null);

  const { data: analysis, isPending, mutate: analyze } = useMutation({
    mutationFn: async (videoUrl: string) => {
      const [statsRes, analysisRes] = await Promise.allSettled([
        supabase.functions.invoke("socialkit", {
          body: { action: "video_stats", video_url: videoUrl },
        }),
        supabase.functions.invoke("socialkit", {
          body: { action: "analyze_video", video_url: videoUrl, caption: "" },
        }),
      ]);

      const stats = statsRes.status === "fulfilled" && !statsRes.value.error ? statsRes.value.data : null;
      const analysisData = analysisRes.status === "fulfilled" && !analysisRes.value.error ? analysisRes.value.data : null;

      if (!stats && !analysisData) {
        throw new Error("Не удалось получить данные о видео. Проверьте ссылку.");
      }

      if (!analysisData && stats) {
        toast.warning("Статистика получена, но анализ недоступен для этого видео");
      }

      return { stats, ...(analysisData || {}) };
    },
    onError: (err: Error) => {
      toast.error(err.message || "Не удалось проанализировать видео");
    },
  });

  const handleAnalyze = () => {
    if (!url.trim()) return;
    setIsPlaying(false);
    setShowScript(false);
    analyze(url.trim());
  };

  const stats = analysis?.stats;
  const rawSummary = analysis?.summary_json;
  const summary = typeof rawSummary === "string"
    ? (() => { try { return JSON.parse(rawSummary); } catch { return null; } })()
    : rawSummary;

  let transcript = analysis?.transcript_text || "";
  if (typeof transcript !== "string") {
    try { transcript = JSON.stringify(transcript); } catch { transcript = ""; }
  }
  if (transcript.startsWith("{") || transcript.startsWith("[")) {
    try {
      const parsed = JSON.parse(transcript);
      transcript = parsed?.transcript || parsed?.text || parsed?.data?.transcript || transcript;
    } catch { /* keep as is */ }
  }

  const videoId = extractVideoId(url);
  const views = Number(stats?.playCount || stats?.views || 0);
  const likes = Number(stats?.diggCount || stats?.likes || 0);
  const commentsCount = Number(stats?.commentCount || stats?.comments || 0);
  const shares = Number(stats?.shareCount || stats?.shares || 0);
  const er = views > 0 ? ((likes + commentsCount + shares) / views * 100).toFixed(2) : "0";
  const coverUrl = stats?.cover || stats?.cover_url || stats?.originCover || "";
  const authorUsername = stats?.author?.uniqueId || stats?.author_username || "";
  const authorAvatar = stats?.author?.avatarThumb || stats?.author_avatar_url || "";

  if (showScript && analysis) {
    return (
      <AppLayout>
        <div className="h-[calc(100vh-2rem)] m-4">
          <ScriptGenerationPanel
            transcript={transcript}
            summary={summary}
            caption=""
            onBack={() => setShowScript(false)}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {!analysis || isPending ? (
        /* Centered form + loading */
        <div className="min-h-[calc(100dvh-5rem)] md:min-h-[calc(100dvh-1rem)] flex flex-col items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg flex flex-col items-center gap-6">
            {isPending ? (
              <>
                <div className="w-20 h-20 rounded-2xl gradient-hero flex items-center justify-center glow-primary animate-scale-in">
                  <Sparkles className="h-9 w-9 text-primary-foreground animate-pulse" />
                </div>
                <p className="text-muted-foreground font-medium text-center text-sm md:text-base animate-fade-in">
                  Анализируем, транскрибируем и переводим видео...
                </p>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </>
            ) : (
              <>
                <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center">
                  <Video className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground text-center">Анализ видео 🎬</h1>
                <p className="text-muted-foreground text-sm text-center">Вставьте ссылку на видео, чтобы начать анализ</p>
              </>
            )}
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Input
                placeholder="Вставьте ссылку на TikTok видео..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                className="flex-1 h-12 bg-card border-border rounded-xl card-shadow text-sm"
              />
              <Button
                onClick={handleAnalyze}
                disabled={isPending}
                className="h-12 gradient-hero text-primary-foreground border-0 px-7 glow-primary hover:opacity-90 transition-opacity rounded-xl font-semibold text-sm"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <><Video className="h-4 w-4 mr-2" />Анализировать</>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
      <div className="p-3 md:p-4 lg:p-6 animate-fade-in min-h-[calc(100dvh-5rem)] md:min-h-[calc(100dvh-1rem)] flex flex-col">
        <h1 className="text-lg md:text-2xl font-bold text-foreground mb-3">Анализ видео 🎬</h1>
        <div className="flex flex-col sm:flex-row gap-2 mb-3 md:mb-4">
          <Input
            placeholder="Вставьте ссылку на TikTok видео..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            className="flex-1 h-11 md:h-12 bg-card border-border rounded-xl card-shadow text-sm"
          />
          <Button
            onClick={handleAnalyze}
            disabled={isPending}
            className="h-11 md:h-12 gradient-hero text-primary-foreground border-0 px-5 md:px-7 glow-primary hover:opacity-90 transition-opacity rounded-xl font-semibold text-sm"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <><Video className="h-4 w-4 mr-2" />Анализировать</>
            )}
          </Button>
        </div>
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 min-h-0 md:h-[calc(100vh-10rem)]">
            {/* Left panel — video + stats */}
            {/* Mobile: horizontal compact card; Desktop: vertical sidebar */}
            <div className="w-full md:w-[320px] flex-shrink-0 overflow-y-auto bg-card rounded-xl md:rounded-2xl border border-border/50 card-shadow">
              {/* Mobile layout: thumbnail + stats side by side */}
              <div className="flex md:hidden gap-3 p-2">
                <div className="w-28 h-40 flex-shrink-0 bg-black relative rounded-xl overflow-hidden">
                  {isPlaying && videoId ? (
                    <>
                      <iframe
                        src={`https://www.tiktok.com/player/v1/${videoId}?music_info=1&description=0&muted=0&play_button=1&volume_control=1`}
                        className="w-full h-full border-0"
                        allow="autoplay; encrypted-media; fullscreen"
                        allowFullScreen
                      />
                      <button
                        onClick={() => setIsPlaying(false)}
                        className="absolute top-1 right-1 z-20 bg-black/60 text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : coverUrl ? (
                    <div className="relative w-full h-full cursor-pointer group" onClick={() => setIsPlaying(true)}>
                      <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                          <Play className="h-4 w-4 text-foreground ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center cursor-pointer" onClick={() => setIsPlaying(true)}>
                      <Play className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  {authorUsername && (
                    <div className="flex items-center gap-2 mb-2">
                      {authorAvatar ? (
                        <img src={authorAvatar} alt="" className="w-7 h-7 rounded-full object-cover border border-border/50" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-muted" />
                      )}
                      <span className="text-xs font-semibold text-primary truncate">@{authorUsername}</span>
                      <button
                        onClick={() => window.open(url, "_blank")}
                        className="ml-auto text-muted-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {[
                      { icon: Eye, value: fmt(views), label: "Просм." },
                      { icon: Heart, value: fmt(likes), label: "Лайки", color: "text-primary" },
                      { icon: MessageCircle, value: fmt(commentsCount), label: "Комм.", color: "text-green-500" },
                      { icon: Share2, value: fmt(shares), label: "Реп.", color: "text-blue-500" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-1.5">
                        <s.icon className={`h-3.5 w-3.5 ${s.color || "text-muted-foreground"}`} />
                        <span className="text-xs font-bold text-foreground">{s.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Target className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">ER</span>
                    <span className="text-xs font-bold text-foreground">{er}%</span>
                  </div>
                </div>
              </div>

              {/* Desktop layout: full vertical card */}
              <div className="hidden md:block">
                <div className="aspect-[9/14] bg-black relative rounded-2xl overflow-hidden m-2">
                  {isPlaying && videoId ? (
                    <>
                      <iframe
                        src={`https://www.tiktok.com/player/v1/${videoId}?music_info=1&description=0&muted=0&play_button=1&volume_control=1`}
                        className="w-full h-full border-0"
                        allow="autoplay; encrypted-media; fullscreen"
                        allowFullScreen
                      />
                      <button
                        onClick={() => setIsPlaying(false)}
                        className="absolute top-2 right-2 z-20 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : coverUrl ? (
                    <div className="relative w-full h-full cursor-pointer group" onClick={() => setIsPlaying(true)}>
                      <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="h-6 w-6 text-foreground ml-1" fill="currentColor" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center cursor-pointer" onClick={() => setIsPlaying(true)}>
                      <Play className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between px-4 pt-3">
                  <span className="text-sm text-muted-foreground"></span>
                  <button
                    onClick={() => window.open(url, "_blank")}
                    className="text-muted-foreground hover:text-foreground hover:scale-110 transition-transform"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </button>
                </div>

                {authorUsername && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    {authorAvatar ? (
                      <img src={authorAvatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-border/50" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted" />
                    )}
                    <span className="text-sm font-semibold text-primary truncate">@{authorUsername}</span>
                  </div>
                )}

                <div className="px-4 pb-4 space-y-1">
                  {[
                    { icon: Eye, label: "Просмотры", value: fmt(views) },
                    { icon: Heart, label: "Лайки", value: fmt(likes), color: "text-primary" },
                    { icon: MessageCircle, label: "Комментарии", value: fmt(commentsCount), color: "text-green-500" },
                    { icon: Share2, label: "Репосты", value: fmt(shares), color: "text-blue-500" },
                    { icon: Target, label: "ER", value: er + "%" },
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
            </div>

            {/* Right panel — analysis (same as VideoAnalysisDialog) */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 bg-card rounded-xl md:rounded-2xl border border-border/50 card-shadow">
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
                  <div className="bg-muted/50 rounded-xl border border-border/50 p-4 max-h-60 overflow-y-auto">
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{transcript}</p>
                  </div>
                </div>
              )}

              {/* Generate Scenario Button */}
              <button
                onClick={() => setShowScript(true)}
                className="w-full py-4 rounded-xl gradient-hero text-primary-foreground font-bold text-base glow-primary hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Sparkles className="h-5 w-5" />
                Генерация сценария
              </button>

              {/* Summary */}
              {summary?.summary && (
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-3">Суть</h3>
                  <div className="bg-muted/50 rounded-xl border border-border/50 p-4">
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
                  <div className="bg-muted/50 rounded-xl border border-border/50 p-4 space-y-2">
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

              {/* Fallback raw */}
              {!summary?.topic && !summary?.summary && analysis?.summary_json && (
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-3">Анализ (raw)</h3>
                  <pre className="text-sm text-foreground/80 whitespace-pre-wrap bg-muted/50 rounded-xl p-4 max-h-96 overflow-y-auto">
                    {typeof analysis.summary_json === "string" ? analysis.summary_json : JSON.stringify(analysis.summary_json, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}