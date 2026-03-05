import { AppLayout } from "@/components/layout/AppLayout";
import { Check, Sparkles, Flame, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

const subtitles: Record<string, string> = {
  "Старт": "Для пробы сервиса",
  "Про": "Для блогеров и SMM специалистов",
  "Бизнес": "Для бизнеса и контент-завода",
};

const featureIcons: Record<string, "check" | "gift"> = {
  "аккаунт": "gift",
  "ключ": "gift",
  "Шпионаж": "gift",
  "Контент-радар": "gift",
};

function getFeatureIcon(feature: string): "check" | "gift" {
  for (const key of Object.keys(featureIcons)) {
    if (feature.includes(key)) return "gift";
  }
  return "check";
}

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
      <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Тарифы 💎</h1>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-[420px] rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {plans.map((plan: any) => {
              const isPopular = plan.sort_order === 2;
              const isActive = activePlanName === plan.name;
              const features = Array.isArray(plan.features) ? plan.features as string[] : [];

              return (
                <div key={plan.id} className="relative">
                  {/* Popular badge above card */}
                  {isPopular && (
                    <div className="flex justify-center mb-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-foreground bg-gradient-to-r from-primary to-purple-500 px-4 py-1.5 rounded-full shadow-md">
                        <Sparkles className="h-3.5 w-3.5" /> Выбирают 68% пользователей
                      </span>
                    </div>
                  )}

                  <div
                    className={`rounded-2xl p-6 border transition-all ${
                      isPopular
                        ? "bg-card border-primary/30 shadow-lg ring-2 ring-primary/20"
                        : "bg-card border-border/50 card-shadow"
                    }`}
                  >
                    {/* Plan name & subtitle */}
                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                    <p className="text-sm text-primary font-medium mt-0.5 italic">
                      {subtitles[plan.name] || ""}
                    </p>

                    {/* Price */}
                    <div className="mt-4 flex items-baseline gap-1.5">
                      <span className="text-4xl font-extrabold text-foreground">
                        {plan.price_rub === 0 ? "0₸" : `${plan.price_rub.toLocaleString("ru-RU")}₸`}
                      </span>
                      <span className="text-sm text-muted-foreground">в месяц</span>
                    </div>

                    {/* Tokens included */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Включено:</span>
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="font-bold text-foreground">
                        {plan.tokens_included.toLocaleString("ru-RU")} токенов
                      </span>
                    </div>

                    {/* Features list */}
                    <ul className="mt-5 space-y-3">
                      {features.map((f: string) => {
                        const iconType = getFeatureIcon(f);
                        return (
                          <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                            {iconType === "gift" ? (
                              <Gift className="h-4 w-4 text-pink-500 shrink-0" />
                            ) : (
                              <Check className="h-4 w-4 text-primary shrink-0" />
                            )}
                            {f}
                          </li>
                        );
                      })}
                    </ul>

                    {/* CTA Button */}
                    <Button
                      className={`w-full mt-6 rounded-xl h-11 font-semibold ${
                        isActive
                          ? "bg-muted text-muted-foreground border border-border cursor-default"
                          : isPopular
                            ? "bg-gradient-to-r from-primary to-purple-500 text-primary-foreground border-0 shadow-md hover:shadow-lg"
                            : "bg-secondary text-secondary-foreground border border-border hover:bg-muted"
                      }`}
                      disabled={isActive}
                    >
                      {isActive ? "Активен" : "Выбрать"}
                    </Button>
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
