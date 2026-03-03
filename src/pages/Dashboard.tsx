import { AppLayout } from "@/components/layout/AppLayout";
import { TrendingUp, Search, Video, UserCircle, Star, ArrowRight, Eye, Heart, MessageCircle, Share2, Plus, Play, X, ExternalLink, Music, Zap, Trophy, Target } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const quickActions = [
  { label: "Тренды", desc: "Горячие видео", icon: TrendingUp, path: "/trends", emoji: "🔥" },
  { label: "Поиск", desc: "По ключевым словам", icon: Search, path: "/search", emoji: "🔍" },
  { label: "Анализ видео", desc: "Разбор видео", icon: Video, path: "/video-analysis", emoji: "🎬" },
  { label: "Анализ профиля", desc: "Статистика автора", icon: UserCircle, path: "/account-analysis", emoji: "👤" },
  { label: "Избранные", desc: "Сохранённое", icon: Star, path: "/library", emoji: "⭐" },
];

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

const getTimeAgo = (published_at: string | null) => {
  if (!published_at) return "";
  const h = Math.floor((Date.now() - new Date(published_at).getTime()) / 3600000);
  if (h < 1) return "только что";
  if (h < 24) return `${h}ч назад`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}д назад`;
  return `${Math.floor(d / 30)} мес. назад`;
};

type TrendTier = "strong" | "mid" | "micro";

const getTier = (views: number): TrendTier | null => {
  if (views >= 80_000) return "strong";
  if (views >= 15_000) return "mid";
  if (views >= 3_000) return "micro";
  return null;
};

const tierConfig: Record<TrendTier, { label: string; icon: any; className: string }> = {
  strong: { label: "Strong Trend", icon: Trophy, className: "bg-amber-500/90 text-white" },
  mid: { label: "Mid Trend", icon: Zap, className: "bg-primary/80 text-white" },
  micro: { label: "Micro Trend", icon: Target, className: "bg-primary/60 text-white" },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [playingId, setPlayingId] = useState<string | null>(null);

  const { data: trendingVideos = [], isLoading } = useQuery({
    queryKey: ["dashboard-trends"],
    queryFn: async () => {
      const { data } = await supabase
        .from("videos")
        .select("id, platform_video_id, caption, cover_url, author_username, author_avatar_url, views, likes, comments, shares, trend_score, velocity_views, url, published_at")
        .order("trend_score", { ascending: false })
        .limit(10);
      return data || [];
    },
    staleTime: 24 * 60 * 60 * 1000,
    refetchInterval: 24 * 60 * 60 * 1000,
  });

  const { data: favCount = 0 } = useQuery({
    queryKey: ["favorites-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("favorites")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: scriptsCount = 0 } = useQuery({
    queryKey: ["scripts-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("saved_scripts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count || 0;
    },
    enabled: !!user,
  });

  return (
    <AppLayout>
      <div className="p-3 md:p-6 lg:p-8 space-y-4 md:space-y-6 animate-fade-in w-full overflow-hidden">
        {/* Stats + Quick Actions row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
          <div className="bg-card rounded-xl border border-border/60 p-3 md:p-4 card-shadow flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Heart className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-foreground leading-none">{favCount}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">В избранном</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border/60 p-3 md:p-4 card-shadow flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-foreground leading-none">{trendingVideos.length}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">В трендах</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border/60 p-3 md:p-4 card-shadow flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-foreground leading-none">{scriptsCount}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Сценариев</p>
            </div>
          </div>
          <Link to="/search" className="bg-primary rounded-xl p-3 md:p-4 flex items-center gap-3 hover:bg-primary/90 transition-colors group">
            <div className="w-9 h-9 rounded-xl bg-primary-foreground/20 flex items-center justify-center shrink-0">
              <Plus className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary-foreground leading-none">Новый поиск</p>
              <p className="text-[10px] text-primary-foreground/70 mt-0.5">Найти видео</p>
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {quickActions.map((a) => (
            <Link
              key={a.path}
              to={a.path}
              className="flex items-center gap-2 bg-card rounded-xl px-3 py-2.5 border border-border/60 hover:border-primary/30 transition-colors shrink-0 group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <a.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground whitespace-nowrap">{a.label}</p>
                <p className="text-[10px] text-muted-foreground whitespace-nowrap">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Trending Videos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="section-label">🔥 Топ тренды</p>
            <Link to="/trends" className="text-xs text-primary hover:underline flex items-center gap-1 pr-3 font-semibold">
              Все тренды <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border/40 overflow-hidden animate-pulse">
                  <div className="aspect-[9/14] bg-muted m-2 rounded-2xl" />
                  <div className="px-3 py-3 space-y-2">
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : trendingVideos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
              {trendingVideos.map((video) => {
                const views = Number(video.views) || 0;
                const tier = getTier(views);
                const velViews = video.velocity_views || 0;
                const timeAgo = getTimeAgo(video.published_at);

                return (
                  <div
                    key={video.id}
                    className="group bg-card rounded-2xl border border-border/40 overflow-hidden hover:shadow-lg transition-shadow duration-200 relative flex flex-col"
                  >
                    <div className="relative aspect-[9/14] bg-black overflow-hidden rounded-2xl m-2">
                      {playingId === video.id ? (
                        <>
                          <iframe
                            src={`https://www.tiktok.com/player/v1/${video.platform_video_id}?music_info=1&description=0&muted=0&play_button=1&volume_control=1`}
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
                          {video.cover_url ? (
                            <img
                              src={video.cover_url}
                              alt=""
                              loading="lazy"
                              className="w-full h-full object-cover cursor-pointer"
                              onClick={() => setPlayingId(video.id)}
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center cursor-pointer bg-muted"
                              onClick={() => setPlayingId(video.id)}
                            >
                              <Play className="h-12 w-12 text-muted-foreground/30" />
                            </div>
                          )}

                          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-2.5 z-10 pointer-events-none">
                            <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm">
                              <Music className="h-3 w-3 text-foreground" />
                              <span className="text-[11px] font-bold text-foreground">TikTok</span>
                            </div>
                          </div>

                          {tier && (
                            <div className="absolute top-12 left-2.5 z-10 flex flex-col gap-1.5 pointer-events-none">
                              <div className={`flex items-center gap-1 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg ${tierConfig[tier].className}`}>
                                {(() => {
                                  const Icon = tierConfig[tier].icon;
                                  return <Icon className="h-3.5 w-3.5" />;
                                })()}
                                <span className="text-[10px] font-bold">{tierConfig[tier].label}</span>
                              </div>
                              {velViews > 10 && (
                                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md rounded-full px-2 py-0.5">
                                  <TrendingUp className="h-3 w-3 text-white" />
                                  <span className="text-[9px] font-bold text-white">+{fmt(Math.round(velViews))}/ч</span>
                                </div>
                              )}
                            </div>
                          )}

                          <button
                            onClick={(e) => { e.stopPropagation(); window.open(video.url, '_blank'); }}
                            className="absolute top-12 right-2.5 z-10 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-foreground" />
                          </button>

                          <div
                            className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
                            onClick={() => setPlayingId(video.id)}
                          >
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center">
                              <Play className="h-6 w-6 md:h-7 md:w-7 text-white fill-white ml-0.5" />
                            </div>
                          </div>

                          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-around px-2 py-2 border-b border-border/30">
                      <span className="flex flex-col items-center gap-0.5">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-[11px] font-bold text-foreground">{fmt(Number(video.views))}</span>
                      </span>
                      <span className="flex flex-col items-center gap-0.5">
                        <Heart className="h-4 w-4 text-muted-foreground" />
                        <span className="text-[11px] font-bold text-foreground">{fmt(Number(video.likes))}</span>
                      </span>
                      <span className="flex flex-col items-center gap-0.5">
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-[11px] font-bold text-foreground">{fmt(Number(video.comments))}</span>
                      </span>
                      <span className="flex flex-col items-center gap-0.5">
                        <Share2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-[11px] font-bold text-foreground">{fmt(Number(video.shares || 0))}</span>
                      </span>
                    </div>

                    <div className="px-3 pt-3 flex items-center gap-2">
                      {video.author_avatar_url ? (
                        <img src={video.author_avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-border/50 flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
                      )}
                      <span className="text-sm font-semibold text-foreground truncate">
                        @{video.author_username}
                      </span>
                    </div>

                    <div className="px-3 pt-1.5 pb-1">
                      <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">
                        {video.caption || "Без описания"}
                      </p>
                    </div>

                    {timeAgo && (
                      <div className="px-3 pb-3">
                        <span className="text-[11px] text-muted-foreground">{timeAgo}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-10 md:p-14 border border-border/60 text-center card-shadow">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-primary/40" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Пока нет данных о трендах</p>
              <p className="text-xs text-muted-foreground">Данные появятся после обновления</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
