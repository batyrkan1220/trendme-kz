import { AppLayout } from "@/components/layout/AppLayout";
import { Check, Sparkles, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

const subtitles: Record<string, string> = {
  "Старт": "Сервисті сынау үшін",
  "Про": "Блогерлер мен SMM мамандарына",
  "Бизнес": "Бизнес пен контент-зауытқа",
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
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Тарифтер</h1>
          <p className="text-muted-foreground mt-2">Өзіңізге қолайлы тарифті таңдаңыз</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-[480px] rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {plans.map((plan: any) => {
              const isPopular = plan.sort_order === 2;
              const isActive = activePlanName === plan.name;
              const features = Array.isArray(plan.features) ? plan.features as string[] : [];

              return (
                <div key={plan.id} className="relative flex flex-col">
                  {/* Popular badge floating above */}
                  {isPopular && (
                    <div className="flex justify-center -mb-3 relative z-10">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-foreground bg-gradient-to-r from-primary via-purple-500 to-pink-400 px-5 py-2 rounded-full shadow-lg">
                        <Sparkles className="h-3.5 w-3.5" /> Пайдаланушылардың 68% таңдайды
                      </span>
                    </div>
                  )}

                  <div
                    className={`rounded-2xl p-7 border transition-all flex flex-col flex-1 ${
                      isPopular
                        ? "bg-card shadow-xl ring-2 ring-primary/20 border-primary/20"
                        : "bg-card border-border/60 shadow-sm hover:shadow-md"
                    }`}
                    style={isPopular ? {
                      background: "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--primary) / 0.03) 100%)"
                    } : undefined}
                  >
                    {/* Plan name */}
                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                    <p className="text-sm font-medium text-primary mt-0.5 italic">
                      {subtitles[plan.name] || ""}
                    </p>

                    {/* Price */}
                    <div className="mt-5 flex items-baseline gap-1">
                      <span className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
                        {plan.price_rub === 0 ? "0₸" : `${plan.price_rub.toLocaleString("ru-RU")}₸`}
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">айына</span>
                    </div>

                    {/* Tokens included */}
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Кіреді:</span>
                      <Flame className="h-4 w-4 text-orange-500 shrink-0" />
                      <span className="font-bold text-foreground text-sm">
                        {plan.tokens_included.toLocaleString("ru-RU")} токен
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border/40 my-4" />

                    {/* Features list */}
                    <ul className="space-y-3 flex-1">
                      {features.map((f: string) => {
                        const isGift = isGiftFeature(f);
                        return (
                          <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                            {isGift ? (
                              <Gift className="h-4 w-4 text-pink-500 shrink-0 mt-0.5" />
                            ) : (
                              <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            )}
                            <span>{f}</span>
                          </li>
                        );
                      })}
                    </ul>

                    {/* CTA Button */}
                    <Button
                      className={`w-full mt-6 rounded-xl h-12 font-semibold text-base ${
                        isActive
                          ? "bg-muted text-muted-foreground border border-border cursor-default hover:bg-muted"
                          : isPopular
                            ? "bg-gradient-to-r from-primary via-purple-500 to-pink-400 text-primary-foreground border-0 shadow-md hover:shadow-lg hover:opacity-95"
                            : "bg-card text-foreground border border-border hover:bg-muted"
                      }`}
                      disabled={isActive}
                    >
                      {isActive ? "Белсенді ✓" : "Таңдау"}
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
