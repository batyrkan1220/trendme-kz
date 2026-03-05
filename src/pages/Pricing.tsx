import { AppLayout } from "@/components/layout/AppLayout";
import { Check, Sparkles, Zap, Crown, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

const subtitles: Record<string, string> = {
  "Пробный": "Попробуйте бесплатно",
  "1 ай": "Ежемесячная подписка",
  "3 ай": "Подписка на 3 месяца — скидка 15%",
};

const planIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Пробный": Gift,
  "1 ай": Zap,
  "3 ай": Crown,
};

export default function Pricing() {
  const { user } = useAuth();

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

  // Monthly price for 3-month plan (for display)
  const getMonthlyPrice = (plan: any) => {
    if (plan.price_rub === 0) return 0;
    if (plan.duration_days === 90) return Math.round(plan.price_rub / 3);
    return plan.price_rub;
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-8 animate-fade-in max-w-4xl mx-auto">
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Тарифтер</h1>
          <p className="text-muted-foreground">Өзіңізге сәйкес тарифті таңдаңыз</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-[420px] rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            {plans.map((plan: any) => {
              const isPopular = plan.sort_order === 3; // 3 ай is best value
              const isActive = activePlanName === plan.name;
              const features = Array.isArray(plan.features) ? plan.features as string[] : [];
              const usageLimits = plan.usage_limits as Record<string, number> | null;
              const isFree = plan.price_rub === 0;
              const Icon = planIcons[plan.name] || Zap;
              const monthlyPrice = getMonthlyPrice(plan);

              return (
                <div key={plan.id} className="relative flex flex-col">
                  {/* Popular badge */}
                  {isPopular && (
                    <div className="flex justify-center mb-3 relative z-10">
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-5 py-2 rounded-full shadow-lg"
                        style={{
                          background: "linear-gradient(135deg, hsl(var(--primary)), hsl(280 80% 55%), hsl(330 80% 60%))",
                          color: "white",
                        }}
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Ең тиімді
                      </span>
                    </div>
                  )}

                  <div
                    className={`rounded-2xl border transition-all flex flex-col ${
                      isPopular
                        ? "p-8 shadow-2xl border-transparent relative overflow-hidden"
                        : "p-7 bg-card border-border/60 shadow-sm hover:shadow-md"
                    }`}
                    style={isPopular ? {
                      background: "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--primary) / 0.06) 100%)",
                      boxShadow: "0 0 40px -10px hsl(var(--primary) / 0.3), 0 20px 50px -15px hsl(var(--primary) / 0.15)",
                    } : undefined}
                  >
                    {/* Gradient border for popular */}
                    {isPopular && (
                      <div
                        className="absolute -inset-[2px] rounded-2xl pointer-events-none"
                        style={{
                          background: "linear-gradient(135deg, hsl(var(--primary)), hsl(280 80% 55%), hsl(330 80% 60%))",
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
                        <Icon className={`h-5 w-5 ${isPopular ? "text-primary" : "text-muted-foreground"}`} />
                        <h3 className={`font-bold text-foreground ${isPopular ? "text-2xl" : "text-xl"}`}>
                          {plan.name}
                        </h3>
                      </div>
                      <p className={`font-medium text-primary mt-0.5 italic ${isPopular ? "text-sm" : "text-xs"}`}>
                        {subtitles[plan.name] || ""}
                      </p>

                      {/* Price */}
                      <div className="mt-5">
                        {isFree ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl md:text-5xl font-extrabold text-foreground">Тегін</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-baseline gap-1">
                              <span className={`font-extrabold text-foreground tracking-tight ${isPopular ? "text-5xl md:text-6xl" : "text-4xl md:text-5xl"}`}>
                                {plan.price_rub.toLocaleString("ru-RU")}₸
                              </span>
                            </div>
                            {plan.duration_days === 90 && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-muted-foreground">
                                  {monthlyPrice.toLocaleString("ru-RU")}₸ / ай
                                </span>
                                <span className="text-xs font-bold text-white px-1.5 py-0.5 rounded" style={{ background: "hsl(350 80% 50%)" }}>
                                  -15%
                                </span>
                              </div>
                            )}
                            {plan.duration_days === 30 && !isFree && (
                              <span className="text-sm text-muted-foreground">/ ай</span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Duration */}
                      <div className={`mt-4 flex items-center gap-2 ${isPopular ? "bg-primary/10 rounded-lg px-3 py-2 -mx-1" : ""}`}>
                        <span className="text-sm text-muted-foreground">Мерзімі:</span>
                        <span className={`font-bold text-foreground ${isPopular ? "text-base" : "text-sm"}`}>
                          {isFree ? "1 ай (сынақ)" : plan.duration_days === 90 ? "3 ай" : "1 ай"}
                        </span>
                      </div>

                      {/* Divider */}
                      <div className={`border-t my-4 ${isPopular ? "border-primary/20" : "border-border/40"}`} />

                      {/* Unlimited badge for paid plans */}
                      {!usageLimits && !isFree && (
                        <div className="mb-4 text-sm font-semibold text-primary flex items-center gap-1.5">
                          ♾️ Барлық функциялар шексіз
                        </div>
                      )}

                      {/* Features list */}
                      <ul className="space-y-3 flex-1">
                        {/* Show usage limits as list items for trial */}
                        {usageLimits && (
                          <>
                            {usageLimits.search != null && (
                              <li className={`flex items-start gap-2.5 text-foreground ${isPopular ? "text-[15px]" : "text-sm"}`}>
                                <Check className={`shrink-0 mt-0.5 ${isPopular ? "h-5 w-5 text-primary" : "h-4 w-4 text-primary"}`} />
                                <span>Поиск — <strong>{usageLimits.search}</strong> раз</span>
                              </li>
                            )}
                            {usageLimits.video_analysis != null && (
                              <li className={`flex items-start gap-2.5 text-foreground ${isPopular ? "text-[15px]" : "text-sm"}`}>
                                <Check className={`shrink-0 mt-0.5 ${isPopular ? "h-5 w-5 text-primary" : "h-4 w-4 text-primary"}`} />
                                <span>Анализ видео — <strong>{usageLimits.video_analysis}</strong> раз</span>
                              </li>
                            )}
                            {usageLimits.account_analysis != null && (
                              <li className={`flex items-start gap-2.5 text-foreground ${isPopular ? "text-[15px]" : "text-sm"}`}>
                                <Check className={`shrink-0 mt-0.5 ${isPopular ? "h-5 w-5 text-primary" : "h-4 w-4 text-primary"}`} />
                                <span>Анализ профиля — <strong>{usageLimits.account_analysis}</strong> раз</span>
                              </li>
                            )}
                            {usageLimits.ai_script != null && (
                              <li className={`flex items-start gap-2.5 text-foreground ${isPopular ? "text-[15px]" : "text-sm"}`}>
                                <Check className={`shrink-0 mt-0.5 ${isPopular ? "h-5 w-5 text-primary" : "h-4 w-4 text-primary"}`} />
                                <span>AI Сценарий — <strong>{usageLimits.ai_script}</strong> раз</span>
                              </li>
                            )}
                          </>
                        )}
                        {features.map((f: string) => (
                          <li key={f} className={`flex items-start gap-2.5 text-foreground ${isPopular ? "text-[15px]" : "text-sm"}`}>
                            <Check className={`shrink-0 mt-0.5 ${isPopular ? "h-5 w-5 text-primary" : "h-4 w-4 text-primary"}`} />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA Button */}
                      <Button
                        className={`w-full mt-6 rounded-xl font-semibold text-base transition-all duration-200 ${
                          isActive
                            ? "h-12 bg-muted text-muted-foreground border border-border cursor-default hover:bg-muted"
                            : isPopular
                              ? "h-14 text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] border-0"
                              : "h-12 bg-card text-foreground border border-border hover:bg-muted"
                        }`}
                        style={!isActive && isPopular ? {
                          background: "linear-gradient(135deg, hsl(var(--primary)), hsl(280 80% 55%), hsl(330 80% 60%))",
                          color: "white",
                        } : undefined}
                        disabled={isActive}
                      >
                        {isActive ? "Белсенді ✓" : isPopular ? "🔥 3 ай таңдау" : isFree ? "Бастау" : "Таңдау"}
                      </Button>
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
