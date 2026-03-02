import { AppLayout } from "@/components/layout/AppLayout";
import {
  UserCircle, Users, Heart, Video, Loader2, Check, Eye, MessageCircle, Share2,
  TrendingUp, BarChart3, Zap, Clock, ExternalLink, Trash2, RefreshCw, Play, Music, X, Sparkles, Star
} from "lucide-react";
import { useState, useCallback } from "react";
import { VideoAnalysisDialog } from "@/components/VideoAnalysisDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString("ru-RU");
}

function getTimeAgo(ts: number): string {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days < 1) return "сегодня";
  if (days < 7) return `${days}д назад`;
  if (days < 30) return `${Math.floor(days / 7)}нед назад`;
  if (days < 365) return `${Math.floor(days / 30)} мес. назад`;
  return `${Math.floor(days / 365)}г назад`;
}

interface TopVideo {
  id: string; desc: string; cover: string; url: string;
  views: number; likes: number; comments: number; shares: number;
  duration: number; createTime: number;
}

export default function AccountAnalysis() {
  const [url, setUrl] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [analysisVideo, setAnalysisVideo] = useState<any>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch tracked accounts history
  const { data: trackedAccounts = [] } = useQuery({
    queryKey: ["accounts-tracked"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts_tracked")
        .select("*")
        .order("fetched_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Favorites
  const { data: userFavorites = [] } = useQuery({
    queryKey: ["user-favorites", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("video_id").eq("user_id", user!.id);
      return data?.map((f) => f.video_id) || [];
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const toggleFav = useCallback(async (videoId: string) => {
    if (!user) return;
    const isFav = userFavorites.includes(videoId);
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("video_id", videoId);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, video_id: videoId });
    }
    queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
  }, [user, userFavorites, queryClient]);

  const { data: account, isPending, mutate: analyze } = useMutation({
    mutationFn: async (profileUrl: string) => {
      const { data, error } = await supabase.functions.invoke("socialkit", {
        body: { action: "account_stats", profile_url: profileUrl },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts-tracked"] });
      toast.success("Аккаунт проанализирован");
    },
    onError: (err: Error) => {
      toast.error("Ошибка: " + err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("accounts_tracked").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts-tracked"] });
      toast.success("Аккаунт удалён из истории");
    },
  });

  const handleAnalyze = () => {
    if (!url.trim()) return;
    analyze(url.trim());
  };

  const topVideos: TopVideo[] = account?.top_videos || [];

  return (
    <AppLayout>
      <div className="p-3 md:p-6 lg:p-8 space-y-4 md:space-y-6 animate-fade-in max-w-7xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Анализ аккаунта 👤</h1>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Вставьте ссылку на профиль TikTok..."
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
              <><UserCircle className="h-4 w-4 mr-2" />Анализировать</>
            )}
          </Button>
        </div>

        {/* Results */}
        {account ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="bg-card rounded-xl md:rounded-2xl border border-border/50 p-4 md:p-6 card-shadow">
              <div className="flex items-start gap-3 md:gap-5">
                {account.avatar_url ? (
                  <img src={account.avatar_url} alt="" className="h-14 w-14 md:h-20 md:w-20 rounded-full object-cover ring-4 ring-primary/10 shrink-0" />
                ) : (
                  <div className="h-14 w-14 md:h-20 md:w-20 rounded-full gradient-hero flex items-center justify-center text-xl md:text-2xl font-bold text-primary-foreground shadow-lg shrink-0">
                    {account.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg md:text-xl font-bold text-foreground">@{account.username}</h2>
                    {account.verified && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                        <Check className="h-3 w-3" /> Верифицирован
                      </span>
                    )}
                  </div>
                  {account.bio && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{account.bio}</p>}
                  {account.bio_link && (
                    <a href={account.bio_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium mt-1">
                      <ExternalLink className="h-3 w-3" /> {account.bio_link}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              {[
                { icon: Users, value: account.followers, label: "Подписчики", color: "text-blue-500" },
                { icon: Heart, value: account.total_likes, label: "Лайки", color: "text-rose-500" },
                { icon: Video, value: account.total_videos, label: "Видео", color: "text-violet-500" },
                { icon: Users, value: account.following, label: "Подписки", color: "text-emerald-500" },
              ].map((s) => (
                <div key={s.label} className="bg-card rounded-xl border border-border/50 p-3 md:p-4 text-center card-shadow hover-lift transition-transform">
                  <s.icon className={`h-4 w-4 md:h-5 md:w-5 ${s.color} mx-auto mb-1 md:mb-2`} />
                  <p className="text-lg md:text-xl font-bold text-foreground">{formatNum(Number(s.value || 0))}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Advanced Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
              <div className="bg-card rounded-xl border border-border/50 p-5 card-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Engagement Rate</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{account.engagement_rate || 0}%</p>
                <p className="text-xs text-muted-foreground mt-1">Среднее вовлечение на видео</p>
              </div>

              <div className="bg-card rounded-xl border border-border/50 p-5 card-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Eye className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Средние просмотры</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatNum(account.avg_views || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">Среднее по найденным видео</p>
              </div>

              <div className="bg-card rounded-xl border border-border/50 p-5 card-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Средние лайки</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatNum(account.avg_likes_per_video || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">Лайков на видео в среднем</p>
              </div>
            </div>

            {/* Top Videos */}
            {topVideos.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" /> Топ видео по просмотрам
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
                  {topVideos.map((v, i) => (
                    <div
                      key={v.id || i}
                      className="group bg-card rounded-2xl border border-border/40 overflow-hidden hover:shadow-lg transition-shadow duration-200 relative flex flex-col"
                    >
                      {/* Video area */}
                      <div className="relative aspect-[9/14] bg-black overflow-hidden rounded-2xl m-2">
                        {playingId === v.id ? (
                          <>
                            <iframe
                              src={`https://www.tiktok.com/player/v1/${v.id}?music_info=1&description=0&muted=0&play_button=1&volume_control=1`}
                              className="w-full h-full border-0"
                              allow="autoplay; encrypted-media; fullscreen"
                              allowFullScreen
                            />
                            <button
                              onClick={() => setPlayingId(null)}
                              className="absolute top-2 right-2 z-20 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            {v.cover ? (
                              <img
                                src={v.cover}
                                alt=""
                                loading="lazy"
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => setPlayingId(v.id)}
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center cursor-pointer bg-muted"
                                onClick={() => setPlayingId(v.id)}
                              >
                                <Play className="h-12 w-12 text-muted-foreground/30" />
                              </div>
                            )}

                            {/* Rank badge */}
                            <div className="absolute top-2.5 left-2.5 z-10">
                              <div className="h-7 w-7 rounded-full gradient-hero flex items-center justify-center text-xs font-bold text-primary-foreground shadow-lg">
                                {i + 1}
                              </div>
                            </div>

                            {/* Fav + Open in TikTok */}
                            <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleFav(v.id); }}
                                className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                              >
                                <Heart className={`h-3.5 w-3.5 transition-all ${userFavorites.includes(v.id) ? "text-primary fill-primary" : "text-foreground"}`} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); window.open(v.url, '_blank'); }}
                                className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                              >
                                <ExternalLink className="h-3.5 w-3.5 text-foreground" />
                              </button>
                            </div>

                            {/* Play button center */}
                            <div
                              className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              onClick={() => setPlayingId(v.id)}
                            >
                              <div className="w-14 h-14 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center">
                                <Play className="h-7 w-7 text-white fill-white ml-0.5" />
                              </div>
                            </div>

                            {/* Duration */}
                            {v.duration > 0 && (
                              <div className="absolute bottom-2.5 left-2.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                                {Math.floor(v.duration / 60)}:{String(v.duration % 60).padStart(2, "0")}
                              </div>
                            )}

                            {/* Bottom stats bar */}
                            <div className="absolute bottom-0 left-0 right-0 p-2.5 z-10 pointer-events-none">
                              <div className="flex items-center justify-center gap-2">
                                <div className="flex flex-col items-center bg-white/20 backdrop-blur-md rounded-xl px-3 py-1.5">
                                  <Eye className="h-4 w-4 text-white mb-0.5" />
                                  <span className="text-white text-[11px] font-bold">{formatNum(v.views)}</span>
                                </div>
                                <div className="flex flex-col items-center bg-white/20 backdrop-blur-md rounded-xl px-3 py-1.5">
                                  <Heart className="h-4 w-4 text-white mb-0.5" />
                                  <span className="text-white text-[11px] font-bold">{formatNum(v.likes)}</span>
                                </div>
                                <div className="flex flex-col items-center bg-white/20 backdrop-blur-md rounded-xl px-3 py-1.5">
                                  <MessageCircle className="h-4 w-4 text-white mb-0.5" />
                                  <span className="text-white text-[11px] font-bold">{formatNum(v.comments)}</span>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Caption */}
                      <div className="px-3 pt-1.5 pb-1">
                        <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">
                          {v.desc || "Без описания"}
                        </p>
                      </div>

                      {/* Date */}
                      {v.createTime > 0 && (
                        <div className="px-3 pb-1">
                          <span className="text-[11px] text-muted-foreground">{getTimeAgo(v.createTime)}</span>
                        </div>
                      )}

                      <div className="px-3 pb-3 mt-auto">
                        <button
                          onClick={() => setAnalysisVideo({
                            id: v.id,
                            platform_video_id: v.id,
                            url: v.url,
                            caption: v.desc,
                            cover_url: v.cover,
                            views: v.views,
                            likes: v.likes,
                            comments: v.comments,
                            shares: v.shares,
                            author_username: account?.username,
                          })}
                          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                        >
                          Анализ видео
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : isPending ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-24 w-24 rounded-2xl gradient-hero flex items-center justify-center shadow-lg mb-6">
              <Sparkles className="h-12 w-12 text-white/80" />
            </div>
            <p className="text-lg text-muted-foreground font-medium mb-4">
              Анализируем аккаунт...
            </p>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border/50 p-12 text-center card-shadow">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <UserCircle className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground font-medium">Вставьте ссылку на профиль TikTok для анализа</p>
          </div>
        )}

        {/* Tracked Accounts History */}
        {trackedAccounts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> История отслеживания
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {trackedAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="bg-card rounded-xl border border-border/50 p-4 card-shadow hover-lift transition-all group"
                >
                  <div className="flex items-center gap-3">
                    {acc.avatar_url ? (
                      <img src={acc.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/10 shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-full gradient-hero flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
                        {acc.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">@{acc.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatNum(Number(acc.followers || 0))} подписчиков
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => {
                          setUrl(acc.profile_url);
                          analyze(acc.profile_url);
                        }}
                        title="Обновить"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(acc.id)}
                        title="Удалить"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {formatNum(Number(acc.total_likes || 0))}</span>
                    <span className="flex items-center gap-1"><Video className="h-3 w-3" /> {formatNum(Number(acc.total_videos || 0))}</span>
                    {acc.verified && <span className="flex items-center gap-1 text-accent"><Check className="h-3 w-3" /> Верифицирован</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <VideoAnalysisDialog
        video={analysisVideo}
        open={!!analysisVideo}
        onOpenChange={(open) => { if (!open) setAnalysisVideo(null); }}
      />
    </AppLayout>
  );
}
