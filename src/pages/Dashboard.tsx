import { AppLayout } from "@/components/layout/AppLayout";
import { TrendingUp, Search, Video, UserCircle, BookOpen, ArrowRight, Zap, Eye, Heart, MessageCircle, Sparkles } from "lucide-react";
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
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
  },
  {
    label: "Поиск",
    desc: "Найти видео по ключевым словам",
    icon: Search,
    path: "/search",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  {
    label: "Анализ видео",
    desc: "Разобрать любое видео",
    icon: Video,
    path: "/video-analysis",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  {
    label: "Анализ аккаунта",
    desc: "Статистика автора",
    icon: UserCircle,
    path: "/account-analysis",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  {
    label: "Библиотека",
    desc: "Сохранённые материалы",
    icon: BookOpen,
    path: "/library",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
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
        <div className="relative rounded-2xl overflow-hidden">
          <div className="gradient-hero p-8 glow-primary relative">
            <div className="absolute inset-0 dot-pattern opacity-30" />
            <div className="relative flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl glass flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Привет, {name} 👋
                </h1>
                <p className="text-white/70 mt-1">
                  Что будем исследовать сегодня?
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Быстрые действия</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.path}
                to={action.path}
                className={`group rounded-2xl p-4 border transition-all duration-200 hover-lift ${action.bg} ${action.border} hover:border-opacity-50`}
              >
                <div className="flex items-center gap-3">
                  <action.icon className={`h-5 w-5 ${action.color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground">{action.label}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Trending Videos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Топ тренды</h2>
            </div>
            <Link to="/trends" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              Все тренды <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl p-3 glass animate-pulse">
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
                  className="group rounded-2xl overflow-hidden glass hover-lift transition-all duration-200 hover:border-primary/30"
                >
                  {video.cover_url ? (
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={video.cover_url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      {video.trend_score != null && video.trend_score > 0 && (
                        <div className="absolute top-2 right-2 bg-primary/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                          🔥 {Math.round(video.trend_score)}
                        </div>
                      )}
                      {video.author_username && (
                        <div className="absolute bottom-2 left-2 text-white/90 text-[11px] font-medium backdrop-blur-sm bg-black/30 px-2 py-0.5 rounded-full">
                          @{video.author_username}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted/30 flex items-center justify-center">
                      <Video className="h-8 w-8 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
                      {video.caption || "Без описания"}
                    </p>
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
            <div className="rounded-2xl p-10 glass text-center neon-border">
              <TrendingUp className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Пока нет данных о трендах</p>
              <p className="text-muted-foreground/50 text-xs mt-1">Данные появятся после обновления</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
