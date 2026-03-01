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
    { label: "Избранное", value: String(favCount), icon: Star },
    { label: "Авторы", value: String(accountsData?.length || 0), icon: Users },
    { label: "Подписчики", value: totalFollowers.toLocaleString("ru-RU"), icon: Heart },
    { label: "История", value: String(activityCount), icon: Activity },
  ];

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        <div className="gradient-hero rounded-2xl p-8 glow-primary">
          <h1 className="text-2xl font-bold text-primary-foreground mb-2">
            Добро пожаловать в Trend TikTok
          </h1>
          <p className="text-primary-foreground/70 max-w-lg">
            Мониторинг трендов, анализ контента и отслеживание аккаунтов TikTok
          </p>
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg text-foreground">Отслеживаемые авторы</h2>
            </div>
            {accountsData && accountsData.length > 0 ? (
              <div className="space-y-3">
                {accountsData.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    {a.avatar_url ? (
                      <img src={a.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {a.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">@{a.username}</p>
                      <p className="text-xs text-muted-foreground">{Number(a.followers).toLocaleString("ru-RU")} подписчиков</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm py-8 text-center">
                Нет отслеживаемых авторов.
                <br />
                <span className="text-xs">Добавьте авторов через раздел «Анализ аккаунт»</span>
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <SearchIcon className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg text-foreground">Последние запросы</h2>
            </div>
            {recentQueries && recentQueries.length > 0 ? (
              <div className="space-y-2">
                {recentQueries.map((q) => (
                  <div key={q.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <span className="text-sm text-foreground truncate">{q.query_text}</span>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {new Date(q.last_run_at).toLocaleDateString("ru-RU")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm py-8 text-center">
                Нет запросов.
                <br />
                <span className="text-xs">Начните поиск через раздел «Поиск»</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
