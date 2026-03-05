import { AppLayout } from "@/components/layout/AppLayout";
import { Search, TrendingUp, Lock, Video, Sparkles, UserCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

export default function Dashboard() {
  const { user } = useAuth();
  const { limits, getRemaining, isFreeTrial, hasActiveSubscription, isLoading: subLoading } = useSubscription();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setName(data?.name ?? null));
  }, [user]);

  const displayName = name || user?.email?.split("@")[0] || "";
  const greeting = displayName ? `Привет, ${displayName}` : "Привет";

  const actions = [
    {
      icon: Search,
      title: "Поиск по слову",
      description: "Найдите вирусные видео по ключевым словам",
      path: "/search",
      iconColor: "text-blue-500",
    },
    {
      icon: TrendingUp,
      title: "Тренды",
      description: "Проверьте найденные видео в радаре",
      path: "/trends",
      iconColor: "text-orange-500",
    },
    {
      icon: Video,
      title: "Анализ видео",
      description: "Разберите любое видео по полочкам с AI",
      path: "/video-analysis",
      iconColor: "text-purple-500",
    },
    {
      icon: Sparkles,
      title: "AI Сценарий",
      description: "Создайте вирусный сценарий на основе тренда",
      path: "/ai-script",
      iconColor: "text-violet-500",
    },
    {
      icon: UserCircle,
      title: "Анализ профиля",
      description: "Изучите стратегию любого автора",
      path: "/account-analysis",
      iconColor: "text-green-500",
    },
  ];

  return (
    <AppLayout>
      <div className="px-3 md:px-8 lg:px-12 max-w-3xl mx-auto w-full animate-fade-in pb-32 md:pb-12 overflow-x-hidden min-h-[calc(100dvh-4rem)] flex flex-col justify-center">
        {/* Greeting */}
        <div className="text-center mb-5 md:mb-10">
          <p className="text-muted-foreground text-xs md:text-sm mb-0.5">👋 {greeting}</p>
          <h1 className="text-base md:text-2xl font-bold text-foreground">
            Найдем вирусные видео?)
          </h1>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2.5 md:space-y-4">
          {/* Row 1: Поиск + Тренды */}
          <div className="grid grid-cols-2 gap-2.5 md:gap-4">
            {actions.slice(0, 2).map((action) => (
              <Link
                key={action.path}
                to={action.path}
                className="group flex flex-col items-center text-center gap-2 p-3 md:p-7 rounded-xl md:rounded-2xl border border-border/60 bg-card active:scale-[0.97] hover:border-primary/30 hover:shadow-lg transition-all duration-200"
              >
                <div className="h-9 w-9 md:h-12 md:w-12 rounded-lg md:rounded-xl bg-muted/60 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <action.icon className={`h-4.5 w-4.5 md:h-6 md:w-6 ${action.iconColor}`} />
                </div>
                <div>
                  <p className="font-semibold text-[13px] md:text-base text-foreground">{action.title}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 leading-snug">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Row 2: Анализ видео + AI Сценарий + Анализ профиля */}
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            {actions.slice(2).map((action) => (
              <Link
                key={action.path}
                to={action.path}
                className="group flex flex-col items-center text-center gap-1.5 p-2.5 md:p-6 rounded-xl md:rounded-2xl border border-border/60 bg-card active:scale-[0.97] hover:border-primary/30 hover:shadow-lg transition-all duration-200"
              >
                <div className="h-8 w-8 md:h-11 md:w-11 rounded-lg md:rounded-xl bg-muted/60 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <action.icon className={`h-4 w-4 md:h-5 md:w-5 ${action.iconColor}`} />
                </div>
                <div>
                  <p className="font-semibold text-[11px] md:text-sm text-foreground leading-tight">{action.title}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 leading-snug hidden md:block">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Usage limits widget for trial users */}
        {hasActiveSubscription && isFreeTrial && limits && !subLoading && (
          <div className="mt-5 md:mt-8 rounded-xl md:rounded-2xl border border-border/60 bg-card p-4 md:p-6">
            <p className="font-bold text-foreground text-[13px] md:text-base mb-3">Ваши лимиты</p>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              {([
                { key: "search" as const, label: "Іздеу", limit: limits.search },
                { key: "video_analysis" as const, label: "Видео анализ", limit: limits.video_analysis },
                { key: "account_analysis" as const, label: "Профиль анализ", limit: limits.account_analysis },
                { key: "ai_script" as const, label: "AI Сценарий", limit: limits.ai_script },
              ]).filter(i => i.limit != null).map(item => {
                const remaining = getRemaining(item.key);
                const total = item.limit!;
                const used = total - (remaining ?? 0);
                const pct = total > 0 ? (used / total) * 100 : 0;
                return (
                  <div key={item.key} className="rounded-lg bg-muted/50 p-2.5 md:p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] md:text-xs font-medium text-muted-foreground">{item.label}</span>
                      <span className="text-[11px] md:text-xs font-bold text-foreground">{remaining}/{total}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 80 ? "hsl(var(--destructive))" : "hsl(var(--primary))",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <Link
              to="/subscription"
              className="mt-3 inline-flex items-center gap-1.5 text-[11px] md:text-xs font-medium text-primary hover:underline"
            >
              Тарифті жаңарту →
            </Link>
          </div>
        )}

        {/* Demo banner */}
        <div className="mt-5 md:mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4 rounded-xl md:rounded-2xl bg-muted/50 p-3.5 md:p-6">
          <div>
            <p className="font-bold text-foreground text-[13px] md:text-base">Вы находитесь в демо-режиме</p>
            <p className="text-[11px] md:text-sm text-muted-foreground mt-0.5">Чтобы открыть все функции активируйте тариф</p>
          </div>
          <Link
            to="/subscription"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[13px] md:text-sm px-4 py-2.5 md:px-5 md:py-3 transition-colors w-full sm:w-auto justify-center"
          >
            <Lock className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Выбрать тариф
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
