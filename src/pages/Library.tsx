import { AppLayout } from "@/components/layout/AppLayout";
import { BookOpen } from "lucide-react";

export default function Library() {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Библиотека 📚</h1>
        <div className="bg-card rounded-2xl border border-border/50 p-12 text-center card-shadow">
          <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <p className="text-muted-foreground font-medium">Библиотека пуста</p>
        </div>
      </div>
    </AppLayout>
  );
}
