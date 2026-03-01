import { AppLayout } from "@/components/layout/AppLayout";
import { BarChart3 } from "lucide-react";

export default function Analytics() {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Аналитика</h1>
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Раздел в разработке</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Скоро здесь появятся графики и аналитика</p>
        </div>
      </div>
    </AppLayout>
  );
}
