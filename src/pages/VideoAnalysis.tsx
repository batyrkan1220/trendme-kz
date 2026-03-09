import { AppLayout } from "@/components/layout/AppLayout";
import { Video, Eye, Heart, MessageCircle, Share2, ExternalLink, Clock, Loader2, Sparkles, Target, Copy, Play, X } from "lucide-react";
import { VideoCard, VideoCardData } from "@/components/VideoCard";
import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ScriptGenerationPanel } from "@/components/ScriptGenerationPanel";
import { useSubscription } from "@/hooks/useSubscription";

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

const isValidTikTokUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url.trim());
    const hosts = ["tiktok.com", "www.tiktok.com", "vm.tiktok.com", "m.tiktok.com", "vt.tiktok.com", "lite.tiktok.com"];
    return hosts.some((h) => parsed.hostname === h || parsed.hostname.endsWith("." + h));
  } catch {
    return false;
  }
};

export default function VideoAnalysis() {
  const [searchParams] = useSearchParams();
  const [url, setUrl] = useState(searchParams.get("url") || "");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [language, setLanguage] = useState<"ru" | "kk" | null>(null);
  const [showLangPicker, setShowLangPicker] = useState(!!searchParams.get("url"));
  const { checkAndLog } = useSubscription();
  const { data: analysis, isPending, mutate: analyze } = useMutation({
    mutationFn: async ({ videoUrl, lang }: {videoUrl: string;lang: "ru" | "kk";}) => {
      // Single call — analyze_video already fetches post info + comments
      const { data, error } = await supabase.functions.invoke("socialkit", {
        body: { action: "analyze_video", video_url: videoUrl, caption: "", language: lang }
      });
      if (error) throw error;
      if (!data) throw new Error("Не удалось получить данные о видео. Проверьте ссылку.");

      // Extract stats from summary_json (analyze_video includes stats there)
      const summaryStats = data.summary_json?.stats || null;
      return { stats: summaryStats, ...data };
    },
    onError: (err: Error) => {
      toast.error(err.message || "Не удалось проанализировать видео");
    }
  });

  const handleAnalyze = async (lang: "ru" | "kk") => {
    if (!url.trim()) return;
    if (!isValidTikTokUrl(url.trim())) {
      toast.error("Используйте только ссылку на TikTok (например: https://www.tiktok.com/@user/video/...)");
      return;
    }
    // Check if it's a profile URL instead of a video URL
    const trimmed = url.trim();
    const hasVideoPath = /\/video\/\d+/.test(trimmed) || /\/photo\/\d+/.test(trimmed) || /\/v\/\d+/.test(trimmed) || /vm\.tiktok\.com/.test(trimmed) || /vt\.tiktok\.com/.test(trimmed);
    const isProfileUrl = /@[\w.]+\/?(\?|$)/.test(trimmed) && !hasVideoPath;
    if (isProfileUrl) {
      toast.error("Это ссылка на профиль 👤\nВставьте ссылку на видео (например: https://www.tiktok.com/@user/video/123...)", { duration: 5000 });
      return;
    }
    const ok = await checkAndLog("video_analysis", `Анализ видео: ${url.trim()}`);
    if (!ok) return;
    setLanguage(lang);
    setIsPlaying(false);
    setShowScript(false);
    analyze({ videoUrl: url.trim(), lang });
  };

  const stats = analysis?.stats;
  const rawSummary = analysis?.summary_json;
  const summary = typeof rawSummary === "string" ?
  (() => {try {return JSON.parse(rawSummary);} catch {return null;}})() :
  rawSummary;

  let transcript = analysis?.transcript_text || "";
  if (typeof transcript !== "string") {
    try {transcript = JSON.stringify(transcript);} catch {transcript = "";}
  }
  if (transcript.startsWith("{") || transcript.startsWith("[")) {
    try {
      const parsed = JSON.parse(transcript);
      transcript = parsed?.transcript || parsed?.text || parsed?.data?.transcript || transcript;
    } catch {/* keep as is */}
  }

  const videoId = extractVideoId(url) || String(stats?.videoId || stats?.id || stats?.video_id || stats?.aweme_id || "");
  const views = Number(stats?.views || stats?.playCount || 0);
  const likes = Number(stats?.likes || stats?.diggCount || 0);
  const commentsCount = Number(stats?.comments || stats?.commentCount || 0);
  const shares = Number(stats?.shares || stats?.shareCount || 0);
  const er = views > 0 ? ((likes + commentsCount + shares) / views * 100).toFixed(2) : "0";
  const coverUrl = stats?.thumbnailUrl || stats?.cover || stats?.cover_url || stats?.originCover || stats?.video?.cover || "";
  const authorUsername = stats?.channelName || stats?.author?.uniqueId || stats?.author_username || "";
  const authorAvatar = stats?.author?.avatarThumb || stats?.author_avatar_url || "";

  if (showScript && analysis) {
    return (
      <AppLayout>
        <div className="pb-16 md:pb-8 m-4" style={{ height: "calc(100dvh - 6rem)" }}>
          <ScriptGenerationPanel
            transcript={transcript}
            summary={summary}
            caption=""
            language={language || "ru"}
            onBack={() => setShowScript(false)} />
          
        </div>
      </AppLayout>);

  }

  return (
    <AppLayout>
      {!analysis || isPending ? (
      /* Centered form + loading */
      <div className="flex flex-col items-center justify-center p-4 animate-fade-in" style={{ minHeight: "calc(100dvh - 8rem)", paddingTop: "max(env(safe-area-inset-top, 0px) + 16px, 16px)" }}>
          <div className="w-full max-w-lg flex flex-col items-center gap-6">
            {isPending ?
          <>
                <div className="w-20 h-20 rounded-2xl gradient-hero flex items-center justify-center glow-primary animate-scale-in">
                  <Sparkles className="h-9 w-9 text-primary-foreground animate-pulse" />
                </div>
                <p className="text-muted-foreground font-medium text-center text-sm md:text-base animate-fade-in">
                  Анализируем, транскрибируем и переводим видео...
                </p>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </> :

          <>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground text-center">Анализ видео </h1>
                
              </>
          }
            <div className="flex flex-col gap-3 w-full">
              <Input
              placeholder="Вставьте ссылку на TikTok видео..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isPending && url.trim() && handleAnalyze("ru")}
              className="flex-1 h-12 bg-card border-border rounded-xl card-shadow text-base" />
            
              {!isPending &&
            <div className="flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground text-center font-medium">Тілді таңдаңыз / Выберите язык</p>
                  <div className="flex gap-2">
                    <Button
                  onClick={() => handleAnalyze("kk")}
                  disabled={!url.trim()}
                  className="flex-1 h-12 gradient-hero text-primary-foreground border-0 glow-primary hover:opacity-90 transition-opacity rounded-xl font-semibold text-sm">
                  
                      🇰🇿 Қазақ тілі
                    </Button>
                    <Button
                  onClick={() => handleAnalyze("ru")}
                  disabled={!url.trim()}
                  className="flex-1 h-12 gradient-hero text-primary-foreground border-0 glow-primary hover:opacity-90 transition-opacity rounded-xl font-semibold text-sm">
                  
                      🇷🇺 Русский язык
                    </Button>
                  </div>
                </div>
            }
              {isPending &&
            <Button disabled className="h-12 gradient-hero text-primary-foreground border-0 rounded-xl font-semibold text-sm">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />Анализируем...
                </Button>
            }
            </div>
          </div>
        </div>) :

      <div className="p-3 md:p-4 lg:p-6 animate-fade-in pb-16 md:pb-8" style={{ paddingTop: "max(env(safe-area-inset-top, 0px) + 12px, 12px)" }}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Анализ видео 🎬</h1>
        <div className="flex flex-col sm:flex-row gap-2 mb-3 md:mb-4">
          <Input
            placeholder="Вставьте ссылку на TikTok видео..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isPending && url.trim() && handleAnalyze(language || "ru")}
            className="flex-1 h-11 md:h-12 bg-card border-border rounded-xl card-shadow text-base" />
          
          <div className="flex gap-2">
            <Button
              onClick={() => handleAnalyze("kk")}
              disabled={isPending}
              className="h-11 md:h-12 gradient-hero text-primary-foreground border-0 px-4 glow-primary hover:opacity-90 transition-opacity rounded-xl font-semibold text-sm">
              
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "🇰🇿 Қазақша"}
            </Button>
            <Button
              onClick={() => handleAnalyze("ru")}
              disabled={isPending}
              className="h-11 md:h-12 gradient-hero text-primary-foreground border-0 px-4 glow-primary hover:opacity-90 transition-opacity rounded-xl font-semibold text-sm">
              
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "🇷🇺 Русский"}
            </Button>
          </div>
        </div>
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 min-h-0 md:h-[calc(100vh-10rem)]">
            {/* Left panel — video + stats */}
            {/* Mobile: horizontal compact card; Desktop: vertical sidebar */}
            <div className="w-[min(44vw,200px)] flex-shrink-0 overflow-y-auto">
              <VideoCard
              video={{
                id: videoId,
                platform_video_id: videoId,
                url: url,
                cover_url: coverUrl,
                caption: stats?.caption || stats?.desc || "",
                author_username: authorUsername,
                author_avatar_url: authorAvatar,
                views: views,
                likes: likes,
                comments: commentsCount,
                shares: shares
              }}
              playingId={isPlaying ? videoId : null}
              onPlay={(id) => setIsPlaying(!!id)}
              isFavorite={false}
              onToggleFav={() => {}}
              showTier={true}
              showAuthor={true}
              showAnalyzeButton={false} />
            
            </div>

            {/* Right panel — analysis (same as VideoAnalysisDialog) */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 bg-card rounded-xl md:rounded-2xl border border-border/50 card-shadow">
              {/* Topic */}
              {summary?.topic &&
            <div>
                  <p className="text-xs text-muted-foreground mb-1">Тема видео</p>
                  <h2 className="text-xl font-bold text-foreground leading-tight">{summary.topic}</h2>
                </div>
            }

              {/* Language */}
              {summary?.language &&
            <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Язык:</span>
                  <span className="font-medium text-foreground">
                    {summary.language === "Русский" ? "🇷🇺 " : summary.language === "English" ? "🇺🇸 " : ""}
                    {summary.language}
                  </span>
                </div>
            }

              {/* Tags */}
              {summary?.tags?.length > 0 &&
            <div className="flex flex-wrap gap-2">
                  {summary.tags.map((tag: string, i: number) =>
              <span key={i} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                      {tag}
                    </span>
              )}
                </div>
            }

              {/* Niches */}
              {summary?.niches?.length > 0 &&
            <div>
                  <p className="text-sm text-muted-foreground mb-2">К каким категориям подойдет</p>
                  <div className="flex flex-wrap gap-2">
                    {summary.niches.map((niche: string, i: number) =>
                <span key={i} className="px-3 py-1.5 rounded-full text-xs font-medium bg-card border border-border/50 text-foreground">
                        {niche}
                      </span>
                )}
                  </div>
                </div>
            }

              {/* Transcription */}
              {transcript &&
            <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-foreground">Транскрибация</h3>
                    <button
                  onClick={() => {navigator.clipboard.writeText(transcript);toast.success("Скопировано!");}}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border border-border/50">
                  
                      <Copy className="h-3.5 w-3.5" />
                      Копировать
                    </button>
                  </div>
                  <div className="bg-muted/50 rounded-xl border border-border/50 p-4 max-h-60 overflow-y-auto">
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{transcript}</p>
                  </div>
                </div>
            }

              {/* Generate Scenario Button */}
              <button
              onClick={async () => {
                const ok = await checkAndLog("ai_script", `AI Сценарий из анализа: ${url.trim()}`);
                if (!ok) return;
                setShowScript(true);
              }}
              className="w-full py-4 rounded-xl gradient-hero text-primary-foreground font-bold text-base glow-primary hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5" />
                Генерация сценария
              </button>

              {/* Summary */}
              {summary?.summary &&
            <div>
                  <h3 className="text-lg font-bold text-foreground mb-3">Суть</h3>
                  <div className="bg-muted/50 rounded-xl border border-border/50 p-4">
                    <p className="text-sm text-foreground/80 leading-relaxed">{summary.summary}</p>
                  </div>
                </div>
            }

              {/* Structure / Timeline */}
              {summary?.structure?.length > 0 &&
            <div>
                  <h3 className="text-lg font-bold text-foreground mb-4">Структура</h3>
                  <div className="relative pl-8 space-y-6">
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
                    {summary.structure.map((seg: any, i: number) =>
                <div key={i} className="relative">
                        <div className={`absolute -left-8 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  i === summary.structure.length - 1 ?
                  "bg-primary border-primary" :
                  "bg-card border-border"}`
                  }>
                          {i === summary.structure.length - 1 && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5 min-w-[70px]">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {seg.time || seg.timestamp || ""}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-foreground">{seg.title || seg.name || ""}</p>
                            {seg.description &&
                      <p className="text-xs text-foreground/70 mt-1 leading-relaxed">{seg.description}</p>
                      }
                          </div>
                        </div>
                      </div>
                )}
                  </div>
                </div>
            }

              {/* Hook phrase */}
              {summary?.hook_phrase &&
            <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Хук фраза</h3>
                  <p className="text-sm text-foreground/80">{summary.hook_phrase}</p>
                </div>
            }

              {/* Visual hook */}
              {summary?.visual_hook &&
            <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Визуальный хук</h3>
                  <p className="text-sm text-foreground/80">{summary.visual_hook}</p>
                </div>
            }

              {/* Text hook */}
              {summary?.text_hook &&
            <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Текстовый хук</h3>
                  <p className="text-sm text-foreground/80">{summary.text_hook}</p>
                </div>
            }

              {/* Marketing funnel */}
              {summary?.funnel &&
            <div>
                  <h3 className="text-lg font-bold text-foreground mb-3">Воронка / Маркетинг</h3>
                  <div className="bg-muted/50 rounded-xl border border-border/50 p-4 space-y-2">
                    {summary.funnel.direction &&
                <div>
                        <p className="text-sm font-bold text-foreground">Куда ведет</p>
                        <p className="text-sm text-foreground/80">{summary.funnel.direction}</p>
                      </div>
                }
                    {summary.funnel.goal &&
                <div>
                        <p className="text-sm font-bold text-foreground">Цель</p>
                        <p className="text-sm text-foreground/80">{summary.funnel.goal}</p>
                      </div>
                }
                    {typeof summary.funnel === "string" &&
                <p className="text-sm text-foreground/80">{summary.funnel}</p>
                }
                  </div>
                </div>
            }

              {/* Fallback raw */}
              {!summary?.topic && !summary?.summary && analysis?.summary_json &&
            <div>
                  <h3 className="text-lg font-bold text-foreground mb-3">Анализ (raw)</h3>
                  <pre className="text-sm text-foreground/80 whitespace-pre-wrap bg-muted/50 rounded-xl p-4 max-h-96 overflow-y-auto">
                    {typeof analysis.summary_json === "string" ? analysis.summary_json : JSON.stringify(analysis.summary_json, null, 2)}
                  </pre>
                </div>
            }
            </div>
          </div>
        </div>
      }
    </AppLayout>);

}