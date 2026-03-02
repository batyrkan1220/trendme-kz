import { AppLayout } from "@/components/layout/AppLayout";
import { TrendingUp, Search, Video, UserCircle, BookOpen, ArrowRight, Eye, Heart, MessageCircle, Sparkles, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const quickActions = [
  { label: "Тренды", desc: "Горячие видео", icon: TrendingUp, path: "/trends", emoji: "🔥" },
  { label: "Поиск", desc: "По ключевым словам", icon: Search, path: "/search", emoji: "🔍" },
  { label: "Анализ видео", desc: "Разбор видео", icon: Video, path: "/video-analysis", emoji: "🎬" },
  { label: "Анализ профиля", desc: "Статистика автора", icon: UserCircle, path: "/account-analysis", emoji: "👤" },
  { label: "Библиотека", desc: "Сохранённое", icon: BookOpen, path: "/library", emoji: "📚" },
];

function formatNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function Dashboard() {
  const { user } = useAuth();
  const name = user?.email?.split("@")[0] || "друг";

  const { data: trendingVideos = [], isLoading } = useQuery({
    queryKey: ["dashboard-trends"],
    queryFn: async () => {
      const { data } = await supabase
        .from("videos")
        .select("id, caption, cover_url, author_username, views, likes, comments, trend_score, url, published_at")
        .order("trend_score", { ascending: false })
        .limit(6);
      return data || [];
    },
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
      <div className="p-3 md:p-6 lg:p-8 space-y-4 md:space-y-7 animate-fade-in max-w-5xl">
        {/* Hero */}
        <div className="gradient-hero rounded-xl md:rounded-2xl p-4 md:p-7 glow-primary relative overflow-hidden">
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white">
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

        {/* Quick Actions - horizontal scrollable */}
        <div className="space-y-3">
          <p className="section-label">Быстрые действия</p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {quickActions.map((a) => (
              <Link
                key={a.path}
                to={a.path}
                className="flex items-center gap-3 bg-card rounded-xl px-3 md:px-4 py-2.5 md:py-3 border border-border/60 hover-lift card-shadow-hover transition-all min-w-[160px] md:min-w-[180px] group"
              >
                <span className="text-xl">{a.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{a.label}</p>
                  <p className="text-[11px] text-muted-foreground">{a.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 md:gap-4">
          <div className="bg-card rounded-xl border border-border/60 px-4 md:px-5 py-2.5 md:py-3 card-shadow flex items-center gap-3 flex-1 sm:flex-initial">
            <Heart className="h-4 w-4 text-primary" />
            <div>
              <p className="text-base md:text-lg font-bold text-foreground">{favCount}</p>
              <p className="text-[10px] md:text-[11px] text-muted-foreground">В избранном</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border/60 px-4 md:px-5 py-2.5 md:py-3 card-shadow flex items-center gap-3 flex-1 sm:flex-initial">
            <TrendingUp className="h-4 w-4 text-accent" />
            <div>
              <p className="text-base md:text-lg font-bold text-foreground">{trendingVideos.length}</p>
              <p className="text-[10px] md:text-[11px] text-muted-foreground">Видео в трендах</p>
            </div>
          </div>
        </div>

        {/* Trending Videos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="section-label">Топ тренды</p>
            <Link to="/trends" className="text-xs text-primary hover:underline flex items-center gap-1 pr-3">
              Все тренды <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl border border-border/60 overflow-hidden animate-pulse">
                  <div className="aspect-video bg-muted" />
                  <div className="p-3 space-y-2">
                    <div className="h-3.5 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : trendingVideos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {trendingVideos.map((video) => (
                <a
                  key={video.id}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-card rounded-xl overflow-hidden border border-border/60 hover-lift card-shadow-hover transition-all"
                >
                  {video.cover_url ? (
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={video.cover_url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {video.trend_score != null && video.trend_score > 0 && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                          🔥 {Math.round(video.trend_score)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <Video className="h-8 w-8 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
                      {video.caption || "Без описания"}
                    </p>
                    {video.author_username && (
                      <p className="text-[11px] text-primary font-medium mt-1">@{video.author_username}</p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {formatNum(Number(video.views) || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" /> {formatNum(Number(video.likes) || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" /> {formatNum(Number(video.comments) || 0)}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
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
