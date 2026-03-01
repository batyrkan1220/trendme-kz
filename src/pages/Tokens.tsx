import { AppLayout } from "@/components/layout/AppLayout";
import { Coins } from "lucide-react";

export default function Tokens() {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Токены</h1>
        <div className="gradient-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Coins className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-foreground">Баланс кредитов</span>
          </div>
          <p className="text-4xl font-bold gradient-text">1 000</p>
          <p className="text-muted-foreground text-sm mt-2">Доступных запросов к API</p>
        </div>
      </div>
    </AppLayout>
  );
}
