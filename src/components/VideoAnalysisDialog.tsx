import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Eye, Heart, MessageCircle, Share2, ExternalLink, Clock, Loader2, Sparkles, X, Target, Copy } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

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
  const [activeSection, setActiveSection] = useState<string>("all");

  const { data: analysis, isPending, mutate: analyze, reset } = useMutation({
    mutationFn: async (videoUrl: string) => {
      const [statsRes, analysisRes] = await Promise.all([
        supabase.functions.invoke("socialkit", {
          body: { action: "video_stats", video_url: videoUrl },
        }),
        supabase.functions.invoke("socialkit", {
          body: { action: "analyze_video", video_url: videoUrl },
        }),
      ]);
      if (analysisRes.error) throw analysisRes.error;
      return { stats: statsRes.data, analysis: analysisRes.data };
    },
    onError: (err: Error) => {
      toast.error("Не удалось проанализировать: " + err.message);
    },
  });

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && video) {
      reset();
      analyze(video.url);
    }
    onOpenChange(isOpen);
  };

  if (!video) return null;

  const views = Number(video.views || 0);
  const likes = Number(video.likes || 0);
  const commentsCount = Number(video.comments || 0);
  const shares = Number(video.shares || 0);
  const er = views > 0 ? ((likes + commentsCount + shares) / views * 100).toFixed(2) : "0";

  const publishedDate = video.published_at ? new Date(video.published_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

  const summaryJson = analysis?.analysis?.summary_json;
  const summary = typeof summaryJson === "string" ? (() => { try { return JSON.parse(summaryJson); } catch { return null; } })() : summaryJson;
  const transcript = analysis?.analysis?.transcript_text;

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent side="right" className="w-full sm:max-w-4xl p-0 gap-0 border-l border-border/50 overflow-hidden [&>button]:hidden">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-foreground" />
        </button>

        <div className="flex flex-col md:flex-row h-full">
          {/* Left panel — video + stats */}
          <div className="w-full md:w-[300px] flex-shrink-0 border-r border-border/50 overflow-y-auto bg-card">
            {/* Video cover */}
            <div className="aspect-[9/14] bg-muted relative">
              {video.cover_url ? (
                <img src={video.cover_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground/20" />
                </div>
              )}
            </div>

            {/* Date + actions */}
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

            {/* Author */}
            <div className="flex items-center gap-3 px-4 py-3">
              {video.author_avatar_url ? (
                <img src={video.author_avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-border/50" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted" />
              )}
              <span className="text-sm font-semibold text-primary truncate">@{video.author_username}</span>
            </div>

            {/* Stats */}
            <div className="px-4 pb-4 space-y-1">
              {[
                { icon: Eye, label: "Просмотры", value: fmt(views) },
                { icon: Heart, label: "Лайки", value: fmt(likes), color: "text-primary" },
                { icon: MessageCircle, label: "Комментарии", value: fmt(commentsCount), color: "text-green-500" },
                { icon: Share2, label: "Репосты", value: fmt(shares), color: "text-blue-500" },
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
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background">
            {isPending ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl gradient-hero flex items-center justify-center glow-primary">
                    <Sparkles className="h-8 w-8 text-primary-foreground animate-pulse" />
                  </div>
                </div>
                <p className="text-muted-foreground font-medium text-center">
                  Анализируем, транскрибируем и переводим видео
                </p>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : analysis ? (
              <>
                {/* Topic + Title */}
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
                    <span className="font-medium text-foreground">{summary.language}</span>
                  </div>
                )}

                {/* Tags */}
                {summary?.tags && Array.isArray(summary.tags) && summary.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {summary.tags.map((tag: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Niches */}
                {summary?.niches && Array.isArray(summary.niches) && summary.niches.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">К каким нишам подойдет</p>
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
                <button className="w-full py-4 rounded-xl gradient-hero text-primary-foreground font-bold text-base glow-primary hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Генерация сценария
                </button>

                {/* Summary */}
                {summary?.summary && (
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-3">Суть</h3>
                    <div className="bg-card rounded-xl border border-border/50 p-4">
                      <p className="text-sm text-foreground/80 leading-relaxed">{summary.summary}</p>
                    </div>
                  </div>
                )}

                {/* Structure / Timeline */}
                {summary?.structure && Array.isArray(summary.structure) && summary.structure.length > 0 && (
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
                            <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5 min-w-[60px]">
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
                    <div className="bg-card rounded-xl border border-border/50 p-4">
                      {summary.funnel.direction && (
                        <div className="mb-2">
                          <p className="text-sm font-bold text-foreground">Куда ведет</p>
                          <p className="text-sm text-foreground/80">{summary.funnel.direction}</p>
                        </div>
                      )}
                      {typeof summary.funnel === "string" && (
                        <p className="text-sm text-foreground/80">{summary.funnel}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Fallback: raw JSON if no structured data */}
                {!summary && analysis?.analysis?.summary_json && (
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-3">Анализ</h3>
                    <pre className="text-xs text-foreground/80 bg-card rounded-xl border border-border/50 p-4 overflow-auto max-h-96 whitespace-pre-wrap">
                      {typeof analysis.analysis.summary_json === "string"
                        ? analysis.analysis.summary_json
                        : JSON.stringify(analysis.analysis.summary_json, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Comments */}
                {analysis?.analysis?.comments_json && (
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-3">Комментарии</h3>
                    <pre className="text-xs text-foreground/80 bg-card rounded-xl border border-border/50 p-4 overflow-auto max-h-60 whitespace-pre-wrap">
                      {JSON.stringify(analysis.analysis.comments_json, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Sparkles className="h-10 w-10 text-muted-foreground/20" />
                <p className="text-muted-foreground text-sm">Ошибка загрузки анализа</p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
