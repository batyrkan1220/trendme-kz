import { AppLayout } from "@/components/layout/AppLayout";
import { trackInitiateCheckout } from "@/components/TrackingPixels";
import { Check, Sparkles, Zap, Crown, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const subtitles: Record<string, string> = {
  "Пробный": "Попробуйте бесплатно",
  "1 мес": "Ежемесячная подписка",
  "3 мес": "Подписка на 3 месяца — скидка 15%",
};

const displayNames: Record<string, string> = {
  "Пробный": "Демо режим",
};

const planIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Пробный": Gift,
  "1 мес": Zap,
  "3 мес": Crown,
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
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

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

  // Monthly price for 3-month plan (for display)
  const getMonthlyPrice = (plan: any) => {
    if (plan.price_rub === 0) return 0;
    if (plan.duration_days === 90) return Math.round(plan.price_rub / 3);
    return plan.price_rub;
  };

  // On mobile, show paid plans first (1 ай first)
  const sortedPlans = useMemo(() => {
    if (!isMobile) return plans;
    const paid = plans.filter((p: any) => p.price_rub > 0).sort((a: any, b: any) => a.sort_order - b.sort_order);
    const free = plans.filter((p: any) => p.price_rub === 0);
    return [...paid, ...free];
  }, [plans, isMobile]);

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 animate-fade-in max-w-4xl mx-auto">
        <div className="text-center space-y-1 md:space-y-2">
          <h1 className="text-xl md:text-3xl font-bold text-foreground">Подписка</h1>
          <p className="text-sm md:text-base text-muted-foreground">Выберите подходящий тариф</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-[320px] md:h-[420px] rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-stretch">
            {sortedPlans.map((plan: any) => {
              const isPaid = plan.price_rub > 0;
              const isPopular = plan.sort_order === 3;
              const isActive = activePlanName === plan.name;
              const features = Array.isArray(plan.features) ? plan.features as string[] : [];
              const usageLimits = plan.usage_limits as Record<string, number> | null;
              const isFree = plan.price_rub === 0;
              const Icon = planIcons[plan.name] || Zap;
              const monthlyPrice = getMonthlyPrice(plan);
              const displayName = displayNames[plan.name] || plan.name;

              return (
                <div key={plan.id} className="relative flex flex-col">
                  {/* Popular badge - positioned above card */}
                  <div className="flex justify-center h-8 mb-1">
                    {isPopular && (
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-5 py-1.5 rounded-full shadow-lg"
                        style={{
                          background: "linear-gradient(135deg, hsl(var(--primary)), hsl(82 90% 45%))",
                          color: "black",
                        }}
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Лучшая цена
                      </span>
                    )}
                  </div>

                  <div
                    className={`rounded-2xl border transition-all flex flex-col flex-1 ${
                      isPaid
                        ? "p-5 md:p-8 shadow-xl border-transparent relative overflow-hidden"
                        : "p-5 md:p-7 bg-card border-border/60 shadow-sm hover:shadow-md"
                    }`}
                    style={isPaid ? {
                      background: isPopular
                        ? "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--primary) / 0.06) 100%)"
                        : "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--primary) / 0.03) 100%)",
                      boxShadow: isPopular
                        ? "0 0 40px -10px hsl(var(--primary) / 0.3), 0 20px 50px -15px hsl(var(--primary) / 0.15)"
                        : "0 0 30px -10px hsl(var(--primary) / 0.15), 0 10px 30px -15px hsl(var(--primary) / 0.1)",
                    } : undefined}
                  >
                    {/* Gradient border for paid plans */}
                    {isPaid && (
                      <div
                        className="absolute -inset-[2px] rounded-2xl pointer-events-none"
                        style={{
                          background: isPopular
                            ? "linear-gradient(135deg, hsl(var(--primary)), hsl(82 90% 45%))"
                            : "linear-gradient(135deg, hsl(var(--primary) / 0.5), hsl(82 90% 45% / 0.5))",
                          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                          WebkitMaskComposite: "xor",
                          maskComposite: "exclude",
                          padding: "2px",
                          borderRadius: "1rem",
                        }}
                      />
                    )}

                    <div className="relative z-10 flex flex-col flex-1">
                      {/* Plan name */}
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${isPaid ? "text-primary" : "text-muted-foreground"}`} />
                        <h3 className="font-bold text-foreground text-xl">
                          {displayName}
                        </h3>
                      </div>
                      <p className="font-medium text-primary mt-0.5 italic text-xs">
                        {subtitles[plan.name] || ""}
                      </p>

                      {/* Price */}
                      <div className="mt-5">
                        {isFree ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl md:text-4xl font-extrabold text-foreground">Бесплатно</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-baseline gap-1">
                              <span className="font-extrabold text-foreground tracking-tight text-4xl md:text-5xl">
                                {plan.price_rub.toLocaleString("ru-RU")}₸
                              </span>
                            </div>
                            {plan.duration_days === 90 && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-muted-foreground">
                                  {monthlyPrice.toLocaleString("ru-RU")}₸ / мес
                                </span>
                                <span className="text-xs font-bold text-white px-1.5 py-0.5 rounded" style={{ background: "hsl(350 80% 50%)" }}>
                                  -15%
                                </span>
                              </div>
                            )}
                            {plan.duration_days === 30 && (
                              <span className="text-sm text-muted-foreground">/ мес</span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Duration — only for paid */}
                      {!isFree && (
                        <div className={`mt-4 flex items-center gap-2 ${isPopular ? "bg-primary/10 rounded-lg px-3 py-2 -mx-1" : ""}`}>
                          <span className="text-sm text-muted-foreground">Срок:</span>
                          <span className="font-bold text-foreground text-sm">
                            {plan.duration_days === 90 ? "3 мес" : "1 мес"}
                          </span>
                        </div>
                      )}

                      {/* Divider */}
                      <div className={`border-t my-4 ${isPaid ? "border-primary/20" : "border-border/40"}`} />

                      {/* Unlimited badge for paid plans */}
                      {!usageLimits && !isFree && (
                        <div className="mb-4 text-sm font-semibold text-primary flex items-center gap-1.5">
                          ♾️ Все функции безлимитно
                        </div>
                      )}

                      {/* Features list */}
                      <ul className="space-y-3 flex-1">
                        {usageLimits && (
                          <>
                            {usageLimits.search != null && (
                              <li className="flex items-start gap-2.5 text-foreground text-sm">
                                <Check className="shrink-0 mt-0.5 h-4 w-4 text-primary" />
                                <span>Поиск — <strong>{usageLimits.search}</strong> раз</span>
                              </li>
                            )}
                            {usageLimits.video_analysis != null && (
                              <li className="flex items-start gap-2.5 text-foreground text-sm">
                                <Check className="shrink-0 mt-0.5 h-4 w-4 text-primary" />
                                <span>Анализ видео — <strong>{usageLimits.video_analysis}</strong> раз</span>
                              </li>
                            )}
                            {usageLimits.account_analysis != null && (
                              <li className="flex items-start gap-2.5 text-foreground text-sm">
                                <Check className="shrink-0 mt-0.5 h-4 w-4 text-primary" />
                                <span>Анализ профиля — <strong>{usageLimits.account_analysis}</strong> раз</span>
                              </li>
                            )}
                            {usageLimits.ai_script != null && (
                              <li className="flex items-start gap-2.5 text-foreground text-sm">
                                <Check className="shrink-0 mt-0.5 h-4 w-4 text-primary" />
                                <span>AI Сценарий — <strong>{usageLimits.ai_script}</strong> раз</span>
                              </li>
                            )}
                          </>
                        )}
                        {features.map((f: string) => (
                          <li key={f} className="flex items-start gap-2.5 text-foreground text-sm">
                            <Check className="shrink-0 mt-0.5 h-4 w-4 text-primary" />
                            <span dangerouslySetInnerHTML={{ __html: f }} />
                          </li>
                        ))}
                      </ul>

                      {/* CTA Button — only for paid plans */}
                      {isPaid && (
                        <Button
                          className={`w-full mt-6 rounded-xl font-semibold text-base h-12 transition-all duration-200 ${
                            isActive
                              ? "bg-muted text-muted-foreground border border-border cursor-default hover:bg-muted"
                              : "shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] border-0"
                          }`}
                          style={!isActive ? {
                            background: isPopular
                              ? "linear-gradient(135deg, hsl(var(--primary)), hsl(82 90% 45%))"
                              : "linear-gradient(135deg, hsl(var(--primary)), hsl(82 90% 45%))",
                            color: "black",
                          } : undefined}
                          disabled={isActive || loadingPlanId === plan.id}
                          onClick={() => {
                            if (!isActive) handlePayment(plan.id);
                          }}
                        >
                          {loadingPlanId === plan.id ? (
                            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Загрузка...</>
                          ) : isActive ? "Активен ✓" : isPopular ? "🔥 Выбрать 3 мес" : "Выбрать"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
