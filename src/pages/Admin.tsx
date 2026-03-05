import { AppLayout } from "@/components/layout/AppLayout";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  RefreshCw, Hash, BarChart3, Play, Trash2, Plus, Save, Shield, Loader2,
  Users, Activity, Video, Search, Heart, UserCircle, ScrollText,
  CreditCard, Crown, X, Edit2, Sparkles, Check, Coins, Zap, Eye,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Admin() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();

  if (adminLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Админ-панель</h1>
        </div>

        <Tabs defaultValue="platform" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1 w-full max-w-3xl">
            <TabsTrigger value="platform"><Activity className="h-4 w-4 mr-1" />Платформа</TabsTrigger>
            <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" />Пользователи</TabsTrigger>
            <TabsTrigger value="tariffs"><CreditCard className="h-4 w-4 mr-1" />Тарифы</TabsTrigger>
            <TabsTrigger value="trends"><RefreshCw className="h-4 w-4 mr-1" />Тренды</TabsTrigger>
          </TabsList>

          <TabsContent value="platform"><PlatformTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="tariffs"><TariffsTab /></TabsContent>
          <TabsContent value="trends"><TrendsManagementTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

/* ==================== PLATFORM TAB ==================== */
function PlatformTab() {
  const fetchHeaders = async () => ({
    Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-platform-stats"],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=platform-stats`,
        { headers: await fetchHeaders() }
      );
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    refetchInterval: 60000,
  });

  const { data: apiUsage } = useQuery({
    queryKey: ["admin-api-usage"],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=api-usage&days=30`,
        { headers: await fetchHeaders() }
      );
      if (!res.ok) throw new Error("Failed to fetch API usage");
      return res.json();
    },
    refetchInterval: 60000,
  });

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mt-8" />;


  const statCards = [
    { label: "Пользователи", value: stats?.totalUsers || 0, icon: Users, color: "text-primary" },
    { label: "Подтверждённые", value: stats?.confirmedUsers || 0, icon: Check, color: "text-green-500" },
    { label: "Не подтверждённые", value: stats?.unconfirmedUsers || 0, icon: Eye, color: "text-destructive" },
    { label: "Активные (7д)", value: stats?.activeUsers || 0, icon: Activity, color: "text-primary/80" },
    { label: "Активные (24ч)", value: stats?.activeUsers24h || 0, icon: Zap, color: "text-yellow-500" },
    { label: "Онлайн сегодня", value: stats?.activeToday || 0, icon: Activity, color: "text-green-500" },
    { label: "Видео в базе", value: stats?.totalVideos || 0, icon: Video, color: "text-primary" },
    { label: "Избранные", value: stats?.totalFavorites || 0, icon: Heart, color: "text-primary/80" },
    { label: "Скрипты", value: stats?.totalScripts || 0, icon: ScrollText, color: "text-primary/70" },
    { label: "Анализы видео", value: stats?.totalAnalyses || 0, icon: Video, color: "text-primary/70" },
    { label: "Поисковые запросы", value: stats?.totalSearches || 0, icon: Search, color: "text-primary/60" },
    { label: "Отслеживаемые аккаунты", value: stats?.totalAccounts || 0, icon: UserCircle, color: "text-primary" },
  ];

  const activityTypeLabels: Record<string, string> = {
    search: "🔍 Поиск",
    video_analysis: "🎬 Анализ видео",
    profile_analysis: "👤 Анализ профиля",
    script_generation: "✍️ AI Сценарий",
  };

  return (
    <div className="space-y-6">
      {/* Main stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value?.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Token Economy */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            Экономика токенов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Выдано всего</p>
              <p className="text-xl font-bold text-green-500">{(stats?.totalTokensIssued || 0).toLocaleString()}</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Потрачено</p>
              <p className="text-xl font-bold text-destructive">{(stats?.totalTokensSpent || 0).toLocaleString()}</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Баланс на руках</p>
              <p className="text-xl font-bold text-primary">{(stats?.totalTokensBalance || 0).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Activity breakdown 24h */}
        {stats?.activityBreakdown && Object.keys(stats.activityBreakdown).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Действия за 24 часа</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.activityBreakdown)
                  .sort((a, b) => (b[1] as number) - (a[1] as number))
                  .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <span className="text-sm">{activityTypeLabels[type] || type}</span>
                    <Badge variant="secondary" className="text-sm font-bold">{count as number}</Badge>
                  </div>
                ))}
                <div className="flex items-center justify-between p-2 bg-primary/10 rounded-lg mt-2">
                  <span className="text-sm font-medium">Всего действий</span>
                  <Badge className="text-sm font-bold">
                    {String(Object.values(stats.activityBreakdown as Record<string, number>).reduce((a, b) => a + b, 0))}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan distribution */}
        {stats?.planDistribution && Object.keys(stats.planDistribution).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Распределение по тарифам
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.planDistribution)
                  .sort((a, b) => (b[1] as number) - (a[1] as number))
                  .map(([plan, count]) => {
                    const total = Object.values(stats.planDistribution as Record<string, number>).reduce((a, b) => a + b, 0);
                    const pct = total > 0 ? Math.round(((count as number) / total) * 100) : 0;
                    return (
                      <div key={plan} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{plan}</span>
                          <span className="text-muted-foreground">{count as number} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top active users */}
      {stats?.topUsers && stats.topUsers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Топ-10 активных пользователей (7 дней)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topUsers.map((u: any, i: number) => (
                <div key={u.email} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                    <span className="text-sm truncate max-w-[200px]">{u.email}</span>
                  </div>
                  <Badge variant="secondary">{u.actions} действий</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Videos by niche */}
        {stats?.videosByNiche && Object.keys(stats.videosByNiche).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Hash className="h-5 w-5 text-primary" />
                Видео по нишам
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {Object.entries(stats.videosByNiche)
                  .sort((a, b) => (b[1] as number) - (a[1] as number))
                  .map(([niche, count]) => (
                    <div key={niche} className="flex items-center justify-between text-sm p-1.5 hover:bg-muted/30 rounded">
                      <span className="truncate max-w-[180px]">{niche}</span>
                      <span className="text-muted-foreground font-medium">{(count as number).toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registration history */}
        {stats?.registrationsByDay && Object.keys(stats.registrationsByDay).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Регистрации (30 дней)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {Object.entries(stats.registrationsByDay)
                  .sort((a, b) => b[0].localeCompare(a[0]))
                  .map(([day, count]) => (
                    <div key={day} className="flex items-center justify-between text-sm p-1.5 hover:bg-muted/30 rounded">
                      <span>{new Date(day).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</span>
                      <Badge variant="outline">{count as number}</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Activity by day (7 days) */}
      {stats?.activityByDay && Object.keys(stats.activityByDay).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Активность по дням (7 дней)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 text-muted-foreground font-medium">День</th>
                    {(() => {
                      const allTypes = new Set<string>();
                      Object.values(stats.activityByDay as Record<string, Record<string, number>>).forEach(d => Object.keys(d).forEach(t => allTypes.add(t)));
                      return Array.from(allTypes).map(t => (
                        <th key={t} className="text-center p-2 text-muted-foreground font-medium text-xs">{activityTypeLabels[t] || t}</th>
                      ));
                    })()}
                    <th className="text-center p-2 text-muted-foreground font-medium">Итого</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.activityByDay as Record<string, Record<string, number>>)
                    .sort((a, b) => b[0].localeCompare(a[0]))
                    .map(([day, types]) => {
                      const allTypes = new Set<string>();
                      Object.values(stats.activityByDay as Record<string, Record<string, number>>).forEach(d => Object.keys(d).forEach(t => allTypes.add(t)));
                      const total = Object.values(types).reduce((a, b) => a + b, 0);
                      return (
                        <tr key={day} className="border-b border-border/30">
                          <td className="p-2">{new Date(day).toLocaleDateString("ru-RU", { day: "numeric", month: "short", weekday: "short" })}</td>
                          {Array.from(allTypes).map(t => (
                            <td key={t} className="text-center p-2">{types[t] || 0}</td>
                          ))}
                          <td className="text-center p-2 font-bold">{total}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent trend refreshes */}
      {stats?.recentRefreshes && stats.recentRefreshes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Последние обновления трендов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentRefreshes.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={r.status === "done" ? "default" : r.status === "error" ? "destructive" : "secondary"}>
                      {r.status}
                    </Badge>
                    <span className="text-muted-foreground">
                      {new Date(r.started_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <span className="font-medium">+{r.total_saved || 0} видео</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* EnsembleData API Usage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            EnsembleData API кредиттер (30 күн)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {apiUsage ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Жалпы кредит</p>
                  <p className="text-2xl font-bold text-primary">{(apiUsage.totalCredits || 0).toLocaleString()}</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">API шақырулар</p>
                  <p className="text-2xl font-bold text-foreground">{(apiUsage.totalCalls || 0).toLocaleString()}</p>
                </div>
              </div>

              {/* By action breakdown */}
              {apiUsage.byAction && Object.keys(apiUsage.byAction).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Функция бойынша бөлінуі</h4>
                  {Object.entries(apiUsage.byAction as Record<string, number>)
                    .sort((a, b) => b[1] - a[1])
                    .map(([key, credits]) => {
                      const actionLabels: Record<string, string> = {
                        "refresh-trends/keyword_full_search": "🔄 Тренд жаңарту",
                        "socialkit/search": "🔍 Пайдаланушы іздеу",
                        "socialkit/video_stats": "📊 Видео статистика",
                        "socialkit/analyze_video": "🎬 Видео анализ",
                        "socialkit/account_stats": "👤 Профиль анализ",
                        "socialkit/admin_search": "🔎 Админ іздеу",
                        "ensemble-search/keyword_full_search": "🔍 Ensemble іздеу",
                      };
                      const total = apiUsage.totalCredits || 1;
                      const pct = Math.round((credits / total) * 100);
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{actionLabels[key] || key}</span>
                            <span className="text-muted-foreground font-medium">{credits} кредит ({pct}%)</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* By day table */}
              {apiUsage.byDay && Object.keys(apiUsage.byDay).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Күн бойынша</h4>
                  <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border sticky top-0 bg-card">
                          <th className="text-left p-2 text-muted-foreground font-medium">Күн</th>
                          <th className="text-center p-2 text-muted-foreground font-medium">🔄 Тренд</th>
                          <th className="text-center p-2 text-muted-foreground font-medium">🔍 Іздеу</th>
                          <th className="text-center p-2 text-muted-foreground font-medium">🎬 Анализ</th>
                          <th className="text-center p-2 text-muted-foreground font-medium">👤 Профиль</th>
                          <th className="text-center p-2 text-muted-foreground font-medium">📊 Стат.</th>
                          <th className="text-center p-2 text-muted-foreground font-medium text-primary font-bold">Барлығы</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(apiUsage.byDay as Record<string, Record<string, number>>)
                          .sort((a, b) => b[0].localeCompare(a[0]))
                          .map(([day, actions]) => {
                            const trend = (actions["refresh-trends/keyword_full_search"] || 0);
                            const search = (actions["socialkit/search"] || 0) + (actions["socialkit/admin_search"] || 0) + (actions["ensemble-search/keyword_full_search"] || 0);
                            const analyze = (actions["socialkit/analyze_video"] || 0);
                            const profile = (actions["socialkit/account_stats"] || 0);
                            const videoStats = (actions["socialkit/video_stats"] || 0);
                            const total = Object.values(actions).reduce((a, b) => a + b, 0);
                            return (
                              <tr key={day} className="border-b border-border/30">
                                <td className="p-2">{new Date(day).toLocaleDateString("ru-RU", { day: "numeric", month: "short", weekday: "short" })}</td>
                                <td className="text-center p-2">{trend || "—"}</td>
                                <td className="text-center p-2">{search || "—"}</td>
                                <td className="text-center p-2">{analyze || "—"}</td>
                                <td className="text-center p-2">{profile || "—"}</td>
                                <td className="text-center p-2">{videoStats || "—"}</td>
                                <td className="text-center p-2 font-bold">{total}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {apiUsage.totalCalls === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  API қолдану деректері жинала бастады. Келесі іздеулер мен жаңартулардан кейін деректер пайда болады.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Жүктелуде...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ==================== USERS TAB ==================== */
function UsersTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [subDialog, setSubDialog] = useState<{ userId: string; email: string } | null>(null);
  const [subPlanId, setSubPlanId] = useState("");
  const [subDays, setSubDays] = useState("30");
  const [subNote, setSubNote] = useState("");
  const [userFilter, setUserFilter] = useState<string>("all");

  const { data: plans = [] } = useQuery({
    queryKey: ["admin-plans-for-users"],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=list-plans`, {
        headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      });
      if (!res.ok) throw new Error("Failed");
      return (await res.json()).plans || [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users-list", search],
    queryFn: async () => {
      const params = new URLSearchParams({ action: "list" });
      if (search) params.set("search", search);
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?${params}`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ user_id, role, remove }: { user_id: string; role: string; remove?: boolean }) => {
      const action = remove ? "remove-role" : "assign-role";
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=${action}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id, role }),
        }
      );
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      toast.success("Роль обновлена");
    },
    onError: () => toast.error("Ошибка обновления роли"),
  });

  const subMutation = useMutation({
    mutationFn: async ({ user_id, plan_id, duration_days, note }: { user_id: string; plan_id: string; duration_days: number; note: string }) => {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=assign-subscription`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id, plan_id, duration_days, note }),
        }
      );
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      setSubDialog(null);
      setSubPlanId("");
      setSubDays("30");
      setSubNote("");
      const msg = "Тариф назначен";
      toast.success(msg);
    },
    onError: () => toast.error("Ошибка назначения тарифа"),
  });

  const allUsers = data?.users || [];
  
  const filteredUsers = allUsers.filter((u: any) => {
    if (userFilter === "all") return true;
    if (userFilter === "unconfirmed") return !u.email_confirmed_at;
    if (userFilter === "no_plan") return !u.subscription;
    // Filter by plan name — exclude unconfirmed users from plan filters
    if (!u.email_confirmed_at) return false;
    const planName = u.subscription?.plans?.name?.toLowerCase() || "";
    return planName === userFilter.toLowerCase();
  });

  // Count badges — exclude unconfirmed from plan counts
  const planCounts: Record<string, number> = {};
  const unconfirmedCount = allUsers.filter((u: any) => !u.email_confirmed_at).length;
  const noPlanCount = allUsers.filter((u: any) => !u.subscription).length;
  for (const u of allUsers) {
    if (!u.email_confirmed_at) continue; // don't count unconfirmed in plan filters
    const pn = (u as any).subscription?.plans?.name;
    if (pn) planCounts[pn] = (planCounts[pn] || 0) + 1;
  }

  const planOrder = ["Пробный", "1 ай", "3 ай"];
  const allPlanNames = (plans as any[])
    .filter((p: any) => p.is_active)
    .sort((a: any, b: any) => {
      const ia = planOrder.indexOf(a.name);
      const ib = planOrder.indexOf(b.name);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    })
    .map((p: any) => p.name) as string[];

  return (
    <div className="space-y-4">
      <Input
        placeholder="Поиск по email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        <Button
          size="sm"
          variant={userFilter === "all" ? "default" : "outline"}
          onClick={() => setUserFilter("all")}
          className="h-8 text-xs"
        >
          Все ({allUsers.length})
        </Button>
        {allPlanNames.map((pn) => (
          <Button
            key={pn}
            size="sm"
            variant={userFilter === pn ? "default" : "outline"}
            onClick={() => setUserFilter(pn)}
            className="h-8 text-xs"
          >
            <CreditCard className="h-3 w-3 mr-1" />
            {pn} ({planCounts[pn] || 0})
          </Button>
        ))}
        <Button
          size="sm"
          variant={userFilter === "no_plan" ? "default" : "outline"}
          onClick={() => setUserFilter("no_plan")}
          className="h-8 text-xs"
        >
          Без тарифа ({noPlanCount})
        </Button>
        <Button
          size="sm"
          variant={userFilter === "unconfirmed" ? "destructive" : "outline"}
          onClick={() => setUserFilter("unconfirmed")}
          className="h-8 text-xs"
        >
          <Eye className="h-3 w-3 mr-1" />
          Не подтверждённые ({unconfirmedCount})
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mt-8" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-muted-foreground font-medium">Email</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Регистрация</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Тариф</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Роли</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Роли</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u: any) => {
                    const sub = u.subscription;
                    const isExpired = sub && new Date(sub.expires_at) < new Date();
                    
                    return (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-3">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium">{u.email}</p>
                            {!u.email_confirmed_at && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-destructive text-destructive">
                                не подтв.
                              </Badge>
                            )}
                          </div>
                          {u.name && <p className="text-xs text-foreground/80">{u.name}</p>}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {u.phone && <span>📞 {u.phone}</span>}
                            <span>Вход: {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("ru-RU") : "—"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {new Date(u.created_at).toLocaleDateString("ru-RU")}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => setSubDialog({ userId: u.id, email: u.email })}
                          className="hover:bg-muted/50 rounded-lg px-2 py-1 transition-colors"
                        >
                        {sub ? (
                          <div className="flex flex-col gap-0.5">
                            <Badge variant={isExpired ? "destructive" : "default"} className="text-xs w-fit">
                              <CreditCard className="h-3 w-3 mr-1" />
                              {sub.plans?.name || "—"}
                            </Badge>
                            <span className={`text-xs ${isExpired ? "text-destructive" : "text-muted-foreground"}`}>
                              до {new Date(sub.expires_at).toLocaleDateString("ru-RU")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground hover:text-primary">+ Назначить</span>
                        )}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {u.roles.length === 0 && (
                            <span className="text-muted-foreground text-xs">user</span>
                          )}
                          {u.roles.map((r: string) => (
                            <Badge
                              key={r}
                              variant={r === "admin" ? "default" : "secondary"}
                              className="gap-1 pr-1 text-xs"
                            >
                              {r}
                              <button
                                onClick={() => roleMutation.mutate({ user_id: u.id, role: r, remove: true })}
                                className="ml-0.5 hover:text-destructive"
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <RoleAssigner
                          userId={u.id}
                          currentRoles={u.roles}
                          onAssign={(role) => roleMutation.mutate({ user_id: u.id, role })}
                          disabled={roleMutation.isPending}
                        />
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription assign dialog */}
      <Dialog open={!!subDialog} onOpenChange={(o) => { if (!o) setSubDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Назначить тариф
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{subDialog?.email}</p>
            <div>
              <label className="text-sm font-medium text-foreground">Тариф</label>
              <Select value={subPlanId} onValueChange={setSubPlanId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Выберите тариф" /></SelectTrigger>
                <SelectContent>
                  {plans.filter((p: any) => p.is_active).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.price_rub === 0 ? "Тегін" : `${p.price_rub.toLocaleString()} ₸`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Срок (дней)</label>
              <Input type="number" value={subDays} onChange={(e) => setSubDays(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Примечание</label>
              <Input value={subNote} onChange={(e) => setSubNote(e.target.value)} placeholder="Необязательно" className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubDialog(null)}>Отмена</Button>
            <Button
              onClick={() => {
                if (!subPlanId || !subDialog) return toast.error("Выберите тариф");
                subMutation.mutate({ user_id: subDialog.userId, plan_id: subPlanId, duration_days: Number(subDays), note: subNote });
              }}
              disabled={subMutation.isPending || !subPlanId}
            >
              {subMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Назначить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RoleAssigner({
  userId,
  currentRoles,
  onAssign,
  disabled,
}: {
  userId: string;
  currentRoles: string[];
  onAssign: (role: string) => void;
  disabled: boolean;
}) {
  const availableRoles = ["admin", "moderator", "user"].filter((r) => !currentRoles.includes(r));
  if (availableRoles.length === 0) return null;

  return (
    <Select onValueChange={onAssign} disabled={disabled}>
      <SelectTrigger className="w-32 h-8 text-xs">
        <SelectValue placeholder="+ Роль" />
      </SelectTrigger>
      <SelectContent>
        {availableRoles.map((r) => (
          <SelectItem key={r} value={r}>{r}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}



/* ==================== TRENDS MANAGEMENT TAB (combined) ==================== */
function TrendsManagementTab() {
  const [section, setSection] = useState<"refresh" | "keywords" | "stats" | "recat">("refresh");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          { key: "refresh" as const, label: "Обновление", icon: Play },
          { key: "keywords" as const, label: "Запросы", icon: Hash },
          { key: "stats" as const, label: "По категориям", icon: BarChart3 },
          { key: "recat" as const, label: "Рекатегоризация", icon: Sparkles },
        ].map(({ key, label, icon: Icon }) => (
          <Button key={key} variant={section === key ? "default" : "outline"} size="sm" onClick={() => setSection(key)} className="gap-1.5">
            <Icon className="h-4 w-4" />{label}
          </Button>
        ))}
      </div>
      {section === "refresh" && <RefreshSection />}
      {section === "keywords" && <KeywordsSection />}
      {section === "stats" && <StatsSection />}
      {section === "recat" && <RecategorizeSection />}
    </div>
  );
}




function RefreshSection() {
  const queryClient = useQueryClient();
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(true);

  const { data: nicheQueries = {} } = useQuery({
    queryKey: ["trend-settings", "niche_queries"],
    queryFn: async () => {
      const { data } = await supabase.from("trend_settings").select("value").eq("key", "niche_queries").single();
      return (data?.value as Record<string, string[]>) || {};
    },
  });

  const { data: categoryLimits = {} } = useQuery({
    queryKey: ["trend-settings", "category_limits"],
    queryFn: async () => {
      const { data } = await supabase.from("trend_settings").select("value").eq("key", "category_limits").maybeSingle();
      return (data?.value as Record<string, number>) || {};
    },
  });

  const { data: videoCounts = {} } = useQuery({
    queryKey: ["video-counts-by-category"],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000).toISOString();
      const counts: Record<string, number> = {};
      let from = 0;
      const PAGE = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("videos")
          .select("categories")
          .gte("published_at", sevenDaysAgo)
          .range(from, from + PAGE - 1);
        if (error || !data || data.length === 0) break;
        for (const row of data) {
          const cats = (row as any).categories as string[] | null;
          if (cats) {
            for (const c of cats) counts[c] = (counts[c] || 0) + 1;
          }
        }
        if (data.length < PAGE) break;
        from += PAGE;
      }
      return counts;
    },
    refetchInterval: 10000,
  });

  const allNiches = Object.keys(nicheQueries).sort();

  const { data: totalVideos7d = 0 } = useQuery({
    queryKey: ["videos-count-7d"],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000).toISOString();
      const { count } = await supabase
        .from("videos")
        .select("*", { count: "exact", head: true })
        .gte("published_at", sevenDaysAgo);
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const { data: totalVideosAll = 0 } = useQuery({
    queryKey: ["videos-count-all"],
    queryFn: async () => {
      const { count } = await supabase
        .from("videos")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["refresh-logs"],
    queryFn: async () => {
      const { data } = await supabase.from("trend_refresh_logs").select("*").order("started_at", { ascending: false }).limit(20);
      return data || [];
    },
    refetchInterval: 5000,
  });

  const isRunning = logs.some((l: any) => l.status === "running");

  const toggleNiche = (niche: string) => {
    setSelectAll(false);
    setSelectedNiches(prev => prev.includes(niche) ? prev.filter(n => n !== niche) : [...prev, niche]);
  };

  const triggerRefresh = async () => {
    const niches = selectAll ? null : selectedNiches;
    if (!selectAll && selectedNiches.length === 0) {
      toast.error("Выберите хотя бы одну категорию");
      return;
    }
    const label = selectAll ? "все категории" : `${selectedNiches.length} категорий`;
    toast.info(`Обновление запущено: ${label}. Каждая категория будет заполнена до лимита.`);
    supabase.functions.invoke("refresh-trends", { 
      body: { mode: "mass", ...(niches ? { target_niches: niches } : {}) } 
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ["refresh-logs"] });
    }).catch(() => {
      queryClient.invalidateQueries({ queryKey: ["refresh-logs"] });
    });
    setTimeout(() => queryClient.invalidateQueries({ queryKey: ["refresh-logs"] }), 2000);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg">Обновление трендов</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Category selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                variant={selectAll ? "default" : "outline"}
                size="sm"
                onClick={() => { setSelectAll(true); setSelectedNiches([]); }}
                className="gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Все категории
              </Button>
              <Button
                variant={!selectAll ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectAll(false)}
                className="gap-1.5"
              >
                <Hash className="h-3.5 w-3.5" />
                Выбрать категории
              </Button>
            </div>

            {!selectAll && (
              <div className="space-y-2">
                <div className="flex gap-2 flex-wrap">
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setSelectedNiches([...allNiches])}>
                    Выбрать все
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => {
                    const unfilled = allNiches.filter(n => (videoCounts[n] || 0) < (categoryLimits[n] || 100));
                    setSelectedNiches(unfilled);
                  }}>
                    Только незаполненные
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setSelectedNiches([])}>
                    Сбросить
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-[300px] overflow-y-auto">
                  {allNiches.map(niche => {
                    const count = videoCounts[niche] || 0;
                    const limit = categoryLimits[niche] || 100;
                    const isFull = count >= limit;
                    const isSelected = selectedNiches.includes(niche);
                    return (
                      <button
                        key={niche}
                        onClick={() => toggleNiche(niche)}
                        className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs border transition-colors ${
                          isSelected 
                            ? "bg-primary text-primary-foreground border-primary" 
                            : isFull 
                              ? "bg-muted/30 border-border/50 text-muted-foreground"
                              : "bg-background border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="font-medium truncate">{niche}</span>
                        <span className={`ml-1 text-[10px] ${isFull ? "text-primary" : ""}`}>
                          {count}/{limit}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <Button 
            onClick={triggerRefresh} 
            disabled={isRunning} 
            size="lg"
            className="w-full gap-3 h-14 text-base"
          >
            {isRunning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
            {isRunning 
              ? "⏳ Обновление идёт на сервере..." 
              : selectAll 
                ? "🚀 Запустить (все категории)"
                : `🚀 Запустить (${selectedNiches.length} категорий)`
            }
          </Button>
          {isRunning && (
            <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Обновление работает на сервере.</span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={async () => {
                  const runningLog = logs.find((l: any) => l.status === "running");
                  if (!runningLog) return;
                  const { error } = await supabase.from("trend_refresh_logs").update({
                    status: "error",
                    error_message: "Остановлено вручную администратором",
                    finished_at: new Date().toISOString(),
                  }).eq("id", runningLog.id);
                  if (error) { toast.error("Не удалось остановить"); return; }
                  toast.success("Обновление остановлено");
                  queryClient.invalidateQueries({ queryKey: ["refresh-logs"] });
                }}
              >
                <X className="h-4 w-4" />Остановить
              </Button>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Каждая категория заполняется до лимита, после чего переходит к следующей. Лимит достигнут — категория пропускается.
          </p>
        </CardContent>
      </Card>
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><ScrollText className="h-5 w-5" />Журнал обновлений</CardTitle>
            {totalVideos7d > 0 && (
              <p className="text-sm text-muted-foreground">📹 Добавлено видео за 7 дней: <span className="font-semibold text-foreground">{totalVideos7d}</span></p>
            )}
          </CardHeader>
          <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
            {logs.map((log: any) => {
              const startedAt = new Date(log.started_at);
              const finishedAt = log.finished_at ? new Date(log.finished_at) : null;
              const durationMs = finishedAt ? finishedAt.getTime() - startedAt.getTime() : null;
              const durationStr = durationMs != null
                ? durationMs < 60000
                  ? `${Math.round(durationMs / 1000)}с`
                  : `${Math.floor(durationMs / 60000)}м ${Math.round((durationMs % 60000) / 1000)}с`
                : "—";
              const nicheStatsRaw: Record<string, any> = (log.niche_stats as any) || {};
              const nicheEntries = Object.entries(nicheStatsRaw)
                .filter(([key, val]) => key !== "_rotation" && typeof val === "number")
                .sort(([, a], [, b]) => (b as number) - (a as number));
              const totalNiche = log.total_saved || 0;
              const totalGeneral = log.general_saved || 0;
              const grandTotal = totalNiche + totalGeneral;


              return (
                <div key={log.id} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={
                      log.status === "done" || log.status === "completed" ? "default" 
                      : log.status === "running" ? "secondary" 
                      : "destructive"
                    }>
                      {log.status === "done" || log.status === "completed" ? "✅ Готово" : log.status === "running" ? "⏳ В процессе" : `❌ ${log.status}`}
                    </Badge>
                    <Badge variant="outline">{log.mode?.toUpperCase()}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {startedAt.toLocaleString("ru-RU")}
                    </span>
                    {durationMs != null && (
                      <Badge variant="secondary" className="text-xs">⏱ {durationStr}</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-muted/40 rounded-md p-2">
                      <p className="text-lg font-bold text-foreground">{grandTotal}</p>
                      <p className="text-xs text-muted-foreground">Этот запуск</p>
                    </div>
                    <div className="bg-muted/40 rounded-md p-2">
                      <p className="text-lg font-bold text-foreground">{totalVideosAll}</p>
                      <p className="text-xs text-muted-foreground">Всего в базе</p>
                    </div>
                    <div className="bg-primary/10 rounded-md p-2">
                      <p className="text-lg font-bold text-primary">{totalVideos7d}</p>
                      <p className="text-xs text-muted-foreground">За 7 дней</p>
                    </div>
                  </div>

                  {nicheEntries.length > 0 && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors text-xs font-medium">
                        📊 По категориям ({nicheEntries.length})
                      </summary>
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                        {nicheEntries.map(([niche, count]) => {
                          const total7d = videoCounts[niche] || 0;
                          return (
                            <div key={niche} className="flex items-center justify-between bg-muted/30 rounded px-2 py-1 text-xs">
                              <span className="truncate font-medium">{niche}</span>
                              <span className="ml-1 flex items-center gap-1 shrink-0">
                                <Badge variant={Number(count) > 0 ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                                  +{count as number}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">/ {total7d}</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  )}

                  {log.error_message && (
                    <p className="text-xs text-destructive bg-destructive/10 rounded p-2">❌ {log.error_message}</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KeywordsSection() {
  const queryClient = useQueryClient();
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [newQuery, setNewQuery] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const { data: nicheQueries = {}, isLoading } = useQuery({
    queryKey: ["trend-settings", "niche_queries"],
    queryFn: async () => {
      const { data } = await supabase.from("trend_settings").select("value").eq("key", "niche_queries").single();
      return (data?.value as Record<string, string[]>) || {};
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (updated: Record<string, string[]>) => {
      const { error } = await supabase.from("trend_settings").update({ value: updated as any, updated_at: new Date().toISOString() }).eq("key", "niche_queries");
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["trend-settings"] }); toast.success("Запросы сохранены"); },
    onError: () => toast.error("Ошибка сохранения"),
  });

  const addQuery = () => {
    if (!newQuery.trim()) return;
    if (selectedNiche) {
      const updated = { ...nicheQueries };
      updated[selectedNiche] = [...(updated[selectedNiche] || []), newQuery.trim()];
      saveMutation.mutate(updated);
    }
    setNewQuery("");
  };

  const removeQuery = (index: number) => {
    if (selectedNiche) {
      const updated = { ...nicheQueries };
      updated[selectedNiche] = updated[selectedNiche].filter((_, i) => i !== index);
      saveMutation.mutate(updated);
    }
  };

  const generateWithAI = async (seedWord?: string) => {
    if (!selectedNiche) return;
    setAiLoading(true);
    setAiSuggestions([]);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-keywords`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          niche: selectedNiche,
          existing_queries: nicheQueries[selectedNiche] || [],
          ...(seedWord ? { seed_word: seedWord } : {}),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Ошибка генерации");
      }
      const data = await res.json();
      setAiSuggestions(data.keywords || []);
      if ((data.keywords || []).length === 0) toast.info("AI не сгенерировал новых запросов");
      else toast.success(`Сгенерировано ${data.keywords.length} запросов`);
    } catch (e: any) {
      toast.error(e.message || "Ошибка AI генерации");
    } finally {
      setAiLoading(false);
    }
  };

  const generateFromSeed = () => {
    const word = newQuery.trim();
    if (!word || !selectedNiche) {
      toast.error("Введите ключевое слово");
      return;
    }
    generateWithAI(word);
    setNewQuery("");
  };

  const acceptSuggestion = (keyword: string) => {
    if (!selectedNiche) return;
    const updated = { ...nicheQueries };
    updated[selectedNiche] = [...(updated[selectedNiche] || []), keyword];
    saveMutation.mutate(updated);
    setAiSuggestions((prev) => prev.filter((k) => k !== keyword));
  };

  const acceptAllSuggestions = () => {
    if (!selectedNiche || aiSuggestions.length === 0) return;
    const updated = { ...nicheQueries };
    updated[selectedNiche] = [...(updated[selectedNiche] || []), ...aiSuggestions];
    saveMutation.mutate(updated);
    setAiSuggestions([]);
    toast.success("Все запросы добавлены");
  };

  const bulkRegenerate = async () => {
    setBulkLoading(true);
    try {
      const res = await supabase.functions.invoke("generate-keywords", { body: { bulk: true } });
      if (res.error) throw new Error("Ошибка генерации");
      const stats = res.data?.stats || {};
      const total = Object.values(stats).reduce((a: number, b: any) => a + (b as number), 0);
      toast.success(`Обновлено ${Object.keys(stats).length} категорий, всего ${total} запросов`);
      queryClient.invalidateQueries({ queryKey: ["trend-settings"] });
    } catch (e: any) {
      toast.error(e.message || "Ошибка");
    } finally {
      setBulkLoading(false);
    }
  };

  const selectNiche = (niche: string) => {
    setSelectedNiche(selectedNiche === niche ? null : niche);
    setAiSuggestions([]);
  };

  const niches = Object.keys(nicheQueries).sort();
  const activeQueries = selectedNiche ? nicheQueries[selectedNiche] || [] : [];
  const activeLabel = selectedNiche || "";
  const isActive = !!selectedNiche;

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mt-8" />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button onClick={bulkRegenerate} disabled={bulkLoading} variant="outline" className="gap-2">
          {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {bulkLoading ? "Генерация..." : "🔄 Обновить все запросы (AI КЗ/РУ)"}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {niches.map((niche) => (
          <Badge key={niche} variant={selectedNiche === niche ? "default" : "outline"} className="cursor-pointer text-sm" onClick={() => selectNiche(niche)}>
            {niche} ({nicheQueries[niche]?.length || 0})
          </Badge>
        ))}
      </div>
      {isActive && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Запросы: <span className="text-primary">{activeLabel}</span></CardTitle>
              {selectedNiche && (
                <Button onClick={() => generateWithAI()} disabled={aiLoading} size="sm" variant="outline" className="gap-1.5">
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  AI запросы
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Введите слово → AI найдёт запросы..." value={newQuery} onChange={(e) => setNewQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addQuery()} />
              <Button onClick={addQuery} size="sm" disabled={saveMutation.isPending} title="Добавить как есть"><Plus className="h-4 w-4" /></Button>
              <Button onClick={generateFromSeed} size="sm" variant="secondary" disabled={aiLoading || !newQuery.trim()} title="AI: найти запросы по слову" className="gap-1.5">
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                AI
              </Button>
            </div>

            {aiSuggestions.length > 0 && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-primary" />AI предложения</span>
                  <Button size="sm" variant="default" onClick={acceptAllSuggestions} className="h-7 text-xs gap-1">
                    <Check className="h-3 w-3" />Добавить все ({aiSuggestions.length})
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiSuggestions.map((k, i) => (
                    <Badge key={i} variant="outline" className="gap-1 pr-1 cursor-pointer border-primary/40 hover:bg-primary/10" onClick={() => acceptSuggestion(k)}>
                      <Plus className="h-3 w-3 text-primary" />{k}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
              {activeQueries.map((q, i) => (
                <Badge key={i} variant="secondary" className="gap-1 pr-1">
                  {q}
                  <button onClick={() => removeQuery(i)} className="ml-1 hover:text-destructive transition-colors"><Trash2 className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}




function StatsSection() {
  const queryClient = useQueryClient();
  const [categoryLimits, setCategoryLimits] = useState<Record<string, number | null>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [selectedNiches, setSelectedNiches] = useState<Set<string>>(new Set());
  const [bulkLimitValue, setBulkLimitValue] = useState("");

  const { data: nicheData, isLoading } = useQuery({
    queryKey: ["admin-niche-stats"],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000).toISOString();
      const fetchAll = async (filter?: { gte?: string }) => {
        const counts: Record<string, number> = {};
        let uniqueCount = 0;
        let from = 0;
        const PAGE = 1000;
        while (true) {
          let q = supabase.from("videos").select("categories", { count: "exact" }).range(from, from + PAGE - 1);
          if (filter?.gte) q = q.gte("published_at", filter.gte);
          const { data, error } = await q;
          if (error || !data || data.length === 0) break;
          uniqueCount += data.length;
          for (const v of data) {
            const cats = (v as any).categories as string[] | null;
            if (cats && cats.length > 0) {
              for (const c of cats) counts[c] = (counts[c] || 0) + 1;
            } else {
              counts["uncategorized"] = (counts["uncategorized"] || 0) + 1;
            }
          }
          if (data.length < PAGE) break;
          from += PAGE;
        }
        return { counts, uniqueCount };
      };
      const [totalRes, recentRes] = await Promise.all([fetchAll(), fetchAll({ gte: sevenDaysAgo })]);
      const allNiches = new Set([...Object.keys(totalRes.counts), ...Object.keys(recentRes.counts)]);
      const stats = [...allNiches].map((niche) => ({ niche, total: totalRes.counts[niche] || 0, recent: recentRes.counts[niche] || 0 })).sort((a, b) => b.total - a.total);
      return { stats, uniqueTotal: totalRes.uniqueCount, uniqueRecent: recentRes.uniqueCount };
    },
    refetchInterval: 5000,
  });

  const { data: savedLimits } = useQuery({
    queryKey: ["category-limits-setting"],
    queryFn: async () => {
      const { data } = await supabase.from("trend_settings").select("value").eq("key", "category_limits").maybeSingle();
      return (data?.value as Record<string, number>) || {};
    },
  });

  // Init local state from saved limits once
  if (savedLimits && !initialized) {
    setCategoryLimits(savedLimits);
    setInitialized(true);
  }

  // Merge: local overrides saved
  const effectiveLimits: Record<string, number | null> = { ...savedLimits, ...categoryLimits };

  // Filter out null/0 values before saving
  const cleanLimits = () => {
    const clean: Record<string, number> = {};
    for (const [k, v] of Object.entries(effectiveLimits)) {
      if (v && v > 0) clean[k] = v;
    }
    return clean;
  };

  const saveLimits = useMutation({
    mutationFn: async () => {
      const limits = cleanLimits();
      const { data: existing } = await supabase.from("trend_settings").select("id").eq("key", "category_limits").maybeSingle();
      if (existing) {
        await supabase.from("trend_settings").update({ value: limits as any, updated_at: new Date().toISOString() }).eq("key", "category_limits");
      } else {
        await supabase.from("trend_settings").insert({ key: "category_limits", value: limits as any });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-limits-setting"] });
      setHasChanges(false);
      toast.success("Лимиты категорий сохранены");
    },
    onError: () => toast.error("Ошибка сохранения"),
  });

  const updateLimit = (niche: string, rawVal: string) => {
    if (rawVal === "") {
      setCategoryLimits((prev) => ({ ...prev, [niche]: null }));
    } else {
      setCategoryLimits((prev) => ({ ...prev, [niche]: Number(rawVal) }));
    }
    setHasChanges(true);
  };

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mt-8" />;
  const nicheStats = nicheData?.stats || [];
  const totalAll = nicheData?.uniqueTotal || 0;
  const recentAll = nicheData?.uniqueRecent || 0;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">Статистика по категориям <Badge variant="secondary">{totalAll} всего / {recentAll} за 7 дней</Badge></CardTitle>
          {hasChanges && (
            <Button size="sm" onClick={() => saveLimits.mutate()} disabled={saveLimits.isPending} className="gap-1.5">
              {saveLimits.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Сохранить лимиты
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Bulk limit controls */}
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7"
            onClick={() => {
              const allNicheKeys = nicheStats.filter(s => s.niche !== "uncategorized").map(s => s.niche);
              if (selectedNiches.size === allNicheKeys.length) {
                setSelectedNiches(new Set());
              } else {
                setSelectedNiches(new Set(allNicheKeys));
              }
            }}
          >
            {selectedNiches.size === nicheStats.filter(s => s.niche !== "uncategorized").length && selectedNiches.size > 0 ? "Снять все" : "Выбрать все"}
          </Button>
          <span className="text-xs text-muted-foreground">
            {selectedNiches.size > 0 ? `Выбрано: ${selectedNiches.size}` : "Выберите категории"}
          </span>
          <div className="flex items-center gap-1.5 ml-auto">
            <Input
              type="number"
              className="w-20 h-7 text-xs text-center"
              placeholder="Лимит"
              value={bulkLimitValue}
              onChange={(e) => setBulkLimitValue(e.target.value)}
            />
            <Button
              size="sm"
              variant="default"
              className="h-7 text-xs gap-1"
              disabled={selectedNiches.size === 0 || !bulkLimitValue}
              onClick={() => {
                const val = Number(bulkLimitValue);
                setCategoryLimits(prev => {
                  const updated = { ...prev };
                  selectedNiches.forEach(n => { updated[n] = val || null; });
                  return updated;
                });
                setHasChanges(true);
                toast.success(`Лимит ${val || "∞"} установлен для ${selectedNiches.size} категорий`);
                setSelectedNiches(new Set());
                setBulkLimitValue("");
              }}
            >
              <Edit2 className="h-3 w-3" />Применить
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2 text-xs text-muted-foreground">
          <span className="w-6" />
          <span className="w-28">Категория</span>
          <span className="flex-1" />
          <span className="w-20 text-right">Всего</span>
          <span className="w-16 text-center">7 дней</span>
          <span className="w-20 text-center">Лимит</span>
        </div>
        <div className="space-y-1 max-h-[500px] overflow-y-auto">
          {nicheStats.filter(s => s.niche !== "uncategorized").map((s) => (
            <div key={s.niche} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-muted/30">
              <input
                type="checkbox"
                checked={selectedNiches.has(s.niche)}
                onChange={() => {
                  setSelectedNiches(prev => {
                    const next = new Set(prev);
                    if (next.has(s.niche)) next.delete(s.niche);
                    else next.add(s.niche);
                    return next;
                  });
                }}
                className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
              />
              <span className="text-sm font-medium w-28 truncate">{s.niche}</span>
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${Math.min(100, (s.total / (nicheStats[0]?.total || 1)) * 100)}%` }} />
              </div>
              <span className="text-sm text-muted-foreground w-20 text-right">{s.total}</span>
              <Badge variant={s.recent < 20 ? "destructive" : "default"} className="text-xs w-16 justify-center">{s.recent} / 7д</Badge>
              <Input
                type="number"
                className="w-20 h-7 text-xs text-center"
                placeholder="∞"
                value={effectiveLimits[s.niche] ?? ""}
                onChange={(e) => updateLimit(s.niche, e.target.value)}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground pt-2">
          Лимит — максимум видео в категории. При обновлении категория с количеством ≥ лимит будет пропущена. Пустое поле = без лимита.
        </p>
      </CardContent>
    </Card>
  );
}

function RecategorizeSection() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{ updated: number; processed: number; hasMore: boolean } | null>(null);

  // Get total video count
  const { data: totalVideos } = useQuery({
    queryKey: ["total-videos-count"],
    queryFn: async () => {
      const { count } = await supabase.from("videos").select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const startRecategorize = async () => {
    setIsRunning(true);
    setResult(null);
    
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recategorize-videos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ offset: 0, limit: 200 }),
      });

      if (!res.ok) throw new Error("Ошибка запуска");
      const data = await res.json();
      setResult({ 
        updated: data.updated || 0, 
        processed: data.processed || 0, 
        hasMore: data.hasMore || false 
      });
      
      if (data.hasMore) {
        toast.success(`🚀 Бірінші батч: ${data.updated} жаңартылды, ${data.processed} өңделді. Қалғаны серверде фонда жалғасады!`);
      } else {
        toast.success(`✅ Аяқталды: ${data.updated} видео жаңартылды`);
      }
    } catch (e: any) {
      toast.error(e.message || "Ошибка рекатегоризации");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Рекатегоризация
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            AI caption бойынша әр видеоны 1-3 категорияға бөледі. Видео дубликатталмайды — тек categories массиві кеңейеді.
          </p>

          {totalVideos !== undefined && (
            <div className="bg-muted/40 rounded-md p-3 text-sm">
              <p>📊 Жалпы видеолар: <strong>{totalVideos}</strong></p>
            </div>
          )}
          
          <Button 
            onClick={startRecategorize} 
            disabled={isRunning}
            size="lg"
            className="w-full gap-3 h-14 text-base"
          >
            {isRunning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            {isRunning ? "⏳ Рекатегоризация жүріп жатыр..." : "🔄 AI рекатегоризацияны бастау"}
          </Button>

          {result && (
            <div className="bg-muted/40 rounded-md p-3 text-sm space-y-1">
              <p>✅ Жаңартылды: <strong>{result.updated}</strong></p>
              <p>📦 Өңделді (1-ші батч): <strong>{result.processed}</strong></p>
              {result.hasMore && (
                <p className="text-primary font-medium">🔄 Қалғаны серверде фонда жалғасуда...</p>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            ⚡ Self-chaining: бетті жапсаңыз да сервер фонда барлық видеоларды автоматты өңдейді.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ==================== TARIFFS TAB ==================== */
function TariffsTab() {
  const queryClient = useQueryClient();
  const [editPlan, setEditPlan] = useState<any | null>(null);
  const [assignDialog, setAssignDialog] = useState<{ open: boolean }>({ open: false });

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=list-plans`, {
        headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      });
      if (!res.ok) throw new Error("Failed");
      return (await res.json()).plans || [];
    },
  });

  const { data: subscriptions = [], isLoading: subsLoading } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=list-subscriptions`, {
        headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      });
      if (!res.ok) throw new Error("Failed");
      return (await res.json()).subscriptions || [];
    },
  });

  const adminFetch = async (action: string, body: any) => {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=${action}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Failed");
  };

  const upsertPlan = useMutation({ mutationFn: (plan: any) => adminFetch("upsert-plan", plan), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-plans"] }); toast.success("Тариф сохранён"); setEditPlan(null); }, onError: () => toast.error("Ошибка") });
  const deletePlan = useMutation({ mutationFn: (plan_id: string) => adminFetch("delete-plan", { plan_id }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-plans"] }); toast.success("Тариф удалён"); }, onError: () => toast.error("Ошибка") });
  const assignSub = useMutation({ mutationFn: (body: any) => adminFetch("assign-subscription", body), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-subscriptions", "admin-users-list"] }); toast.success("Подписка назначена"); setAssignDialog({ open: false }); }, onError: () => toast.error("Ошибка") });
  const revokeSub = useMutation({ mutationFn: (id: string) => adminFetch("revoke-subscription", { subscription_id: id }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] }); toast.success("Подписка отозвана"); }, onError: () => toast.error("Ошибка") });

  if (plansLoading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mt-8" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2"><Crown className="h-5 w-5 text-primary" /> Тарифные планы</CardTitle>
          <Button size="sm" onClick={() => setEditPlan({ name: "", price_rub: 0, duration_days: 30, max_requests: 100, max_tracked_accounts: 5, tokens_included: 0, features: [], is_active: true, sort_order: plans.length + 1 })}><Plus className="h-4 w-4 mr-1" /> Новый тариф</Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan: any) => (
              <div key={plan.id} className={`rounded-xl border p-4 space-y-2 ${plan.is_active ? "border-border" : "border-border/30 opacity-60"}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground">{plan.name}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => setEditPlan(plan)} className="p-1 hover:text-primary"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => deletePlan.mutate(plan.id)} className="p-1 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <p className="text-xl font-bold text-foreground">{plan.price_rub === 0 ? "Тегін" : `${plan.price_rub.toLocaleString()} ₸`}</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Мерзімі: {plan.duration_days} күн</p>
                </div>
                {!plan.is_active && <Badge variant="destructive" className="text-xs">Неактивен</Badge>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Подписки пользователей</CardTitle>
          <Button size="sm" onClick={() => setAssignDialog({ open: true })}><Plus className="h-4 w-4 mr-1" /> Назначить</Button>
        </CardHeader>
        <CardContent>
          {subsLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" /> : subscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Нет подписок</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {subscriptions.map((sub: any) => (
                <div key={sub.id} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-muted/30">
                  <span className="font-medium truncate max-w-40">{sub.user_email}</span>
                  <Badge variant={sub.is_active ? "default" : "secondary"}>{sub.plans?.name || "—"}</Badge>
                  <span className="text-muted-foreground text-xs">до {new Date(sub.expires_at).toLocaleDateString("ru-RU")}</span>
                  {sub.is_active && <Badge variant={new Date(sub.expires_at) > new Date() ? "default" : "destructive"} className="text-xs">{new Date(sub.expires_at) > new Date() ? "Активна" : "Истекла"}</Badge>}
                  {sub.is_active && <Button size="sm" variant="ghost" className="ml-auto h-7 text-xs text-destructive hover:text-destructive" onClick={() => revokeSub.mutate(sub.id)}>Отозвать</Button>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editPlan && <PlanEditDialog plan={editPlan} onClose={() => setEditPlan(null)} onSave={(p) => upsertPlan.mutate(p)} saving={upsertPlan.isPending} />}
      {assignDialog.open && <AssignSubDialog plans={plans} onClose={() => setAssignDialog({ open: false })} onAssign={(data) => assignSub.mutate(data)} saving={assignSub.isPending} />}
    </div>
  );
}

function PlanEditDialog({ plan, onClose, onSave, saving }: { plan: any; onClose: () => void; onSave: (p: any) => void; saving: boolean }) {
  const [form, setForm] = useState({ ...plan, features: Array.isArray(plan.features) ? plan.features.join("\n") : "" });
  const handleSave = () => {
    onSave({
      ...(plan.id ? { id: plan.id } : {}), name: form.name, price_rub: Number(form.price_rub), duration_days: Number(form.duration_days),
      max_requests: Number(form.max_requests), max_tracked_accounts: Number(form.max_tracked_accounts),
      features: form.features.split("\n").map((f: string) => f.trim()).filter(Boolean), is_active: form.is_active, sort_order: Number(form.sort_order),
    });
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>{plan.id ? "Редактировать тариф" : "Новый тариф"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><label className="text-sm text-muted-foreground">Название</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm text-muted-foreground">Баға (₸)</label><Input type="number" value={form.price_rub} onChange={(e) => setForm({ ...form, price_rub: e.target.value })} /></div>
            <div><label className="text-sm text-muted-foreground">Мерзімі (күн)</label><Input type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm text-muted-foreground">Макс сұраулар (-1 = ∞)</label><Input type="number" value={form.max_requests} onChange={(e) => setForm({ ...form, max_requests: e.target.value })} /></div>
            <div><label className="text-sm text-muted-foreground">Макс авторлар (-1 = ∞)</label><Input type="number" value={form.max_tracked_accounts} onChange={(e) => setForm({ ...form, max_tracked_accounts: e.target.value })} /></div>
          </div>
          <div><label className="text-sm text-muted-foreground">Фичи (по одной на строку)</label><textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-20" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} /></div>
          <div className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" /><span className="text-sm">Активен</span></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSave} disabled={saving || !form.name}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Сохранить"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignSubDialog({ plans, onClose, onAssign, saving }: { plans: any[]; onClose: () => void; onAssign: (data: any) => void; saving: boolean }) {
  const [userId, setUserId] = useState("");
  const [planId, setPlanId] = useState("");
  const [days, setDays] = useState("30");
  const [note, setNote] = useState("");
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Назначить подписку</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><label className="text-sm text-muted-foreground">User ID</label><Input placeholder="UUID пользователя" value={userId} onChange={(e) => setUserId(e.target.value)} /></div>
          <div>
            <label className="text-sm text-muted-foreground">Тариф</label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger><SelectValue placeholder="Выберите тариф" /></SelectTrigger>
              <SelectContent>{plans.filter((p) => p.is_active).map((p) => (<SelectItem key={p.id} value={p.id}>{p.name} — {p.price_rub === 0 ? "Тегін" : `${p.price_rub.toLocaleString()} ₸`}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div><label className="text-sm text-muted-foreground">Срок (дней)</label><Input type="number" value={days} onChange={(e) => setDays(e.target.value)} /></div>
          <div><label className="text-sm text-muted-foreground">Примечание</label><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Необязательно" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={() => onAssign({ user_id: userId, plan_id: planId, duration_days: Number(days), note })} disabled={saving || !userId || !planId}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Назначить"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
