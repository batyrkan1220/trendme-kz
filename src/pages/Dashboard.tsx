import { AppLayout } from "@/components/layout/AppLayout";
import { TrendingUp, Search, Video, UserCircle, BookOpen, ArrowRight, Eye, Heart, MessageCircle, Sparkles, Plus, Play, X, ExternalLink, Music, Share2, Flame, Rocket } from "lucide-react";
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
  { label: "Библиотека", desc: "Сохранённое", icon: BookOpen, path: "/library", emoji: "📚" },
];

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function Dashboard() {
  const { user } = useAuth();
  const name = user?.email?.split("@")[0] || "друг";
  const [playingId, setPlayingId] = useState<string | null>(null);

  const { data: trendingVideos = [], isLoading } = useQuery({
    queryKey: ["dashboard-trends"],
    queryFn: async () => {
      const { data } = await supabase
        .from("videos")
        .select("id, platform_video_id, caption, cover_url, author_username, author_avatar_url, views, likes, comments, shares, trend_score, velocity_views, url, published_at")
        .order("trend_score", { ascending: false })
        .limit(6);
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

  return (
    <AppLayout>
      <div className="p-3 md:p-6 lg:p-8 space-y-4 md:space-y-7 animate-fade-in max-w-5xl w-full overflow-hidden">
        {/* Hero */}
        <div className="bg-primary rounded-xl md:rounded-2xl p-4 md:p-7 relative overflow-hidden">
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-base md:text-xl font-bold text-primary-foreground">
                Привет, {name} 👋
              </h1>
              <p className="text-white/70 text-xs md:text-sm mt-1">
                Что будем исследовать сегодня?
              </p>
            </div>
            <Link
              to="/search"
              className="hidden sm:flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-white/30 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Новый поиск
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <p className="section-label">Быстрые действия</p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {quickActions.map((a) => (
              <Link
                key={a.path}
                to={a.path}
                className="flex items-center gap-2 bg-card rounded-xl px-3 py-2 md:px-4 md:py-3 border border-border/60 hover-lift card-shadow-hover transition-all min-w-[140px] md:min-w-[180px] group"
              >
                <span className="text-lg">{a.emoji}</span>
                <div>
                  <p className="text-xs md:text-sm font-semibold text-foreground">{a.label}</p>
                  <p className="text-[10px] md:text-[11px] text-muted-foreground">{a.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <div className="bg-card rounded-xl border border-border/60 px-3 md:px-5 py-2 md:py-3 card-shadow flex items-center gap-2 md:gap-3">
            <Heart className="h-4 w-4 text-primary" />
            <div>
              <p className="text-base md:text-lg font-bold text-foreground">{favCount}</p>
              <p className="text-[10px] md:text-[11px] text-muted-foreground">В избранном</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border/60 px-3 md:px-5 py-2 md:py-3 card-shadow flex items-center gap-2 md:gap-3">
            <TrendingUp className="h-4 w-4 text-accent" />
            <div>
              <p className="text-base md:text-lg font-bold text-foreground">{trendingVideos.length}</p>
              <p className="text-[10px] md:text-[11px] text-muted-foreground">Видео в трендах</p>
            </div>
          </div>
        </div>

        {/* Trending Videos — same style as Trends page */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="section-label">Топ тренды</p>
            <Link to="/trends" className="text-xs text-primary hover:underline flex items-center gap-1 pr-3">
              Все тренды <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
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
            <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-3">
              {trendingVideos.map((video) => {
                const score = video.trend_score || 0;
                const velViews = video.velocity_views || 0;
                const isRocket = score > 500;
                const isFire = score > 100;

                return (
                  <div
                    key={video.id}
                    className="group bg-card rounded-2xl border border-border/40 overflow-hidden hover:shadow-lg transition-shadow duration-200 relative flex flex-col"
                  >
                    {/* Video area */}
                    <div className="relative aspect-[9/14] bg-black overflow-hidden rounded-2xl m-1.5 md:m-2">
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

                          {/* TikTok header */}
                          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-2 z-10 pointer-events-none">
                            <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-sm">
                              <Music className="h-3 w-3 text-foreground" />
                              <span className="text-[10px] font-bold text-foreground">TikTok</span>
                            </div>
                          </div>

                          {/* Trend indicators */}
                          {isFire && (
                            <div className="absolute top-10 left-2 z-10 flex flex-col gap-1 pointer-events-none">
                              {isRocket ? (
                                <div className="flex items-center gap-1 bg-orange-500/90 backdrop-blur-sm rounded-full px-1.5 py-0.5 shadow-lg animate-[pulse_1.5s_ease-in-out_infinite]">
                                  <Rocket className="h-3 w-3 text-white" />
                                  <span className="text-[9px] font-bold text-white">Взлетает!</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 bg-red-500/80 backdrop-blur-sm rounded-full px-1.5 py-0.5 shadow-lg">
                                  <Flame className="h-3 w-3 text-white" />
                                  <span className="text-[9px] font-bold text-white">В тренде</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Open in TikTok */}
                          <button
                            onClick={(e) => { e.stopPropagation(); window.open(video.url, '_blank'); }}
                            className="absolute top-10 right-2 z-10 w-6 h-6 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                          >
                            <ExternalLink className="h-3 w-3 text-foreground" />
                          </button>

                          {/* Play button center - always visible on mobile */}
                          <div
                            className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
                            onClick={() => setPlayingId(video.id)}
                          >
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center">
                              <Play className="h-6 w-6 md:h-7 md:w-7 text-white fill-white ml-0.5" />
                            </div>
                          </div>

                          {/* Bottom gradient */}
                          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        </>
                      )}
                    </div>

                    {/* Stats bar - outside video area */}
                    <div className="flex items-center justify-around px-1 md:px-2 py-1.5 md:py-2 border-b border-border/30">
                      <span className="flex flex-col items-center gap-0.5">
                        <Eye className="h-3 md:h-4 w-3 md:w-4 text-muted-foreground" />
                        <span className="text-[9px] md:text-[11px] font-bold text-foreground">{fmt(Number(video.views))}</span>
                      </span>
                      <span className="flex flex-col items-center gap-0.5">
                        <Heart className="h-3 md:h-4 w-3 md:w-4 text-muted-foreground" />
                        <span className="text-[9px] md:text-[11px] font-bold text-foreground">{fmt(Number(video.likes))}</span>
                      </span>
                      <span className="flex flex-col items-center gap-0.5">
                        <MessageCircle className="h-3 md:h-4 w-3 md:w-4 text-muted-foreground" />
                        <span className="text-[9px] md:text-[11px] font-bold text-foreground">{fmt(Number(video.comments))}</span>
                      </span>
                    </div>

                    {/* Author row */}
                    <div className="px-2 md:px-3 pt-2 flex items-center gap-2">
                      {video.author_avatar_url ? (
                        <img src={video.author_avatar_url} alt="" className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover border-2 border-border/50 flex-shrink-0" />
                      ) : (
                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-muted flex-shrink-0" />
                      )}
                      <span className="text-[11px] md:text-sm font-semibold text-foreground truncate">
                        @{video.author_username}
                      </span>
                    </div>

                    {/* Caption */}
                    <div className="px-2 md:px-3 pt-1 pb-2 md:pb-3">
                      <p className="text-[10px] md:text-xs text-foreground/80 line-clamp-2 leading-relaxed">
                        {video.caption || "Без описания"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-card rounded-xl p-10 border border-border/60 text-center card-shadow">
              <TrendingUp className="h-10 w-10 text-muted-foreground/15 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Пока нет данных о трендах</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Данные появятся после обновления</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
