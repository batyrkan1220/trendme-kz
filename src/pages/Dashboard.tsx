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

export default function Dashboard() {
  const { user } = useAuth();
  const name = user?.email?.split("@")[0] || "друг";

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-8 animate-fade-in max-w-4xl">
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
      </div>
    </AppLayout>
  );
}
