import { AppLayout } from "@/components/layout/AppLayout";
import { Coins, Zap, ArrowDown, ArrowUp, Clock } from "lucide-react";
import { useTokens } from "@/hooks/useTokens";
import { Badge } from "@/components/ui/badge";

export default function Tokens() {
  const { balance, totalEarned, totalSpent, transactions, pricing, isLoading } = useTokens();

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Токены ⚡</h1>

        {/* Balance card */}
        <div className="bg-card rounded-2xl p-8 card-shadow border border-border/50 relative overflow-hidden">
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
                <Coins className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground">Баланс токенов</span>
            </div>
            <p className="text-5xl font-bold text-foreground">{isLoading ? "..." : balance.toLocaleString()}</p>
            <p className="text-muted-foreground text-sm mt-2 flex items-center gap-1">
              <Zap className="h-3.5 w-3.5" />
              Доступных запросов
            </p>
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-1.5 text-sm">
                <ArrowUp className="h-3.5 w-3.5 text-green-500" />
                <span className="text-muted-foreground">Получено:</span>
                <span className="font-semibold text-foreground">{totalEarned}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <ArrowDown className="h-3.5 w-3.5 text-red-500" />
                <span className="text-muted-foreground">Потрачено:</span>
                <span className="font-semibold text-foreground">{totalSpent}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-card rounded-2xl p-6 card-shadow border border-border/50">
          <h2 className="text-lg font-semibold text-foreground mb-4">Стоимость действий</h2>
          <div className="space-y-2">
            {pricing.map((p: any) => (
              <div key={p.action_key} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <span className="text-sm text-foreground">{p.action_label}</span>
                <Badge variant="secondary" className="font-bold">{p.cost} ⚡</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Recent transactions */}
        {transactions.length > 0 && (
          <div className="bg-card rounded-2xl p-6 card-shadow border border-border/50">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> История операций
            </h2>
            <div className="space-y-2">
              {transactions.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div>
                    <p className="text-sm text-foreground">{t.description || t.action_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleString("ru-RU")}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${t.amount > 0 ? "text-green-500" : "text-red-500"}`}>
                    {t.amount > 0 ? "+" : ""}{t.amount} ⚡
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
