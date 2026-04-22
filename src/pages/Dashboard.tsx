import { AppLayout } from "@/components/layout/AppLayout";
import { Search, TrendingUp, Video, UserCircle, Lock, ArrowRight, ChevronRight, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator";
import { useLocalFavorites } from "@/hooks/useLocalFavorites";

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
];

export default function Dashboard() {
  const { user } = useAuth();
  const { subscription, plan, limits, getRemaining, isFreeTrial, hasActiveSubscription, isLoading: subLoading } = useSubscription();
  const { favorites } = useLocalFavorites();
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
        <UsageLimitsWidget />

        {/* Subscription status banner — Trial / Active / Past due */}
        {subscription && !subLoading && (() => {
          const sub: any = subscription;
          const planName = sub.plans?.name || "—";
          const isPaid = (sub.plans?.price_rub || 0) > 0;
          const expiresAt = sub.expires_at ? new Date(sub.expires_at) : null;
          const expired = expiresAt ? expiresAt.getTime() < Date.now() : !hasActiveSubscription;
          const daysLeft = expiresAt
            ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000))
            : null;
          const expiresStr = expiresAt
            ? expiresAt.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
            : "—";

          type Status = "trial" | "active" | "past_due";
          const status: Status = expired ? "past_due" : isPaid ? "active" : "trial";

          const cfg = {
            trial: {
              label: "Пробный период",
              dotClass: "bg-amber-500",
              borderClass: "border-amber-500/30",
              bgStyle: "linear-gradient(135deg, hsl(45 90% 55% / 0.08) 0%, hsl(45 90% 55% / 0.02) 100%)",
              cta: "Улучшить",
              hint: "Полный доступ ко всем функциям",
            },
            active: {
              label: "Подписка активна",
              dotClass: "bg-emerald-500",
              borderClass: daysLeft !== null && daysLeft <= 7 ? "border-viral/40" : "border-emerald-500/20",
              bgStyle: "linear-gradient(135deg, hsl(142 71% 45% / 0.06) 0%, hsl(142 71% 45% / 0.02) 100%)",
              cta: "Подробнее",
              hint: null as string | null,
            },
            past_due: {
              label: "Подписка истекла",
              dotClass: "bg-destructive",
              borderClass: "border-destructive/40",
              bgStyle: "linear-gradient(135deg, hsl(var(--destructive) / 0.08) 0%, hsl(var(--destructive) / 0.02) 100%)",
              cta: "Продлить",
              hint: "Восстановите доступ к платным функциям",
            },
          }[status];

          return (
            <Link
              to="/subscription"
              className={`group rounded-2xl border ${cfg.borderClass} p-4 md:p-5 flex items-center gap-4 hover:opacity-90 transition-all duration-200`}
              style={{ background: cfg.bgStyle }}
            >
              <div className="flex flex-col items-center justify-center shrink-0 h-11 w-11 rounded-xl bg-background/60 border border-border/40">
                <span className={`h-2 w-2 rounded-full ${cfg.dotClass} animate-pulse`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-foreground text-[13px] md:text-sm">{cfg.label}</p>
                  <span className="text-[11px] md:text-xs text-muted-foreground">·</span>
                  <p className="text-[11px] md:text-xs font-semibold text-foreground/80 truncate">{planName}</p>
                </div>
                <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5 truncate">
                  {status === "trial"
                    ? cfg.hint
                    : status === "past_due"
                    ? `Истёк ${expiresStr}`
                    : `Осталось ${daysLeft ?? 0} дн. · до ${expiresStr}`}

                </p>
              </div>
              <div className="hidden md:flex items-center gap-1 text-[12px] font-semibold text-foreground/70 group-hover:text-foreground">
                {cfg.cta}
                <ChevronRight className="h-4 w-4" />
              </div>
              <ChevronRight className="md:hidden shrink-0 h-5 w-5 text-foreground/40 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          );
        })()}
      </div>
    </AppLayout>
  );
}
