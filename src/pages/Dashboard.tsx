import { AppLayout } from "@/components/layout/AppLayout";
import { Star, Users, Heart, Activity, Search as SearchIcon } from "lucide-react";

const stats = [
  { label: "Избранное", value: "0", icon: Star },
  { label: "Авторы", value: "0", icon: Users },
  { label: "Подписчики", value: "0", icon: Heart },
  { label: "История", value: "0", icon: Activity },
];

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        {/* Hero */}
        <div className="gradient-hero rounded-2xl p-8 glow-primary">
          <h1 className="text-2xl font-bold text-primary-foreground mb-2">
            Добро пожаловать в Trend TikTok
          </h1>
          <p className="text-primary-foreground/70 max-w-lg">
            Мониторинг трендов, анализ контента и отслеживание аккаунтов TikTok
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="gradient-card rounded-xl p-5 transition-all duration-200 gradient-card-hover">
              <div className="flex items-center gap-3">
                <s.icon className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-3xl font-bold mt-3 text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg text-foreground">Отслеживаемые авторы</h2>
            </div>
            <div className="text-muted-foreground text-sm py-8 text-center">
              Нет отслеживаемых авторов.
              <br />
              <span className="text-xs">Добавьте авторов через раздел «Анализ аккаунт»</span>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <SearchIcon className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg text-foreground">Последние запросы</h2>
            </div>
            <div className="text-muted-foreground text-sm py-8 text-center">
              Нет запросов.
              <br />
              <span className="text-xs">Начните поиск через раздел «Поиск»</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
