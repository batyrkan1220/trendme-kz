import { AppLayout } from "@/components/layout/AppLayout";
import { Star, Users, Heart, Activity, Search as SearchIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: favCount = 0 } = useQuery({
    queryKey: ["favorites-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("favorites")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: accountsData } = useQuery({
    queryKey: ["accounts-tracked", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("accounts_tracked")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: recentQueries } = useQuery({
    queryKey: ["recent-queries", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("search_queries")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: activityCount = 0 } = useQuery({
    queryKey: ["activity-count", user?.id],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count } = await supabase
        .from("activity_log")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .gte("created_at", thirtyDaysAgo.toISOString());
      return count || 0;
    },
    enabled: !!user,
  });

  const totalFollowers = accountsData?.reduce((sum, a) => sum + (Number(a.followers) || 0), 0) || 0;

  const stats = [
    { label: "Избранное", value: String(favCount), icon: Star, color: "text-pink-500" },
    { label: "Авторы", value: String(accountsData?.length || 0), icon: Users, color: "text-violet-500" },
    { label: "Подписчики", value: totalFollowers.toLocaleString("ru-RU"), icon: Heart, color: "text-rose-500" },
    { label: "История", value: String(activityCount), icon: Activity, color: "text-cyan-500" },
  ];

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        {/* Hero */}
        <div className="gradient-hero rounded-2xl p-8 glow-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="relative">
            <h1 className="text-2xl font-bold text-primary-foreground mb-2">
              Добро пожаловать в Trend TikTok 🔥
            </h1>
            <p className="text-primary-foreground/80 max-w-lg">
              Мониторинг трендов, анализ контента и отслеживание аккаунтов TikTok
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="bg-card rounded-2xl p-5 card-shadow hover-lift card-shadow-hover transition-all duration-200 border border-border/50"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl gradient-card flex items-center justify-center">
                  <s.icon className={cn("h-5 w-5", s.color)} />
                </div>
                <span className="text-sm text-muted-foreground font-medium">{s.label}</span>
              </div>
              <p className="text-3xl font-bold mt-3 text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl p-6 card-shadow border border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg gradient-card flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <h2 className="font-semibold text-lg text-foreground">Отслеживаемые авторы</h2>
            </div>
            {accountsData && accountsData.length > 0 ? (
              <div className="space-y-2">
                {accountsData.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors">
                    {a.avatar_url ? (
                      <img src={a.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-border" />
                    ) : (
                      <div className="h-9 w-9 rounded-full gradient-hero flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {a.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">@{a.username}</p>
                      <p className="text-xs text-muted-foreground">{Number(a.followers).toLocaleString("ru-RU")} подписчиков</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Нет отслеживаемых авторов</p>
                <p className="text-muted-foreground/60 text-xs mt-1">Добавьте через «Анализ аккаунт»</p>
              </div>
            )}
          </div>

          <div className="bg-card rounded-2xl p-6 card-shadow border border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg gradient-card flex items-center justify-center">
                <SearchIcon className="h-4 w-4 text-primary" />
              </div>
              <h2 className="font-semibold text-lg text-foreground">Последние запросы</h2>
            </div>
            {recentQueries && recentQueries.length > 0 ? (
              <div className="space-y-1">
                {recentQueries.map((q) => (
                  <div key={q.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium text-foreground truncate">{q.query_text}</span>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {new Date(q.last_run_at).toLocaleDateString("ru-RU")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <SearchIcon className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Нет запросов</p>
                <p className="text-muted-foreground/60 text-xs mt-1">Начните через раздел «Поиск»</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
