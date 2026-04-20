import { AppLayout } from "@/components/layout/AppLayout";
import { trackInitiateCheckout } from "@/components/TrackingPixels";
import { Check, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const subtitles: Record<string, string> = {
  "Пробный": "Для первого знакомства",
  "1 мес": "Для активных креаторов",
  "3 мес": "Лучшая цена · скидка 15%",
};

const displayNames: Record<string, string> = {
  "Пробный": "Демо",
};

export default function Pricing() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["plans-public"],
    queryFn: async () => {
      const { data } = await supabase
        .from("plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      return data || [];
    },
    staleTime: 60_000,
  });

  const { data: userSub } = useQuery({
    queryKey: ["user-subscription", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_subscriptions")
        .select("*, plans(name)")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const activePlanName = (userSub as any)?.plans?.name;
  const [loadingPlanId] = useState<string | null>(null);

  const handlePayment = (planId: string) => {
    const plan = plans.find((p: any) => p.id === planId);
    if (!plan) return;
    trackInitiateCheckout(plan.name, plan.price_rub);
    const phone = "77770145874";
    const duration = plan.duration_days === 90 ? "3-месячную" : "1-месячную";
    const message = `Я хочу Купить ${duration} подписку на платформу trendme.kz`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const getMonthlyPrice = (plan: any) => {
    if (plan.price_rub === 0) return 0;
    if (plan.duration_days === 90) return Math.round(plan.price_rub / 3);
    return plan.price_rub;
  };

  // On mobile, paid first
  const sortedPlans = useMemo(() => {
    if (!isMobile) return plans;
    const paid = plans.filter((p: any) => p.price_rub > 0).sort((a: any, b: any) => a.sort_order - b.sort_order);
    const free = plans.filter((p: any) => p.price_rub === 0);
    return [...paid, ...free];
  }, [plans, isMobile]);

  return (
    <AppLayout>
      <section className="py-12 md:py-20 bg-background-subtle min-h-full">
        <div className="max-w-6xl mx-auto px-5 md:px-6">
          {/* Header — landing style */}
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-foreground bg-viral px-3 py-1 rounded-full">Тарифы</span>
            <h1 className="mt-3 text-[clamp(1.75rem,3.5vw,2.75rem)] font-bold tracking-tight text-foreground">
              Простые тарифы для любого масштаба
            </h1>
            <p className="mt-3 md:mt-4 text-[15px] md:text-[17px] text-muted-foreground leading-relaxed">
              Начните бесплатно. Отмените в любой момент.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-[440px] rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              {sortedPlans.map((plan: any) => {
                const isPaid = plan.price_rub > 0;
                const isFeatured = plan.duration_days === 30 && plan.price_rub > 0;
                const isActive = activePlanName === plan.name;
                const features = Array.isArray(plan.features) ? plan.features as string[] : [];
                const usageLimits = plan.usage_limits as Record<string, number> | null;
                const isFree = plan.price_rub === 0;
                const monthlyPrice = getMonthlyPrice(plan);
                const displayName = displayNames[plan.name] || plan.name;

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative rounded-2xl p-7 md:p-8 transition-all hover:-translate-y-1 flex flex-col",
                      isFeatured
                        ? "bg-foreground text-background border border-foreground shadow-card"
                        : "bg-card border border-border shadow-card-hover"
                    )}
                  >
                    {isFeatured && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-viral text-foreground shadow-soft">
                        ★ Популярный
                      </span>
                    )}

                    {/* Plan name */}
                    <div className={cn(
                      "text-[14px] font-semibold",
                      isFeatured ? "text-background/70" : "text-muted-foreground"
                    )}>
                      {displayName}
                    </div>

                    {/* Price */}
                    <div className="mt-3 flex items-baseline gap-1">
                      {isFree ? (
                        <span className="text-[36px] md:text-[44px] font-bold tracking-tight">
                          Бесплатно
                        </span>
                      ) : (
                        <>
                          <span className="text-[36px] md:text-[44px] font-bold tracking-tight">
                            {plan.price_rub.toLocaleString("ru-RU")}₸
                          </span>
                          <span className={cn(
                            "text-[14px]",
                            isFeatured ? "text-background/70" : "text-muted-foreground"
                          )}>
                            {plan.duration_days === 90 ? "/3 мес" : "/мес"}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Subtitle / monthly */}
                    {plan.duration_days === 90 && !isFree ? (
                      <p className={cn(
                        "mt-2 text-[14px]",
                        isFeatured ? "text-background/70" : "text-muted-foreground"
                      )}>
                        {monthlyPrice.toLocaleString("ru-RU")}₸ / мес · скидка 15%
                      </p>
                    ) : (
                      <p className={cn(
                        "mt-2 text-[14px]",
                        isFeatured ? "text-background/70" : "text-muted-foreground"
                      )}>
                        {subtitles[plan.name] || ""}
                      </p>
                    )}

                    {/* CTA */}
                    {isPaid ? (
                      <button
                        disabled={isActive || loadingPlanId === plan.id}
                        onClick={() => { if (!isActive) handlePayment(plan.id); }}
                        className={cn(
                          "mt-6 inline-flex w-full justify-center items-center py-3 rounded-xl text-[14px] font-semibold transition disabled:cursor-default",
                          isActive
                            ? isFeatured
                              ? "bg-background/10 text-background/60"
                              : "bg-muted text-muted-foreground"
                            : isFeatured
                              ? "bg-viral text-foreground hover:opacity-90"
                              : "bg-foreground text-background hover:bg-foreground/90"
                        )}
                      >
                        {loadingPlanId === plan.id ? (
                          <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Загрузка...</>
                        ) : isActive ? "Активен ✓" : isFeatured ? "Выбрать 1 мес" : "Выбрать"}
                      </button>
                    ) : (
                      <button
                        disabled={isActive}
                        onClick={() => { if (!isActive) handlePayment(plan.id); }}
                        className={cn(
                          "mt-6 inline-flex w-full justify-center items-center py-3 rounded-xl text-[14px] font-semibold transition disabled:cursor-default",
                          isActive
                            ? "bg-muted text-muted-foreground"
                            : "bg-foreground text-background hover:bg-foreground/90"
                        )}
                      >
                        {isActive ? "Активен ✓" : "Выбрать"}
                      </button>
                    )}

                    {/* Features */}
                    <ul className="mt-8 space-y-3 text-[14px] flex-1">
                      {usageLimits && (
                        <>
                          {usageLimits.search != null && (
                            <FeatureRow featured={isFeatured} label={<>Поиск — <strong>{usageLimits.search}</strong> раз</>} />
                          )}
                          {usageLimits.video_analysis != null && (
                            <FeatureRow featured={isFeatured} label={<>Анализ видео — <strong>{usageLimits.video_analysis}</strong> раз</>} />
                          )}
                          {usageLimits.account_analysis != null && (
                            <FeatureRow featured={isFeatured} label={<>Анализ профиля — <strong>{usageLimits.account_analysis}</strong> раз</>} />
                          )}
                          {usageLimits.ai_script != null && (
                            <FeatureRow featured={isFeatured} label={<>AI Сценарий — <strong>{usageLimits.ai_script}</strong> раз</>} />
                          )}
                        </>
                      )}
                      {!usageLimits && !isFree && (
                        <FeatureRow featured={isFeatured} label={<strong>Все функции безлимитно</strong>} />
                      )}
                      {features.map((f: string) => (
                        <FeatureRow key={f} featured={isFeatured} label={<span dangerouslySetInnerHTML={{ __html: f }} />} />
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  );
}

function FeatureRow({ featured, label }: { featured: boolean; label: React.ReactNode }) {
  return (
    <li className={cn(
      "flex gap-2.5",
      featured ? "" : "text-foreground/80"
    )}>
      <Check
        className={cn(
          "w-5 h-5 shrink-0",
          featured ? "text-viral" : "text-emerald-500"
        )}
        strokeWidth={2.5}
      />
      <span>{label}</span>
    </li>
  );
}
