import { AppLayout } from "@/components/layout/AppLayout";
import { Search as SearchIcon, Clock, Star, Eye, Heart, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SearchPage() {
  const [query, setQuery] = useState("");

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 flex gap-6 animate-fade-in">
        {/* Main Content */}
        <div className="flex-1 space-y-6 min-w-0">
          <h1 className="text-2xl font-bold text-foreground">Поиск</h1>

          <div className="flex gap-3">
            <Input
              placeholder="Введите ключевое слово..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-secondary border-border"
            />
            <Button className="gradient-hero text-primary-foreground border-0 px-6 glow-primary hover:opacity-90 transition-opacity">
              <SearchIcon className="h-4 w-4 mr-2" />
              Искать
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {["7 дней", "30 дней", "Все время"].map((f) => (
              <button
                key={f}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-muted transition-colors border border-border"
              >
                {f}
              </button>
            ))}
            <select className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground border border-border">
              <option>По трендовости</option>
              <option>По просмотрам</option>
              <option>По дате</option>
            </select>
          </div>

          {/* Empty State */}
          <div className="text-center py-20">
            <SearchIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">
              Введите запрос для поиска видео в TikTok
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-72 shrink-0 hidden xl:block">
          <div className="bg-card rounded-xl p-5 border border-border sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-sm text-foreground">Последние запросы</h3>
            </div>
            <p className="text-muted-foreground text-xs text-center py-6">
              Нет запросов
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
