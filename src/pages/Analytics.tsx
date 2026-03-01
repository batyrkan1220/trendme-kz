import { AppLayout } from "@/components/layout/AppLayout";
import { BarChart3, Sparkles } from "lucide-react";

export default function Analytics() {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Аналитика 📊</h1>
        <div className="bg-card rounded-2xl border border-border/50 p-12 text-center card-shadow">
          <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <p className="text-foreground font-semibold">Раздел в разработке</p>
          <p className="text-muted-foreground text-sm mt-1 flex items-center justify-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> Скоро здесь появятся графики и аналитика
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
