import { AppLayout } from "@/components/layout/AppLayout";
import { BookOpen } from "lucide-react";

export default function Library() {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Библиотека</h1>
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Библиотека пуста</p>
        </div>
      </div>
    </AppLayout>
  );
}
