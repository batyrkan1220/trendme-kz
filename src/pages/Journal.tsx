import { AppLayout } from "@/components/layout/AppLayout";
import { ScrollText } from "lucide-react";

export default function Journal() {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Журнал</h1>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-3 gap-4 px-6 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Дата и время</span>
            <span>Тип действия</span>
            <span>Детали</span>
          </div>

          {/* Empty State */}
          <div className="text-center py-16">
            <ScrollText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Нет записей в журнале</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
