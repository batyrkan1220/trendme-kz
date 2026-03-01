import { AppLayout } from "@/components/layout/AppLayout";
import { Radar } from "lucide-react";

export default function Razvedka() {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Разведка</h1>
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Radar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Раздел в разработке</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Скоро здесь появятся инструменты разведки</p>
        </div>
      </div>
    </AppLayout>
  );
}
