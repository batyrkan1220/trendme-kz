import { AppLayout } from "@/components/layout/AppLayout";
import { Star } from "lucide-react";

export default function Favorites() {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Избранное</h1>
          <div className="flex bg-secondary rounded-lg p-1 border border-border">
            <button className="px-4 py-1.5 rounded-md text-sm font-medium gradient-hero text-primary-foreground">
              По дате
            </button>
            <button className="px-4 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              По трендовости
            </button>
          </div>
        </div>

        <div className="text-center py-20">
          <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">
            Нет избранных видео. Добавьте видео в избранное через поиск.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
