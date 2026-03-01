import { AppLayout } from "@/components/layout/AppLayout";
import { TrendingUp } from "lucide-react";
import { useState } from "react";

export default function Trends() {
  const [period, setPeriod] = useState<7 | 30>(7);

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Тренды</h1>
          <div className="flex bg-secondary rounded-lg p-1 border border-border">
            {([7, 30] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  period === p
                    ? "gradient-hero text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p} дней
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        <div className="text-center py-20">
          <TrendingUp className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">
            Нет трендовых видео. Начните поиск, чтобы собрать данные.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
