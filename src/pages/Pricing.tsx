import { AppLayout } from "@/components/layout/AppLayout";
import { trackInitiateCheckout, trackPlausible } from "@/components/TrackingPixels";
import { Check, X, Loader2 } from "lucide-react";
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

function pluralDays(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дня";
  return "дней";
}

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
        .select("*, plans(name, price_rub)")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
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
    trackPlausible("Plan Upgrade", { plan: plan.duration_days === 90 ? "quarterly" : "monthly" });
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
            <span className="eyebrow">Тарифы</span>
            <h1 className="mt-3 text-[clamp(1.75rem,3.5vw,2.75rem)] font-bold tracking-tight text-foreground">
              Простые тарифы для любого масштаба
            </h1>
            <p className="mt-3 md:mt-4 text-[15px] md:text-[17px] text-muted-foreground leading-relaxed">
              Начните бесплатно. Отмените в любой момент.
            </p>
          </div>

          {/* Subscription status banner — Trial / Active / Past due */}
          {userSub && (() => {
            const sub: any = userSub;
            const isPaid = (sub.plans?.price_rub || 0) > 0;
            const planName = displayNames[sub.plans?.name] || sub.plans?.name || "—";
            const expiresAt = sub.expires_at ? new Date(sub.expires_at) : null;
            const expired = expiresAt ? expiresAt.getTime() < Date.now() : false;
            const daysLeft = expiresAt
              ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000))
              : null;
            const expiresStr = expiresAt
              ? expiresAt.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
              : "—";

            type Status = "trial" | "active" | "past_due";
            const status: Status = expired ? "past_due" : isPaid ? "active" : "trial";

            const config = {
              trial: {
                label: "Пробный период",
                badgeClass: "bg-amber-500/15 text-amber-500",
                borderClass: "border-amber-500/30",
                eyebrow: "Демо режим",
                hint: "Для полного доступа выберите платный тариф ниже",
              },
              active: {
                label: "Активна",
                badgeClass: "bg-emerald-500/15 text-emerald-500",
                borderClass: daysLeft !== null && daysLeft <= 7 ? "border-viral/40" : "border-border",
                eyebrow: "Ваша подписка",
                hint: null as string | null,
              },
              past_due: {
                label: "Истёк",
                badgeClass: "bg-destructive/15 text-destructive",
                borderClass: "border-destructive/40",
                eyebrow: "Подписка завершена",
                hint: "Продлите подписку, чтобы вернуть полный доступ" as string | null,
              },
            }[status];

            return (
              <div
                className={cn(
                  "mx-auto mb-8 md:mb-10 max-w-2xl rounded-2xl border p-5 md:p-6 bg-card shadow-card-hover",
                  config.borderClass
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {config.eyebrow}
                    </div>
                    <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                      <span className="text-[20px] md:text-[22px] font-bold text-foreground">{planName}</span>
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold", config.badgeClass)}>
                        {config.label}
                      </span>
                    </div>
                    {config.hint && (
                      <div className="mt-2 text-[12.5px] text-muted-foreground leading-snug max-w-md">
                        {config.hint}
                      </div>
                    )}
                  </div>
                  {status !== "trial" && (
                    <div className="text-right">
                      <div className="text-[12px] text-muted-foreground">
                        {status === "past_due" ? "Истёк" : "Действует до"}
                      </div>
                      <div className="text-[15px] font-semibold text-foreground">{expiresStr}</div>
                      {daysLeft !== null && status !== "past_due" && (
                        <div className={cn(
                          "mt-0.5 text-[12px] font-semibold",
                          daysLeft <= 7 ? "text-viral" : "text-muted-foreground"
                        )}>
                          Осталось {daysLeft} {pluralDays(daysLeft)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

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
                      {features.map((f: string) => {
                        const muted = /text-muted-foreground/.test(f);
                        const clean = f.replace(/<[^>]+>/g, "");
                        return (
                          <FeatureRow
                            key={f}
                            featured={isFeatured}
                            disabled={muted}
                            label={<span>{clean}</span>}
                          />
                        );
                      })}
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

function FeatureRow({ featured, label, disabled = false }: { featured: boolean; label: React.ReactNode; disabled?: boolean }) {
  return (
    <li className={cn(
      "flex gap-2.5 items-start",
      disabled
        ? "text-muted-foreground/70 line-through decoration-muted-foreground/40"
        : featured ? "" : "text-foreground/80"
    )}>
      {disabled ? (
        <X className="w-5 h-5 shrink-0 text-muted-foreground/60" strokeWidth={2.5} />
      ) : (
        <Check
          className={cn(
            "w-5 h-5 shrink-0",
            featured ? "text-viral" : "text-emerald-500"
          )}
          strokeWidth={2.5}
        />
      )}
      <span>{label}</span>
    </li>
  );
}
