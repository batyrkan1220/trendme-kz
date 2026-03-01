import { AppLayout } from "@/components/layout/AppLayout";
import { CreditCard, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  { name: "Старт", price: "Бесплатно", features: ["100 запросов/мес", "5 отслеживаемых авторов", "Базовый анализ"] },
  { name: "Про", price: "2 990 ₽/мес", features: ["5 000 запросов/мес", "50 отслеживаемых авторов", "Полный анализ", "Экспорт данных"], popular: true },
  { name: "Бизнес", price: "9 990 ₽/мес", features: ["Безлимитные запросы", "Безлимитные авторы", "API доступ", "Приоритетная поддержка"] },
];

export default function Pricing() {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Тарифы</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl p-6 border ${
                plan.popular
                  ? "gradient-card glow-primary"
                  : "bg-card border-border"
              }`}
            >
              {plan.popular && (
                <span className="text-xs font-medium text-primary mb-2 block">Популярный</span>
              )}
              <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
              <p className="text-2xl font-bold text-foreground mt-2">{plan.price}</p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full mt-6 ${
                  plan.popular
                    ? "gradient-hero text-primary-foreground border-0"
                    : "bg-secondary text-secondary-foreground border border-border"
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
