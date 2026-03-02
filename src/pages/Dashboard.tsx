import { AppLayout } from "@/components/layout/AppLayout";
import { TrendingUp, Search, Video, UserCircle, BookOpen, ArrowRight, Flame, Eye, Heart, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const quickActions = [
  {
    label: "Тренды",
    desc: "Горячие видео прямо сейчас",
    icon: TrendingUp,
    path: "/trends",
    gradient: "from-pink-500 to-rose-600",
  },
  {
    label: "Поиск",
    desc: "Найти видео по ключевым словам",
    icon: Search,
    path: "/search",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    label: "Анализ видео",
    desc: "Разобрать любое видео по полочкам",
    icon: Video,
    path: "/video-analysis",
    gradient: "from-cyan-500 to-teal-600",
  },
  {
    label: "Анализ аккаунта",
    desc: "Статистика любого автора",
    icon: UserCircle,
    path: "/account-analysis",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    label: "Библиотека",
    desc: "Сохранённые видео и сценарии",
    icon: BookOpen,
    path: "/library",
    gradient: "from-emerald-500 to-green-600",
  },
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

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-8 animate-fade-in max-w-5xl">
        {/* Hero */}
        <div className="gradient-hero rounded-2xl p-8 glow-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Flame className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Привет, {name} 👋
              </h1>
              <p className="text-white/80 mt-1">
                Что будем исследовать сегодня?
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Быстрые действия</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.path}
                to={action.path}
                className="group bg-card rounded-2xl p-5 card-shadow border border-border/50 hover-lift card-shadow-hover transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shrink-0 shadow-md`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">{action.label}</h3>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{action.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Trending Videos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg gradient-card flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Топ тренды</h2>
            </div>
            <Link to="/trends" className="text-sm text-primary hover:underline flex items-center gap-1">
              Все тренды <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl p-4 card-shadow border border-border/50 animate-pulse">
                  <div className="aspect-video rounded-xl bg-muted mb-3" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : trendingVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingVideos.map((video) => (
                <a
                  key={video.id}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-card rounded-2xl overflow-hidden card-shadow border border-border/50 hover-lift card-shadow-hover transition-all duration-200"
                >
                  {video.cover_url ? (
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={video.cover_url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {video.trend_score != null && video.trend_score > 0 && (
                        <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                          🔥 {Math.round(video.trend_score)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <Video className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-sm font-medium text-foreground line-clamp-2 mb-2">
                      {video.caption || "Без описания"}
                    </p>
                    {video.author_username && (
                      <p className="text-xs text-muted-foreground mb-2">@{video.author_username}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> {formatNum(Number(video.views) || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5" /> {formatNum(Number(video.likes) || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" /> {formatNum(Number(video.comments) || 0)}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-8 card-shadow border border-border/50 text-center">
              <TrendingUp className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Пока нет данных о трендах</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Данные появятся после обновления трендов</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
