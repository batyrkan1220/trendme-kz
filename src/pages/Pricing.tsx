import { AppLayout } from "@/components/layout/AppLayout";
import { Check, Sparkles, Flame, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

const subtitles: Record<string, string> = {
  "Старт": "Для пробы сервиса",
  "Про": "Для блогеров и SMM специалистов",
  "Бизнес": "Для бизнеса и контент-команд",
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

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-8 animate-fade-in max-w-5xl mx-auto">
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Тарифы</h1>
          <p className="text-muted-foreground mt-2">Выберите подходящий тариф</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-[480px] rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            {plans.map((plan: any) => {
              const isPopular = plan.sort_order === 2;
              const isActive = activePlanName === plan.name;
              const features = Array.isArray(plan.features) ? plan.features as string[] : [];

              return (
                <div key={plan.id} className="relative flex flex-col">
                  {/* Popular badge floating above */}
                  {isPopular && (
                    <div className="flex justify-center mb-3 relative z-10">
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-5 py-2 rounded-full shadow-lg animate-pulse"
                        style={{
                          background: "linear-gradient(135deg, hsl(var(--primary)), hsl(280 80% 55%), hsl(330 80% 60%))",
                          color: "white",
                        }}
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Выбирают 68% пользователей
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
                    {/* Glowing ring for Про */}
                    {isPopular && (
                      <div
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{
                          background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(280 80% 55% / 0.1), hsl(330 80% 60% / 0.1))",
                          border: "2px solid transparent",
                          backgroundClip: "padding-box",
                          mask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                          WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                        }}
                      />
                    )}
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
                        <h3 className={`font-bold text-foreground ${isPopular ? "text-2xl" : "text-xl"}`}>
                          {plan.name}
                        </h3>
                        {isPopular && <Zap className="h-5 w-5 text-primary" />}
                      </div>
                      <p className={`font-medium text-primary mt-0.5 italic ${isPopular ? "text-sm" : "text-xs"}`}>
                        {subtitles[plan.name] || ""}
                      </p>

                      {/* Price */}
                      <div className="mt-5 flex items-baseline gap-1">
                        <span className={`font-extrabold text-foreground tracking-tight ${isPopular ? "text-5xl md:text-6xl" : "text-4xl md:text-5xl"}`}>
                          {plan.price_rub === 0 ? "0₸" : `${plan.price_rub.toLocaleString("ru-RU")}₸`}
                        </span>
                        <span className="text-sm text-muted-foreground ml-1">в месяц</span>
                      </div>

                      {/* Tokens included */}
                      <div className={`mt-4 flex items-center gap-2 ${isPopular ? "bg-primary/10 rounded-lg px-3 py-2 -mx-1" : ""}`}>
                        <span className="text-sm text-muted-foreground">Включено:</span>
                        <Flame className="h-4 w-4 text-orange-500 shrink-0" />
                        <span className={`font-bold text-foreground ${isPopular ? "text-base" : "text-sm"}`}>
                          {plan.tokens_included.toLocaleString("ru-RU")} токенов
                        </span>
                      </div>

                      {/* Divider */}
                      <div className={`border-t my-4 ${isPopular ? "border-primary/20" : "border-border/40"}`} />

                      {/* Features list */}
                      <ul className="space-y-3 flex-1">
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
                        {isActive ? "Активен ✓" : isPopular ? "🔥 Выбрать Про" : "Выбрать"}
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
