import { AppLayout } from "@/components/layout/AppLayout";
import { Coins, Sparkles, Zap } from "lucide-react";

export default function Tokens() {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Токены ⚡</h1>
        <div className="bg-card rounded-2xl p-8 card-shadow border border-border/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-pink-100/40 to-transparent rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl gradient-hero flex items-center justify-center glow-primary">
                <Coins className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground">Баланс кредитов</span>
            </div>
            <p className="text-5xl font-bold gradient-text">1 000</p>
            <p className="text-muted-foreground text-sm mt-2 flex items-center gap-1">
              <Zap className="h-3.5 w-3.5" />
              Доступных запросов к API
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
