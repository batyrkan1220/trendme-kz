import { AppLayout } from "@/components/layout/AppLayout";
import { CreditCard, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  { name: "Старт", price: "Бесплатно", features: ["100 запросов/мес", "5 отслеживаемых авторов", "Базовый анализ"], emoji: "🚀" },
  { name: "Про", price: "2 990 ₽/мес", features: ["5 000 запросов/мес", "50 отслеживаемых авторов", "Полный анализ", "Экспорт данных"], popular: true, emoji: "⚡" },
  { name: "Бизнес", price: "9 990 ₽/мес", features: ["Безлимитные запросы", "Безлимитные авторы", "API доступ", "Приоритетная поддержка"], emoji: "🏆" },
];

export default function Pricing() {
  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Тарифы 💎</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 border transition-all hover-lift ${
                plan.popular
                  ? "gradient-card glow-primary border-primary/20"
                  : "bg-card border-border/50 card-shadow card-shadow-hover"
              }`}
            >
              {plan.popular && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-primary mb-3 bg-primary/10 px-2.5 py-1 rounded-full">
                  <Sparkles className="h-3 w-3" /> Популярный
                </span>
              )}
              <div className="text-2xl mb-1">{plan.emoji}</div>
              <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
              <p className="text-2xl font-bold text-foreground mt-2">{plan.price}</p>
              <ul className="mt-5 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-accent shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full mt-6 rounded-xl h-11 font-semibold ${
                  plan.popular
                    ? "gradient-hero text-primary-foreground border-0 glow-primary"
                    : "bg-secondary text-secondary-foreground border border-border hover:bg-muted"
                }`}
              >
                Выбрать
              </Button>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
