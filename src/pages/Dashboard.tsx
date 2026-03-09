import { AppLayout } from "@/components/layout/AppLayout";
import { Search, TrendingUp, Video, UserCircle, Lock, ArrowRight, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator";

const actions = [
  {
    icon: Search,
    title: "Поиск по слову",
    description: "Найдите вирусные видео по ключевым словам",
    path: "/search",
    iconBg: "bg-blue-500",
    emoji: "🔍",
  },
  {
    icon: TrendingUp,
    title: "Тренды",
    description: "Проверьте найденные видео в радаре",
    path: "/trends",
    iconBg: "bg-orange-500",
    emoji: "📈",
  },
  {
    icon: Video,
    title: "Анализ видео",
    description: "Разберите любое видео по полочкам с AI",
    path: "/video-analysis",
    iconBg: "bg-purple-500",
    emoji: "🎬",
  },
  {
    icon: UserCircle,
    title: "Анализ профиля",
    description: "Изучите стратегию любого автора",
    path: "/account-analysis",
    iconBg: "bg-emerald-500",
    emoji: "👤",
  },
];

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
  const greeting = displayName ? `Привет, ${displayName} 👋` : "Привет 👋";

  const handleRefresh = useCallback(async () => {
    // Re-fetch profile name
    if (user) {
      const { data } = await supabase.from("profiles").select("name").eq("user_id", user.id).maybeSingle();
      setName(data?.name ?? null);
    }
    // Small delay for UX feel
    await new Promise(r => setTimeout(r, 600));
  }, [user]);

  const { containerRef, pullDistance, isRefreshing, progress } = usePullToRefresh({ onRefresh: handleRefresh });

  return (
    <AppLayout>
      <div ref={containerRef} className="px-4 md:px-8 lg:px-12 max-w-3xl mx-auto w-full pt-6 md:pt-8 pb-16 md:pb-12 overflow-x-hidden flex flex-col justify-center gap-4 md:gap-8" style={{ minHeight: "calc(100dvh - 6rem)", paddingTop: "max(env(safe-area-inset-top, 0px) + 24px, 24px)" }}>
        <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} progress={progress} />
        
        {/* Greeting */}
        <div className="text-center">
          <h1 className="text-lg md:text-3xl font-bold text-foreground mb-0.5 md:mb-1">
            {greeting}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Что будем делать сегодня?
          </p>
        </div>

        {/* Quick Actions — Mobile: list, Desktop: grid */}
        {/* Mobile list */}
        <div className="md:hidden rounded-2xl border border-border/50 bg-card overflow-hidden divide-y divide-border/40">
          {actions.map((action, idx) => (
            <Link
              key={action.path}
              to={action.path}
              className="group flex items-center gap-3.5 px-4 py-3.5 hover:bg-muted/50 active:bg-muted/70 active:scale-[0.98] transition-all duration-150"
              style={{ animation: `slide-up 0.3s ease-out ${idx * 60}ms both` }}
            >
              <div className={`shrink-0 h-10 w-10 rounded-xl ${action.iconBg} flex items-center justify-center shadow-sm`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">{action.title}</p>
                <p className="text-[11px] text-muted-foreground leading-snug truncate">{action.description}</p>
              </div>
              <ChevronRight className="shrink-0 h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>

        {/* Desktop grid */}
        <div className="hidden md:grid grid-cols-3 gap-4">
          {actions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className="group relative flex flex-col items-center text-center gap-3 p-6 rounded-2xl border border-border/40 bg-card hover:border-primary/30 hover:shadow-xl active:scale-[0.98] transition-all duration-300 overflow-hidden"
            >
              <div className={`h-12 w-12 rounded-xl ${action.iconBg} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-base text-foreground">{action.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Usage limits widget for trial users */}
        {hasActiveSubscription && isFreeTrial && limits && !subLoading && (
          <div className="rounded-2xl border border-border/50 bg-card p-4 md:p-6">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="font-bold text-foreground text-sm md:text-base">Ваши лимиты</p>
                <p className="text-[11px] md:text-xs text-muted-foreground">Тариф: Демо режим</p>
              </div>
              <Link
                to="/subscription"
                className="inline-flex items-center gap-1 text-[11px] md:text-xs font-semibold text-primary hover:underline bg-primary/10 rounded-lg px-2.5 py-1.5"
              >
                Улучшить <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="border-t border-border/40 my-3" />
            <div className="grid grid-cols-2 gap-2.5 md:gap-3">
              {([
                { key: "search" as const, label: "Поиск", limit: limits.search },
                { key: "video_analysis" as const, label: "Анализ видео", limit: limits.video_analysis },
                { key: "account_analysis" as const, label: "Анализ профиля", limit: limits.account_analysis },
                { key: "ai_script" as const, label: "AI Сценарий", limit: limits.ai_script },
              ]).filter(i => i.limit != null).map(item => {
                const remaining = getRemaining(item.key);
                const total = item.limit!;
                const used = total - (remaining ?? 0);
                const pct = total > 0 ? ((remaining ?? 0) / total) * 100 : 0;
                return (
                  <div key={item.key} className="rounded-xl bg-muted/40 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] md:text-xs font-medium text-muted-foreground">{item.label}</span>
                      <span className={`text-[11px] md:text-xs font-bold ${remaining === 0 ? 'text-destructive' : 'text-foreground'}`}>
                        {remaining}/{total}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-border/60 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: pct > 0
                            ? "hsl(142 71% 45%)"
                            : "hsl(var(--destructive))",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Subscription banner — only for trial users */}
        {hasActiveSubscription && isFreeTrial && !subLoading && (
          <Link
            to="/subscription"
            className="group rounded-2xl border border-primary/20 p-4 md:p-5 flex items-center gap-4 hover:border-primary/40 transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary) / 0.06) 0%, hsl(var(--primary) / 0.02) 100%)",
            }}
          >
            <div className="h-10 w-10 md:h-11 md:w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-[13px] md:text-sm">Активируйте полный доступ</p>
              <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5">Все функции без ограничений</p>
            </div>
            <ChevronRight className="shrink-0 h-5 w-5 text-primary/60 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>
    </AppLayout>
  );
}
