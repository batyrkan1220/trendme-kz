import { AppLayout } from "@/components/layout/AppLayout";
import { Progress } from "@/components/ui/progress";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  RefreshCw, Hash, BarChart3, Play, Trash2, Plus, Save, Shield, Loader2,
  Users, Activity, Video, Search, Heart, UserCircle, ScrollText,
  CreditCard, Crown, X, Edit2, Sparkles, Check, Coins, Zap, Eye, Link2, ChevronRight,
  Flag, ShieldX, AlertTriangle, MessageSquare, Download, Ban, RotateCcw, FileText,
  ChevronLeft,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { NICHE_GROUPS } from "@/config/niches";
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
            <TabsTrigger value="moderation"><Flag className="h-4 w-4 mr-1" />Модерация</TabsTrigger>
            <TabsTrigger value="trends"><RefreshCw className="h-4 w-4 mr-1" />Тренды</TabsTrigger>
            <TabsTrigger value="integrations"><Link2 className="h-4 w-4 mr-1" />Интеграции</TabsTrigger>
          </TabsList>

          <TabsContent value="platform"><PlatformTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="moderation"><ModerationTab /></TabsContent>
          <TabsContent value="trends"><TrendsManagementTab /></TabsContent>
          <TabsContent value="integrations"><IntegrationsTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

/* ==================== PLATFORM TAB ==================== */
function PlatformTab() {
  const [apiDays, setApiDays] = useState<number>(30);
  const [apiDateFrom, setApiDateFrom] = useState<Date | undefined>(undefined);
  const [apiDateTo, setApiDateTo] = useState<Date | undefined>(undefined);

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
    queryKey: ["admin-api-usage", apiDays],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=api-usage&days=${apiDays}`,
        { headers: await fetchHeaders() }
      );
      if (!res.ok) throw new Error("Failed to fetch API usage");
      return res.json();
    },
    refetchInterval: 60000,
  });

  // Filter apiUsage.byDay by date range
  const filteredApiUsage = useMemo(() => {
    if (!apiUsage) return null;
    if (!apiDateFrom && !apiDateTo) return apiUsage;

    const fromStr = apiDateFrom ? format(apiDateFrom, "yyyy-MM-dd") : "0000-00-00";
    const toStr = apiDateTo ? format(apiDateTo, "yyyy-MM-dd") : "9999-99-99";

    const filteredByDay: Record<string, Record<string, number>> = {};
    const filteredByAction: Record<string, number> = {};
    let filteredTotal = 0;
    let filteredCalls = 0;

    for (const [day, actions] of Object.entries(apiUsage.byDay || {} as Record<string, Record<string, number>>)) {
      if (day >= fromStr && day <= toStr) {
        filteredByDay[day] = actions as Record<string, number>;
        for (const [key, val] of Object.entries(actions as Record<string, number>)) {
          filteredByAction[key] = (filteredByAction[key] || 0) + val;
          filteredTotal += val;
          filteredCalls++;
        }
      }
    }

    return { byDay: filteredByDay, byAction: filteredByAction, totalCredits: filteredTotal, totalCalls: filteredCalls };
  }, [apiUsage, apiDateFrom, apiDateTo]);

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
            EnsembleData API кредиттер
          </CardTitle>
          {/* Date filters */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {[7, 14, 30, 90].map(d => (
              <Button
                key={d}
                size="sm"
                variant={apiDays === d && !apiDateFrom && !apiDateTo ? "default" : "outline"}
                className="h-7 text-xs"
                onClick={() => { setApiDays(d); setApiDateFrom(undefined); setApiDateTo(undefined); }}
              >
                {d} күн
              </Button>
            ))}
            <div className="flex items-center gap-1.5 ml-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("h-7 text-xs gap-1", !apiDateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="h-3 w-3" />
                    {apiDateFrom ? format(apiDateFrom, "dd.MM.yy") : "Бастап"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={apiDateFrom} onSelect={setApiDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              <span className="text-xs text-muted-foreground">—</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("h-7 text-xs gap-1", !apiDateTo && "text-muted-foreground")}>
                    <CalendarIcon className="h-3 w-3" />
                    {apiDateTo ? format(apiDateTo, "dd.MM.yy") : "Дейін"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={apiDateTo} onSelect={setApiDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              {(apiDateFrom || apiDateTo) && (
                <Button size="sm" variant="ghost" className="h-7 text-xs px-1.5" onClick={() => { setApiDateFrom(undefined); setApiDateTo(undefined); }}>
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredApiUsage ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Жалпы кредит</p>
                  <p className="text-2xl font-bold text-primary">{(filteredApiUsage.totalCredits || 0).toLocaleString()}</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">API шақырулар</p>
                  <p className="text-2xl font-bold text-foreground">{(filteredApiUsage.totalCalls || 0).toLocaleString()}</p>
                </div>
              </div>

              {/* By action breakdown */}
              {filteredApiUsage.byAction && Object.keys(filteredApiUsage.byAction).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Функция бойынша бөлінуі</h4>
                  {Object.entries(filteredApiUsage.byAction as Record<string, number>)
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
                      const total = filteredApiUsage.totalCredits || 1;
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
              {filteredApiUsage.byDay && Object.keys(filteredApiUsage.byDay).length > 0 && (
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
                        {Object.entries(filteredApiUsage.byDay as Record<string, Record<string, number>>)
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

              {filteredApiUsage.totalCalls === 0 && (
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

      {/* Cleanup Logs Section */}
      <CleanupLogsSection />
    </div>
  );
}

/* Plan name → tailwind classes (color-coded) */
function getPlanBadgeClass(name?: string | null): string {
  const n = (name || "").toLowerCase();
  if (n.includes("проб") || n === "trial") return "bg-muted text-muted-foreground border border-border";
  if (n.includes("1 ме") || n.includes("1 ай") || n === "monthly") return "bg-blue-500/15 text-blue-400 border border-blue-500/30";
  if (n.includes("3 ме") || n.includes("3 ай") || n === "quarterly") return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
  return "bg-secondary text-secondary-foreground border border-border";
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
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "banned" | "deleted">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "active">("newest");
  const [page, setPage] = useState(1);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "ban" | "unban" | "delete" | "restore";
    userId: string;
    email: string;
  } | null>(null);

  const PAGE_SIZE = 20;

  const adminFetch = async (path: string, init?: RequestInit) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    return fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
  };

  const { data: plans = [] } = useQuery({
    queryKey: ["admin-plans-for-users"],
    queryFn: async () => {
      const res = await adminFetch(`?action=list-plans`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()).plans || [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users-list", search],
    queryFn: async () => {
      const params = new URLSearchParams({ action: "list" });
      if (search) params.set("search", search);
      const res = await adminFetch(`?${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ user_id, role, remove }: { user_id: string; role: string; remove?: boolean }) => {
      const action = remove ? "remove-role" : "assign-role";
      const res = await adminFetch(`?action=${action}`, {
        method: "POST",
        body: JSON.stringify({ user_id, role }),
      });
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
      const res = await adminFetch(`?action=assign-subscription`, {
        method: "POST",
        body: JSON.stringify({ user_id, plan_id, duration_days, note }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      setSubDialog(null);
      setSubPlanId("");
      setSubDays("30");
      setSubNote("");
      toast.success("Тариф назначен");
    },
    onError: () => toast.error("Ошибка назначения тарифа"),
  });

  const moderationMutation = useMutation({
    mutationFn: async ({ action, user_id }: { action: "ban-user" | "unban-user" | "soft-delete-user" | "restore-user"; user_id: string }) => {
      const res = await adminFetch(`?action=${action}`, {
        method: "POST",
        body: JSON.stringify({ user_id }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-details"] });
      const labels: Record<string, string> = {
        "ban-user": "Пользователь заблокирован",
        "unban-user": "Пользователь разблокирован",
        "soft-delete-user": "Аккаунт удалён",
        "restore-user": "Аккаунт восстановлен",
      };
      toast.success(labels[vars.action]);
      setConfirmAction(null);
    },
    onError: () => {
      toast.error("Не удалось выполнить действие");
      setConfirmAction(null);
    },
  });

  const allUsers: any[] = data?.users || [];

  // Apply filters
  const filteredUsers = useMemo(() => {
    let list = allUsers.filter((u: any) => {
      // Plan filter
      if (userFilter === "unconfirmed") {
        if (u.email_confirmed_at) return false;
      } else if (userFilter === "no_plan") {
        if (u.subscription) return false;
      } else if (userFilter !== "all") {
        if (!u.email_confirmed_at) return false;
        const planName = u.subscription?.plans?.name?.toLowerCase() || "";
        if (planName !== userFilter.toLowerCase()) return false;
      }
      // Status filter
      if (statusFilter === "banned" && !u.is_banned) return false;
      if (statusFilter === "deleted" && !u.is_deleted) return false;
      if (statusFilter === "active" && (u.is_banned || u.is_deleted)) return false;
      return true;
    });

    // Sort
    list = [...list].sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      // active = last_sign_in desc
      const ta = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
      const tb = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
      return tb - ta;
    });

    return list;
  }, [allUsers, userFilter, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page when filters change
  useMemo(() => { setPage(1); }, [userFilter, statusFilter, sortBy, search]);

  // Counts
  const planCounts: Record<string, number> = {};
  const unconfirmedCount = allUsers.filter((u: any) => !u.email_confirmed_at).length;
  const noPlanCount = allUsers.filter((u: any) => !u.subscription).length;
  const bannedCount = allUsers.filter((u: any) => u.is_banned && !u.is_deleted).length;
  const deletedCount = allUsers.filter((u: any) => u.is_deleted).length;
  for (const u of allUsers) {
    if (!u.email_confirmed_at) continue;
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

  const exportCsv = () => {
    const rows = filteredUsers;
    const headers = [
      "id", "email", "name", "phone", "created_at", "last_sign_in_at",
      "email_confirmed", "plan", "plan_expires_at", "is_banned", "is_deleted",
      "free_analyses_left", "free_scripts_left", "tokens_balance", "roles", "admin_notes",
    ];
    const escape = (v: any) => {
      const s = v === null || v === undefined ? "" : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const csv = [
      headers.join(","),
      ...rows.map((u: any) => [
        u.id, u.email, u.name, u.phone, u.created_at, u.last_sign_in_at,
        u.email_confirmed_at ? "yes" : "no",
        u.subscription?.plans?.name || "",
        u.subscription?.expires_at || "",
        u.is_banned ? "yes" : "no",
        u.is_deleted ? "yes" : "no",
        u.free_analyses_left, u.free_scripts_left,
        u.tokens?.balance ?? "",
        (u.roles || []).join("|"),
        u.admin_notes || "",
      ].map(escape).join(",")),
    ].join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trendme-users-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Экспортировано: ${rows.length} пользователей`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
        <Input
          placeholder="Поиск по имени, email или телефону..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="h-9 w-[160px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Сначала новые</SelectItem>
              <SelectItem value="oldest">Сначала старые</SelectItem>
              <SelectItem value="active">По активности</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={exportCsv} className="h-9 gap-1.5">
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
        </div>
      </div>

      {/* Plan filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant={userFilter === "all" ? "default" : "outline"} onClick={() => setUserFilter("all")} className="h-8 text-xs">
          Все ({allUsers.length})
        </Button>
        {allPlanNames.map((pn) => (
          <Button key={pn} size="sm" variant={userFilter === pn ? "default" : "outline"} onClick={() => setUserFilter(pn)} className="h-8 text-xs">
            <CreditCard className="h-3 w-3 mr-1" />
            {pn} ({planCounts[pn] || 0})
          </Button>
        ))}
        <Button size="sm" variant={userFilter === "no_plan" ? "default" : "outline"} onClick={() => setUserFilter("no_plan")} className="h-8 text-xs">
          Без тарифа ({noPlanCount})
        </Button>
        <Button size="sm" variant={userFilter === "unconfirmed" ? "destructive" : "outline"} onClick={() => setUserFilter("unconfirmed")} className="h-8 text-xs">
          <Eye className="h-3 w-3 mr-1" /> Не подтв. ({unconfirmedCount})
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant={statusFilter === "all" ? "secondary" : "ghost"} onClick={() => setStatusFilter("all")} className="h-7 text-xs">
          Все статусы
        </Button>
        <Button size="sm" variant={statusFilter === "active" ? "secondary" : "ghost"} onClick={() => setStatusFilter("active")} className="h-7 text-xs">
          <Check className="h-3 w-3 mr-1" /> Активные
        </Button>
        <Button size="sm" variant={statusFilter === "banned" ? "secondary" : "ghost"} onClick={() => setStatusFilter("banned")} className="h-7 text-xs">
          <Ban className="h-3 w-3 mr-1" /> Заблок. ({bannedCount})
        </Button>
        <Button size="sm" variant={statusFilter === "deleted" ? "secondary" : "ghost"} onClick={() => setStatusFilter("deleted")} className="h-7 text-xs">
          <Trash2 className="h-3 w-3 mr-1" /> Удалённые ({deletedCount})
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
                    <th className="text-left p-3 text-muted-foreground font-medium">Имя</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Почта</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Телефон</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Регистрация</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Тариф</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Статус</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Пробные</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Роли</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedUsers.map((u: any) => {
                    const sub = u.subscription;
                    const isExpired = sub && new Date(sub.expires_at) < new Date();
                    return (
                      <tr key={u.id} className={cn("border-b border-border/50 hover:bg-muted/30", u.is_deleted && "opacity-60")}>
                        <td className="p-3">
                          <button
                            onClick={() => setDetailUserId(u.id)}
                            className="font-medium text-sm text-left hover:text-primary transition-colors"
                          >
                            {u.name || "—"}
                          </button>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{u.email}</span>
                            {!u.email_confirmed_at && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-destructive text-destructive">
                                не подтв.
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Вход: {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("ru-RU") : "—"}
                          </span>
                        </td>
                        <td className="p-3"><span className="text-sm">{u.phone || "—"}</span></td>
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
                          {u.is_deleted ? (
                            <Badge variant="destructive" className="text-xs"><Trash2 className="h-3 w-3 mr-1" /> Удалён</Badge>
                          ) : u.is_banned ? (
                            <Badge variant="destructive" className="text-xs"><Ban className="h-3 w-3 mr-1" /> Блок</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs"><Check className="h-3 w-3 mr-1" /> Актив</Badge>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-viral" />
                              <span className="text-muted-foreground">А:</span>
                              <span className={`font-bold ${(u.free_analyses_left ?? 0) === 0 ? "text-destructive" : "text-foreground"}`}>
                                {u.free_analyses_left ?? "—"}/3
                              </span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3 text-primary" />
                              <span className="text-muted-foreground">С:</span>
                              <span className={`font-bold ${(u.free_scripts_left ?? 0) === 0 ? "text-destructive" : "text-foreground"}`}>
                                {u.free_scripts_left ?? "—"}/3
                              </span>
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {u.roles.length === 0 && <span className="text-muted-foreground text-xs">user</span>}
                            {u.roles.map((r: string) => (
                              <Badge key={r} variant={r === "admin" ? "default" : "secondary"} className="gap-1 pr-1 text-xs">
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
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm" variant="ghost" className="h-7 px-2"
                              onClick={() => setDetailUserId(u.id)}
                              title="Подробнее"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <RoleAssigner
                              userId={u.id}
                              currentRoles={u.roles}
                              onAssign={(role) => roleMutation.mutate({ user_id: u.id, role })}
                              disabled={roleMutation.isPending}
                            />
                            {u.is_deleted ? (
                              <Button
                                size="sm" variant="ghost" className="h-7 px-2 text-viral"
                                onClick={() => setConfirmAction({ type: "restore", userId: u.id, email: u.email })}
                                title="Восстановить"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                            ) : (
                              <>
                                {u.is_banned ? (
                                  <Button
                                    size="sm" variant="ghost" className="h-7 px-2 text-viral"
                                    onClick={() => setConfirmAction({ type: "unban", userId: u.id, email: u.email })}
                                    title="Разблокировать"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm" variant="ghost" className="h-7 px-2 text-destructive"
                                    onClick={() => setConfirmAction({ type: "ban", userId: u.id, email: u.email })}
                                    title="Заблокировать"
                                  >
                                    <Ban className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                <Button
                                  size="sm" variant="ghost" className="h-7 px-2 text-destructive"
                                  onClick={() => setConfirmAction({ type: "delete", userId: u.id, email: u.email })}
                                  title="Удалить аккаунт"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {pagedUsers.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground text-sm">
                        Нет пользователей
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between p-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Показано {pagedUsers.length} из {filteredUsers.length} (всего {allUsers.length})
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-7 px-2">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs text-muted-foreground">{currentPage} / {totalPages}</span>
                <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-7 px-2">
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
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

      {/* Confirmation dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(o) => { if (!o) setConfirmAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "ban" && "Заблокировать пользователя?"}
              {confirmAction?.type === "unban" && "Разблокировать пользователя?"}
              {confirmAction?.type === "delete" && "Удалить аккаунт?"}
              {confirmAction?.type === "restore" && "Восстановить аккаунт?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.email}
              <br />
              {confirmAction?.type === "ban" && "Пользователь не сможет войти в аккаунт. Данные сохранятся."}
              {confirmAction?.type === "unban" && "Пользователь снова сможет пользоваться платформой."}
              {confirmAction?.type === "delete" && "Аккаунт будет помечен как удалённый. Пользователь не сможет войти. Данные сохранятся для аудита."}
              {confirmAction?.type === "restore" && "Аккаунт станет активным, пользователь снова сможет войти."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirmAction) return;
                const map = {
                  ban: "ban-user", unban: "unban-user",
                  delete: "soft-delete-user", restore: "restore-user",
                } as const;
                moderationMutation.mutate({ action: map[confirmAction.type], user_id: confirmAction.userId });
              }}
              className={confirmAction?.type === "ban" || confirmAction?.type === "delete" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {moderationMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Подтвердить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User details modal */}
      <UserDetailsDialog userId={detailUserId} onClose={() => setDetailUserId(null)} />
    </div>
  );
}

/* ==================== USER DETAILS DIALOG ==================== */
function UserDetailsDialog({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-user-details", userId],
    enabled: !!userId,
    queryFn: async () => {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=user-details&user_id=${userId}`,
        { headers: { Authorization: `Bearer ${token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
      );
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  // sync notes when data loads
  useMemo(() => {
    if (data?.profile?.admin_notes !== undefined) {
      setNotes(data.profile.admin_notes || "");
      setNotesDirty(false);
    }
  }, [data?.profile?.admin_notes]);

  const saveNotes = useMutation({
    mutationFn: async () => {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=save-notes`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: userId, notes }),
        }
      );
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      toast.success("Заметка сохранена");
      setNotesDirty(false);
      queryClient.invalidateQueries({ queryKey: ["admin-user-details", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
    },
    onError: () => toast.error("Не удалось сохранить"),
  });

  return (
    <Dialog open={!!userId} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-primary" />
            Профиль пользователя
          </DialogTitle>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base">{data.profile?.name || "Без имени"}</h3>
                <p className="text-sm text-muted-foreground truncate">{data.auth?.email}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{data.profile?.phone || "Без телефона"}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {data.profile?.is_deleted && <Badge variant="destructive" className="text-xs"><Trash2 className="h-3 w-3 mr-1" />Удалён</Badge>}
                  {data.profile?.is_banned && !data.profile?.is_deleted && <Badge variant="destructive" className="text-xs"><Ban className="h-3 w-3 mr-1" />Блок</Badge>}
                  {!data.profile?.is_banned && !data.profile?.is_deleted && <Badge variant="secondary" className="text-xs"><Check className="h-3 w-3 mr-1" />Активен</Badge>}
                  {(data.roles || []).map((r: string) => (
                    <Badge key={r} variant={r === "admin" ? "default" : "secondary"} className="text-xs">{r}</Badge>
                  ))}
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground space-y-0.5">
                <div>Регистрация: {data.auth?.created_at ? new Date(data.auth.created_at).toLocaleDateString("ru-RU") : "—"}</div>
                <div>Последний вход: {data.auth?.last_sign_in_at ? new Date(data.auth.last_sign_in_at).toLocaleString("ru-RU") : "—"}</div>
                <div>Email: {data.auth?.email_confirmed_at ? "✓ подтв." : "✗ не подтв."}</div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { label: "Анализы", value: data.counts?.analyses, icon: Sparkles },
                { label: "Сценарии", value: data.counts?.scripts, icon: Zap },
                { label: "Избранное", value: data.counts?.favorites, icon: Heart },
                { label: "Поиски", value: data.counts?.searches, icon: Search },
                { label: "Аккаунты", value: data.counts?.tracked_accounts, icon: UserCircle },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                    <Icon className="h-3 w-3" /> {label}
                  </div>
                  <div className="text-lg font-bold text-foreground">{value ?? 0}</div>
                </div>
              ))}
            </div>

            {/* Subscription history */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <CreditCard className="h-4 w-4" /> История подписок
              </h4>
              {(data.subscriptions || []).length === 0 ? (
                <p className="text-xs text-muted-foreground">Нет подписок</p>
              ) : (
                <div className="space-y-1.5">
                  {(data.subscriptions || []).map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-2 rounded border border-border text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant={s.is_active ? "default" : "outline"} className="text-[10px]">
                          {s.is_active ? "активна" : "истекла"}
                        </Badge>
                        <span className="font-medium">{s.plans?.name || "—"}</span>
                        {s.note && <span className="text-muted-foreground">· {s.note}</span>}
                      </div>
                      <span className="text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString("ru-RU")} → {new Date(s.expires_at).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity log */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Activity className="h-4 w-4" /> Последние действия
              </h4>
              {(data.activity || []).length === 0 ? (
                <p className="text-xs text-muted-foreground">Нет активности</p>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {(data.activity || []).map((a: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-muted/30">
                      <span className="text-foreground">{a.type}</span>
                      <span className="text-muted-foreground">{new Date(a.created_at).toLocaleString("ru-RU")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Admin notes */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <FileText className="h-4 w-4" /> Заметки админа
              </h4>
              <Textarea
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setNotesDirty(true); }}
                placeholder="Внутренние заметки об этом пользователе..."
                className="min-h-[80px] text-sm"
              />
              {notesDirty && (
                <Button size="sm" className="mt-2" onClick={() => saveNotes.mutate()} disabled={saveNotes.isPending}>
                  {saveNotes.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                  Сохранить
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
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

/* ==================== MODERATION TAB ==================== */
function ModerationTab() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-content-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_reports" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as any[];
    },
    refetchInterval: 30000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase.from("content_reports" as any) as any)
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-content-reports"] });
      toast.success("Статус обновлён");
    },
    onError: () => toast.error("Ошибка обновления"),
  });

  const deleteVideo = useMutation({
    mutationFn: async ({ videoId, reportId }: { videoId: string; reportId: string }) => {
      // Delete the video from DB
      const { error: delErr } = await supabase.from("videos").delete().eq("id", videoId);
      if (delErr) throw delErr;
      // Mark report as resolved
      const { error: updErr } = await (supabase.from("content_reports" as any) as any)
        .update({ status: "resolved" })
        .eq("id", reportId);
      if (updErr) throw updErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-content-reports"] });
      queryClient.invalidateQueries({ queryKey: ["trends-all"] });
      toast.success("Видео удалено и жалоба решена");
    },
    onError: () => toast.error("Ошибка удаления видео"),
  });

  const filtered = reports?.filter((r: any) => statusFilter === "all" || r.status === statusFilter) || [];

  const reasonLabels: Record<string, string> = {
    inappropriate: "🚫 Неприемлемый контент",
    spam: "📢 Спам / Реклама",
    misleading: "⚠️ Вводящий в заблуждение",
    user_blocked: "🛡️ Пользователь заблокирован",
    other: "📝 Другое",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    reviewed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    resolved: "bg-green-500/10 text-green-600 border-green-500/20",
    dismissed: "bg-muted text-muted-foreground border-border",
  };

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mt-8" />;

  const pendingCount = reports?.filter((r: any) => r.status === "pending").length || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-destructive" />
          <h2 className="text-lg font-bold">Жалобы на контент</h2>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-xs">{pendingCount} новых</Badge>
          )}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="pending">⏳ Ожидает</SelectItem>
            <SelectItem value="reviewed">👁 На рассмотрении</SelectItem>
            <SelectItem value="resolved">✅ Решено</SelectItem>
            <SelectItem value="dismissed">❌ Отклонено</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ShieldX className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Жалоб не найдено</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((report: any) => (
            <Card key={report.id} className={report.status === "pending" ? "border-yellow-500/30" : ""}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={statusColors[report.status] || ""}>
                        {report.status === "pending" && "⏳ Ожидает"}
                        {report.status === "reviewed" && "👁 На рассмотрении"}
                        {report.status === "resolved" && "✅ Решено"}
                        {report.status === "dismissed" && "❌ Отклонено"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{reasonLabels[report.reason] || report.reason}</p>
                    {report.details && (
                      <p className="text-xs text-muted-foreground">{report.details}</p>
                    )}
                    {report.author_username && (
                      <p className="text-xs text-muted-foreground">Автор: @{report.author_username}</p>
                    )}
                  </div>
                  <a
                    href={report.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs text-primary hover:underline"
                  >
                    Открыть видео ↗
                  </a>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {(report.status === "pending" || report.status === "reviewed") && (
                    <>
                      {report.status === "pending" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: report.id, status: "reviewed" })} disabled={updateStatus.isPending}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> На рассмотрение
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => {
                        if (confirm(`Удалить видео ${report.video_id} и решить жалобу?`)) {
                          deleteVideo.mutate({ videoId: report.video_id, reportId: report.id });
                        }
                      }} disabled={deleteVideo.isPending}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Удалить видео
                      </Button>
                      <Button size="sm" variant="destructive" className="bg-destructive/80" onClick={() => updateStatus.mutate({ id: report.id, status: "resolved" })} disabled={updateStatus.isPending}>
                        <Check className="h-3.5 w-3.5 mr-1" /> Решить
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: report.id, status: "dismissed" })} disabled={updateStatus.isPending}>
                        <X className="h-3.5 w-3.5 mr-1" /> Отклонить
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
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
  const [refreshLangs, setRefreshLangs] = useState<string[]>(["all"]);
  const [expandedRefreshGroup, setExpandedRefreshGroup] = useState<string | null>(null);

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
      const raw = (data?.value as Record<string, any>) || {};
      // Normalize: if value is {kk, ru, en} object, sum them; if number, use as-is
      const normalized: Record<string, number> = {};
      for (const [k, v] of Object.entries(raw)) {
        if (typeof v === "number") {
          normalized[k] = v;
        } else if (v && typeof v === "object") {
          const obj = v as Record<string, number | null>;
          const sum = (obj.kk ?? 0) + (obj.ru ?? 0) + (obj.en ?? 0);
          normalized[k] = sum > 0 ? sum : 100;
        }
      }
      return normalized;
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
          .select("sub_niche")
          .gte("published_at", sevenDaysAgo)
          .not("sub_niche", "is", null)
          .range(from, from + PAGE - 1);
        if (error || !data || data.length === 0) break;
        for (const row of data) {
          const sn = (row as any).sub_niche as string | null;
          if (sn) counts[sn] = (counts[sn] || 0) + 1;
        }
        if (data.length < PAGE) break;
        from += PAGE;
      }
      return counts;
    },
    refetchInterval: 10000,
  });

  // Build sub-niche label map
  const subNicheLabels: Record<string, string> = {};
  for (const g of NICHE_GROUPS) for (const s of g.subNiches) subNicheLabels[s.key] = s.label;
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

  const toggleRefreshLang = (key: string) => {
    if (key === "all") {
      setRefreshLangs(["all"]);
      return;
    }
    setRefreshLangs(prev => {
      const without = prev.filter(l => l !== "all");
      if (without.includes(key)) {
        const next = without.filter(l => l !== key);
        return next.length === 0 ? ["all"] : next;
      }
      return [...without, key];
    });
  };

  const triggerRefresh = async () => {
    const niches = selectAll ? null : selectedNiches;
    if (!selectAll && selectedNiches.length === 0) {
      toast.error("Выберите хотя бы одну категорию");
      return;
    }
    const langLabels: Record<string, string> = { all: "все языки", kk: "🇰🇿 қазақша", ru: "🇷🇺 русский", en: "🇬🇧 English" };
    const label = selectAll ? "все категории" : `${selectedNiches.length} категорий`;
    const langLabel = refreshLangs.includes("all") ? langLabels.all : refreshLangs.map(l => langLabels[l] || l).join(", ");
    toast.info(`Обновление запущено: ${label}, ${langLabel}`);

    const langsToRun = refreshLangs.includes("all") ? [null] : [...refreshLangs];
    // Fire sequentially with delay to avoid superseding each other's logs
    const fireNext = async (idx: number) => {
      if (idx >= langsToRun.length) return;
      const lang = langsToRun[idx];
      try {
        await supabase.functions.invoke("refresh-trends", { 
          body: { 
            mode: "mass", 
            ...(niches ? { target_niches: niches } : {}),
            ...(lang ? { lang } : {}),
          } 
        });
      } catch { /* ignore */ }
      queryClient.invalidateQueries({ queryKey: ["refresh-logs"] });
      // Wait 3s before firing next language to let first run create its log
      if (idx + 1 < langsToRun.length) {
        setTimeout(() => fireNext(idx + 1), 3000);
      }
    };
    fireNext(0);
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
                  {selectedNiches.length > 0 && (
                    <Badge variant="secondary" className="text-xs">{selectedNiches.length} выбрано</Badge>
                  )}
                </div>
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {NICHE_GROUPS.map((group) => {
                    const groupSubKeys = group.subNiches.map(s => s.key).filter(k => allNiches.includes(k));
                    if (groupSubKeys.length === 0) return null;
                    const isExpanded = expandedRefreshGroup === group.key;
                    const selectedInGroup = groupSubKeys.filter(k => selectedNiches.includes(k)).length;
                    const allInGroupSelected = selectedInGroup === groupSubKeys.length;
                    const someInGroupSelected = selectedInGroup > 0 && !allInGroupSelected;
                    const groupVideoCount = groupSubKeys.reduce((sum, k) => sum + (videoCounts[k] || 0), 0);
                    const groupLimit = groupSubKeys.reduce((sum, k) => sum + (categoryLimits[k] || 100), 0);

                    return (
                      <div key={group.key} className="border border-border/50 rounded-lg overflow-hidden">
                        <div className="flex items-center">
                          <button
                            onClick={() => setExpandedRefreshGroup(isExpanded ? null : group.key)}
                            className="flex-1 flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition-colors text-sm"
                          >
                            <ChevronRight className={`h-4 w-4 transition-transform shrink-0 ${isExpanded ? "rotate-90" : ""}`} />
                            <span className="text-base">{group.emoji}</span>
                            <span className="font-semibold">{group.label}</span>
                            <span className="text-[10px] text-muted-foreground ml-auto mr-2">
                              {groupVideoCount}/{groupLimit}
                            </span>
                            {someInGroupSelected && <Badge variant="secondary" className="text-[10px] px-1.5">{selectedInGroup}/{groupSubKeys.length}</Badge>}
                            {allInGroupSelected && <Badge className="text-[10px] px-1.5 bg-primary text-primary-foreground">✓ все</Badge>}
                          </button>
                          <button
                            onClick={() => {
                              if (allInGroupSelected) {
                                setSelectedNiches(prev => prev.filter(n => !groupSubKeys.includes(n)));
                              } else {
                                setSelectedNiches(prev => [...new Set([...prev, ...groupSubKeys])]);
                              }
                            }}
                            className={`px-3 py-2 text-xs font-medium border-l border-border/50 hover:bg-muted/30 transition-colors ${
                              allInGroupSelected ? "text-primary" : "text-muted-foreground"
                            }`}
                          >
                            {allInGroupSelected ? "Убрать" : "Все"}
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="px-3 pb-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {group.subNiches.map((sub) => {
                              if (!allNiches.includes(sub.key)) return null;
                              const count = videoCounts[sub.key] || 0;
                              const limit = categoryLimits[sub.key] || 100;
                              const isFull = count >= limit;
                              const isSelected = selectedNiches.includes(sub.key);
                              return (
                                <button
                                  key={sub.key}
                                  onClick={() => toggleNiche(sub.key)}
                                  className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs border transition-colors ${
                                    isSelected
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : isFull
                                        ? "bg-muted/30 border-border/50 text-muted-foreground"
                                        : "bg-background border-border hover:border-primary/50"
                                  }`}
                                >
                                  <span className="font-medium truncate">{sub.label}</span>
                                  <span className={`ml-1 text-[10px] ${isFull ? "text-primary" : ""}`}>
                                    {count}/{limit}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Language selector */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Тіл / Язык запросов:</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { key: "all", label: "🌐 Все языки" },
                { key: "kk", label: "🇰🇿 Қазақша" },
                { key: "ru", label: "🇷🇺 Русский" },
                { key: "en", label: "🇬🇧 English" },
              ].map(l => (
                <Button
                  key={l.key}
                  variant={refreshLangs.includes(l.key) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleRefreshLang(l.key)}
                >
                  {l.label}
                </Button>
              ))}
            </div>
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
                ? `🚀 Запустить (все категории, ${refreshLangs.includes("all") ? "все языки" : refreshLangs.map(l => l.toUpperCase()).join("+")})`
                : `🚀 Запустить (${selectedNiches.length} категорий, ${refreshLangs.includes("all") ? "все языки" : refreshLangs.map(l => l.toUpperCase()).join("+")})`
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
                .filter(([key]) => key !== "_rotation" && key !== "_lang")
                .filter(([, val]) => typeof val === "number" || (typeof val === "object" && val !== null))
                .sort(([, a], [, b]) => {
                  const aVal = typeof a === "number" ? a : (a?.saved || 0);
                  const bVal = typeof b === "number" ? b : (b?.saved || 0);
                  return bVal - aVal;
                });
              const totalNiche = log.total_saved || 0;
              const totalGeneral = log.general_saved || 0;
              const grandTotal = totalNiche + totalGeneral;

              // Calculate AI totals
              let totalAccepted = 0, totalReassigned = 0, totalDiscarded = 0;
              for (const [, val] of nicheEntries) {
                if (typeof val === "object" && val !== null) {
                  totalAccepted += val.accepted || 0;
                  totalReassigned += val.reassigned || 0;
                  totalDiscarded += val.discarded || 0;
                }
              }
              const hasAiStats = totalAccepted > 0 || totalReassigned > 0 || totalDiscarded > 0;


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

                  <div className={`grid ${hasAiStats ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-3"} gap-2 text-center`}>
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
                    {hasAiStats && (
                      <>
                        <div className="bg-emerald-500/10 rounded-md p-2">
                          <p className="text-lg font-bold text-emerald-500">✅ {totalAccepted}</p>
                          <p className="text-xs text-muted-foreground">Accepted</p>
                        </div>
                        <div className="bg-blue-500/10 rounded-md p-2">
                          <p className="text-lg font-bold text-blue-500">♻️ {totalReassigned}</p>
                          <p className="text-xs text-muted-foreground">Reassigned</p>
                        </div>
                        <div className="bg-red-500/10 rounded-md p-2">
                          <p className="text-lg font-bold text-red-500">🗑️ {totalDiscarded}</p>
                          <p className="text-xs text-muted-foreground">Discarded</p>
                        </div>
                      </>
                    )}
                  </div>

                  {nicheEntries.length > 0 && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors text-xs font-medium">
                        📊 По категориям ({nicheEntries.length})
                      </summary>
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                        {nicheEntries.map(([niche, val]) => {
                          const total7d = videoCounts[niche] || 0;
                          const isObj = typeof val === "object" && val !== null;
                          const saved = isObj ? (val.saved || 0) : (val as number);
                          const accepted = isObj ? (val.accepted || 0) : null;
                          const reassigned = isObj ? (val.reassigned || 0) : null;
                          const discarded = isObj ? (val.discarded || 0) : null;
                          return (
                            <div key={niche} className="flex flex-col bg-muted/30 rounded px-2 py-1 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="truncate font-medium">{niche}</span>
                                <span className="ml-1 flex items-center gap-1 shrink-0">
                                  <Badge variant={saved > 0 ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                                    +{saved}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground">/ {total7d}</span>
                                </span>
                              </div>
                              {isObj && (accepted !== null) && (
                                <div className="flex gap-2 mt-0.5 text-[10px] text-muted-foreground">
                                  <span className="text-emerald-500">✅{accepted}</span>
                                  {reassigned! > 0 && <span className="text-blue-500">♻️{reassigned}</span>}
                                  {discarded! > 0 && <span className="text-red-500">🗑️{discarded}</span>}
                                </div>
                              )}
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

type LangQueries = { kk: string[]; ru: string[]; en: string[] };
type NicheQueriesMap = Record<string, LangQueries>;
const LANG_TABS = [
  { key: "kk" as const, label: "🇰🇿 Қазақша", color: "text-emerald-600" },
  { key: "ru" as const, label: "🇷🇺 Русский", color: "text-blue-600" },
  { key: "en" as const, label: "🇬🇧 English", color: "text-red-600" },
] as const;

function KeywordsSection() {
  const queryClient = useQueryClient();
  const [selectedSubNiche, setSelectedSubNiche] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<"kk" | "ru" | "en">("kk");
  const [newQuery, setNewQuery] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const { data: nicheQueries = {} as NicheQueriesMap, isLoading } = useQuery({
    queryKey: ["trend-settings", "niche_queries"],
    queryFn: async () => {
      const { data } = await supabase.from("trend_settings").select("value").eq("key", "niche_queries").single();
      return (data?.value as NicheQueriesMap) || {};
    },
  });

  const getLangQueries = (key: string): LangQueries => {
    const val = nicheQueries[key];
    if (!val) return { kk: [], ru: [], en: [] };
    // Backward compat: if old flat array format
    if (Array.isArray(val)) return { kk: [], ru: val as any, en: [] };
    return { kk: val.kk || [], ru: val.ru || [], en: val.en || [] };
  };

  const saveMutation = useMutation({
    mutationFn: async (updated: NicheQueriesMap) => {
      const { error } = await supabase.from("trend_settings").update({ value: updated as any, updated_at: new Date().toISOString() }).eq("key", "niche_queries");
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["trend-settings"] }); toast.success("Запросы сохранены"); },
    onError: () => toast.error("Ошибка сохранения"),
  });

  const addQuery = () => {
    if (!newQuery.trim() || !selectedSubNiche) return;
    const updated = { ...nicheQueries };
    const current = getLangQueries(selectedSubNiche);
    current[activeLang] = [...current[activeLang], newQuery.trim()];
    updated[selectedSubNiche] = current;
    saveMutation.mutate(updated);
    setNewQuery("");
  };

  const removeQuery = (index: number) => {
    if (!selectedSubNiche) return;
    const updated = { ...nicheQueries };
    const current = getLangQueries(selectedSubNiche);
    current[activeLang] = current[activeLang].filter((_, i) => i !== index);
    updated[selectedSubNiche] = current;
    saveMutation.mutate(updated);
  };

  const generateWithAI = async (seedWord?: string) => {
    if (!selectedSubNiche) return;
    setAiLoading(true);
    setAiSuggestions([]);
    try {
      const current = getLangQueries(selectedSubNiche);
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-keywords`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          niche: selectedSubNiche,
          lang: activeLang,
          existing_queries: current[activeLang],
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
    if (!word || !selectedSubNiche) {
      toast.error("Введите ключевое слово");
      return;
    }
    generateWithAI(word);
    setNewQuery("");
  };

  const acceptSuggestion = (keyword: string) => {
    if (!selectedSubNiche) return;
    const updated = { ...nicheQueries };
    const current = getLangQueries(selectedSubNiche);
    current[activeLang] = [...current[activeLang], keyword];
    updated[selectedSubNiche] = current;
    saveMutation.mutate(updated);
    setAiSuggestions((prev) => prev.filter((k) => k !== keyword));
  };

  const acceptAllSuggestions = () => {
    if (!selectedSubNiche || aiSuggestions.length === 0) return;
    const updated = { ...nicheQueries };
    const current = getLangQueries(selectedSubNiche);
    current[activeLang] = [...current[activeLang], ...aiSuggestions];
    updated[selectedSubNiche] = current;
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
      const total = Object.values(stats).reduce((a: number, b: any) => a + (typeof b === "number" ? b : 0), 0);
      toast.success(`Обновлено ${Object.keys(stats).length} категорий, всего ${total} запросов`);
      queryClient.invalidateQueries({ queryKey: ["trend-settings"] });
    } catch (e: any) {
      toast.error(e.message || "Ошибка");
    } finally {
      setBulkLoading(false);
    }
  };

  const selectedSubNicheLabel = selectedSubNiche
    ? NICHE_GROUPS.flatMap(g => g.subNiches).find(s => s.key === selectedSubNiche)?.label || selectedSubNiche
    : "";

  const activeQueries = selectedSubNiche ? getLangQueries(selectedSubNiche)[activeLang] : [];

  // Count total queries per group (all langs)
  const groupQueryCount = (group: typeof NICHE_GROUPS[0]) =>
    group.subNiches.reduce((sum, sub) => {
      const q = getLangQueries(sub.key);
      return sum + q.kk.length + q.ru.length + q.en.length;
    }, 0);

  // Count total for a sub-niche (all langs)
  const subNicheCount = (key: string) => {
    const q = getLangQueries(key);
    return q.kk.length + q.ru.length + q.en.length;
  };

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mt-8" />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button onClick={bulkRegenerate} disabled={bulkLoading} variant="outline" className="gap-2">
          {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {bulkLoading ? "Генерация..." : "🔄 Обновить все запросы (AI)"}
        </Button>
      </div>

      {/* Niche groups with expandable sub-niches */}
      <div className="space-y-1">
        {NICHE_GROUPS.map((group) => {
          const isExpanded = expandedGroup === group.key;
          const totalQ = groupQueryCount(group);
          return (
            <div key={group.key} className="border border-border/50 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedGroup(isExpanded ? null : group.key)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/30 transition-colors text-sm"
              >
                <span className="flex items-center gap-2 font-medium">
                  <span>{group.emoji}</span>
                  <span>{group.label}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5">{totalQ}</Badge>
                </span>
                <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
              </button>
              {isExpanded && (
                <div className="px-3 pb-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {group.subNiches.map((sub) => {
                    const count = subNicheCount(sub.key);
                    const q = getLangQueries(sub.key);
                    const isActive = selectedSubNiche === sub.key;
                    return (
                      <button
                        key={sub.key}
                        onClick={() => { setSelectedSubNiche(isActive ? null : sub.key); setAiSuggestions([]); }}
                        className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs border transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground border-primary"
                            : count === 0
                              ? "bg-destructive/10 border-destructive/30 text-destructive"
                              : "bg-background border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="font-medium truncate">{sub.label}</span>
                        <span className="ml-1 text-[10px] flex gap-0.5">
                          <span title="KK">{q.kk.length}</span>/<span title="RU">{q.ru.length}</span>/<span title="EN">{q.en.length}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedSubNiche && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg">Запросы: <span className="text-primary">{selectedSubNicheLabel}</span></CardTitle>
              <Button onClick={() => generateWithAI()} disabled={aiLoading} size="sm" variant="outline" className="gap-1.5">
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                AI запросы
              </Button>
            </div>
            {/* Language tabs */}
            <div className="flex gap-1 mt-2">
              {LANG_TABS.map(({ key, label, color }) => {
                const count = getLangQueries(selectedSubNiche)[key].length;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveLang(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      activeLang === key
                        ? "gradient-hero text-primary-foreground border-transparent"
                        : "bg-card border-border/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label} <span className="ml-1">({count})</span>
                  </button>
                );
              })}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder={
                  activeLang === "kk" ? "Қазақша сөз енгізіңіз..."
                    : activeLang === "en" ? "Enter English keyword..."
                    : "Введите слово..."
                }
                value={newQuery}
                onChange={(e) => setNewQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addQuery()}
              />
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
              {activeQueries.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {activeLang === "kk" ? "Қазақша запростар жоқ. Қолмен немесе AI арқылы қосыңыз." 
                   : activeLang === "en" ? "No English queries. Add manually or via AI."
                   : "Запросов нет. Добавьте вручную или через AI."}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}




type LangLimits = { kk: number | null; ru: number | null; en: number | null };

function StatsSection() {
  const queryClient = useQueryClient();
  const [categoryLimits, setCategoryLimits] = useState<Record<string, LangLimits>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [selectedNiches, setSelectedNiches] = useState<Set<string>>(new Set());
  const [bulkLimitKk, setBulkLimitKk] = useState("");
  const [bulkLimitRu, setBulkLimitRu] = useState("");
  const [bulkLimitEn, setBulkLimitEn] = useState("");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const { data: subNicheCounts = {}, isLoading } = useQuery({
    queryKey: ["admin-subniche-stats"],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000).toISOString();
      const counts: Record<string, number> = {};
      let from = 0;
      const PAGE = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("videos")
          .select("sub_niche")
          .gte("published_at", sevenDaysAgo)
          .range(from, from + PAGE - 1);
        if (error || !data || data.length === 0) break;
        for (const v of data) {
          const sn = (v as any).sub_niche;
          if (sn) counts[sn] = (counts[sn] || 0) + 1;
        }
        if (data.length < PAGE) break;
        from += PAGE;
      }
      return counts;
    },
    refetchInterval: 10000,
  });

  const { data: savedLimits } = useQuery({
    queryKey: ["category-limits-setting"],
    queryFn: async () => {
      const { data } = await supabase.from("trend_settings").select("value").eq("key", "category_limits").maybeSingle();
      return (data?.value as Record<string, any>) || {};
    },
  });

  const { data: nicheQueries = {} } = useQuery({
    queryKey: ["niche-queries-for-stats"],
    queryFn: async () => {
      const { data } = await supabase.from("trend_settings").select("value").eq("key", "niche_queries").single();
      return (data?.value as Record<string, any>) || {};
    },
  });

  if (savedLimits && !initialized) {
    const parsed: Record<string, LangLimits> = {};
    for (const [k, v] of Object.entries(savedLimits)) {
      if (typeof v === "number") {
        parsed[k] = { kk: v, ru: v, en: v };
      } else if (v && typeof v === "object") {
        parsed[k] = { kk: (v as any).kk ?? null, ru: (v as any).ru ?? null, en: (v as any).en ?? null };
      }
    }
    setCategoryLimits(parsed);
    setInitialized(true);
  }

  const getLimit = (subKey: string, lang: "kk" | "ru" | "en"): number | null => {
    return categoryLimits[subKey]?.[lang] ?? null;
  };

  const cleanLimits = () => {
    const clean: Record<string, LangLimits> = {};
    for (const [k, v] of Object.entries(categoryLimits)) {
      if (v && (v.kk != null || v.ru != null || v.en != null)) {
        clean[k] = { kk: v.kk ?? null, ru: v.ru ?? null, en: v.en ?? null };
      }
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
      toast.success("Лимиттер сақталды");
    },
    onError: () => toast.error("Қате болды"),
  });

  const updateLangLimit = (subKey: string, lang: "kk" | "ru" | "en", rawVal: string) => {
    setCategoryLimits(prev => {
      const existing = prev[subKey] || { kk: null, ru: null, en: null };
      return { ...prev, [subKey]: { ...existing, [lang]: rawVal === "" ? null : Number(rawVal) } };
    });
    setHasChanges(true);
  };

  const totalVideos7d = Object.values(subNicheCounts).reduce((a, b) => a + b, 0);
  const allSubNicheKeys = NICHE_GROUPS.flatMap(g => g.subNiches.map(s => s.key));

  const getLangCounts = (subKey: string) => {
    const q = nicheQueries[subKey];
    if (!q || Array.isArray(q)) return { kk: 0, ru: 0, en: 0 };
    return { kk: (q.kk || []).length, ru: (q.ru || []).length, en: (q.en || []).length };
  };

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mt-8" />;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            Нишалар статистикасы
            <Badge variant="secondary">{totalVideos7d} видео / 7 күн</Badge>
          </CardTitle>
          {hasChanges && (
            <Button size="sm" onClick={() => saveLimits.mutate()} disabled={saveLimits.isPending} className="gap-1.5">
              {saveLimits.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Сақтау
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
              if (selectedNiches.size === allSubNicheKeys.length) setSelectedNiches(new Set());
              else setSelectedNiches(new Set(allSubNicheKeys));
            }}
          >
            {selectedNiches.size === allSubNicheKeys.length && selectedNiches.size > 0 ? "Бәрін алу" : "Бәрін таңдау"}
          </Button>
          <span className="text-xs text-muted-foreground">
            {selectedNiches.size > 0 ? `Таңдалды: ${selectedNiches.size}` : "Под-ниша таңдаңыз"}
          </span>
          <div className="flex items-center gap-1 ml-auto flex-wrap">
            <Input type="number" className="w-14 h-7 text-xs text-center" placeholder="KK" value={bulkLimitKk} onChange={(e) => setBulkLimitKk(e.target.value)} />
            <Input type="number" className="w-14 h-7 text-xs text-center" placeholder="RU" value={bulkLimitRu} onChange={(e) => setBulkLimitRu(e.target.value)} />
            <Input type="number" className="w-14 h-7 text-xs text-center" placeholder="EN" value={bulkLimitEn} onChange={(e) => setBulkLimitEn(e.target.value)} />
            <Button
              size="sm"
              variant="default"
              className="h-7 text-xs gap-1"
              disabled={selectedNiches.size === 0 || (!bulkLimitKk && !bulkLimitRu && !bulkLimitEn)}
              onClick={() => {
                setCategoryLimits(prev => {
                  const updated = { ...prev };
                  selectedNiches.forEach(n => {
                    updated[n] = {
                      kk: bulkLimitKk ? Number(bulkLimitKk) : null,
                      ru: bulkLimitRu ? Number(bulkLimitRu) : null,
                      en: bulkLimitEn ? Number(bulkLimitEn) : null,
                    };
                  });
                  return updated;
                });
                setHasChanges(true);
                toast.success(`Лимиттер ${selectedNiches.size} под-нишаға орнатылды`);
                setSelectedNiches(new Set());
                setBulkLimitKk(""); setBulkLimitRu(""); setBulkLimitEn("");
              }}
            >
              <Edit2 className="h-3 w-3" />Қолдану
            </Button>
          </div>
        </div>

        {/* Hierarchical niche list */}
        <div className="space-y-1 max-h-[600px] overflow-y-auto">
          {NICHE_GROUPS.map((group) => {
            const isExpanded = expandedGroup === group.key;
            const groupVideoCount = group.subNiches.reduce((sum, s) => sum + (subNicheCounts[s.key] || 0), 0);

            return (
              <div key={group.key}>
                <button
                  onClick={() => setExpandedGroup(isExpanded ? null : group.key)}
                  className="w-full flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  <span className="text-base">{group.emoji}</span>
                  <span className="font-semibold text-sm text-foreground">{group.label}</span>
                  <Badge variant="secondary" className="text-xs ml-auto">{groupVideoCount} / 7д</Badge>
                  <Badge variant="outline" className="text-xs">{group.subNiches.length}</Badge>
                </button>

                {isExpanded && (
                  <div className="ml-4 space-y-0.5 pb-2">
                    <div className="flex items-center gap-1 px-2 py-1 text-[10px] text-muted-foreground uppercase tracking-wider">
                      <span className="w-5" />
                      <span className="flex-1">Под-ниша</span>
                      <span className="w-10 text-center">7д</span>
                      <span className="w-7 text-center">KK</span>
                      <span className="w-7 text-center">RU</span>
                      <span className="w-7 text-center">EN</span>
                      <span className="w-[132px] text-center">Лимит KK / RU / EN</span>
                    </div>
                    {group.subNiches.map((sub) => {
                      const count7d = subNicheCounts[sub.key] || 0;
                      const langCounts = getLangCounts(sub.key);
                      const isChecked = selectedNiches.has(sub.key);
                      const limKk = getLimit(sub.key, "kk");
                      const limRu = getLimit(sub.key, "ru");
                      const limEn = getLimit(sub.key, "en");

                      return (
                        <div key={sub.key} className="flex items-center gap-1 py-1 px-2 rounded hover:bg-muted/30">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedNiches(prev => {
                                const next = new Set(prev);
                                if (next.has(sub.key)) next.delete(sub.key);
                                else next.add(sub.key);
                                return next;
                              });
                            }}
                            className="w-3.5 h-3.5 rounded border-border accent-primary cursor-pointer"
                          />
                          <span className="flex-1 text-xs font-medium truncate">{sub.label}</span>
                          <Badge
                            variant={count7d === 0 ? "destructive" : "secondary"}
                            className="text-[10px] w-10 justify-center"
                          >
                            {count7d}
                          </Badge>
                          <span className={`text-[10px] w-7 text-center ${langCounts.kk === 0 ? "text-destructive" : "text-muted-foreground"}`}>{langCounts.kk}</span>
                          <span className={`text-[10px] w-7 text-center ${langCounts.ru === 0 ? "text-destructive" : "text-muted-foreground"}`}>{langCounts.ru}</span>
                          <span className={`text-[10px] w-7 text-center ${langCounts.en === 0 ? "text-destructive" : "text-muted-foreground"}`}>{langCounts.en}</span>
                          <div className="flex gap-0.5 w-[132px]">
                            <Input type="number" className="w-11 h-6 text-[10px] text-center px-1" placeholder="KK" value={limKk ?? ""} onChange={(e) => updateLangLimit(sub.key, "kk", e.target.value)} />
                            <Input type="number" className="w-11 h-6 text-[10px] text-center px-1" placeholder="RU" value={limRu ?? ""} onChange={(e) => updateLangLimit(sub.key, "ru", e.target.value)} />
                            <Input type="number" className="w-11 h-6 text-[10px] text-center px-1" placeholder="EN" value={limEn ?? ""} onChange={(e) => updateLangLimit(sub.key, "en", e.target.value)} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground pt-2">
          Лимиттер тіл бойынша жеке. Refresh кезінде таңдалған тілдің лимиті тексеріледі. KK/RU/EN — запрос саны. Бос = шексіз.
        </p>
      </CardContent>
    </Card>
  );
}


function RecategorizeSection() {
  const queryClient = useQueryClient();
  const [isStarting, setIsStarting] = useState(false);

  const { data: totalVideos } = useQuery({
    queryKey: ["total-videos-count"],
    queryFn: async () => {
      const { count } = await supabase.from("videos").select("id", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["recat-logs"],
    queryFn: async () => {
      const { data } = await supabase.from("recat_logs").select("*").order("started_at", { ascending: false }).limit(10);
      return data || [];
    },
    refetchInterval: 3000,
  });

  const isRunning = logs.some((l: any) => l.status === "running");
  const runningLog = logs.find((l: any) => l.status === "running");

  // Reset isStarting when server confirms running
  if (isRunning && isStarting) setIsStarting(false);

  const startRecategorize = async () => {
    if (isStarting || isRunning) return;
    setIsStarting(true);
    toast.info("🔄 Рекатегоризация іске қосылды...");
    try {
      const session = (await supabase.auth.getSession()).data.session;
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recategorize-videos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ offset: 0, limit: 200 }),
      });
      queryClient.invalidateQueries({ queryKey: ["recat-logs"] });
    } catch (e: any) {
      toast.error(e.message || "Ошибка");
      setIsStarting(false);
    }
    setTimeout(() => queryClient.invalidateQueries({ queryKey: ["recat-logs"] }), 2000);
  };

  const stopRecategorize = async () => {
    if (!runningLog) return;
    const { error } = await supabase.from("recat_logs").update({
      status: "stopped",
      error_message: "Остановлено вручную администратором",
      finished_at: new Date().toISOString(),
    }).eq("id", runningLog.id);
    if (error) { toast.error("Не удалось остановить"); return; }
    toast.success("Рекатегоризация остановлена");
    queryClient.invalidateQueries({ queryKey: ["recat-logs"] });
  };

  const progressPercent = runningLog && runningLog.total_videos > 0
    ? Math.round((runningLog.total_processed / runningLog.total_videos) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Рекатегоризация (Нишалар)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            AI caption бойынша әр видеоны жаңа ниша → под-ниша жүйесіне бөледі. 3 тілді (KK/RU/EN) автоматты анықтайды.
          </p>

          <div className="bg-muted/40 rounded-md p-3 text-sm space-y-1">
            {totalVideos !== undefined && (
              <p>📊 Жалпы видеолар: <strong>{totalVideos}</strong></p>
            )}
            <p className="text-xs text-muted-foreground">
              🏷️ 23 ниша, 100+ под-ниша | 🌐 3 тіл: 🇰🇿 KK, 🇷🇺 RU, 🇬🇧 EN
            </p>
          </div>

          <Button
            onClick={startRecategorize}
            disabled={isRunning || isStarting}
            size="lg"
            className="w-full gap-3 h-14 text-base"
          >
            {(isRunning || isStarting) ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            {(isRunning || isStarting) ? "⏳ Рекатегоризация жүріп жатыр..." : "🔄 AI рекатегоризацияны бастау"}
          </Button>

          {isRunning && runningLog && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Серверде жұмыс жасауда...</span>
                </div>
                <Button variant="destructive" size="sm" className="gap-1.5 shrink-0" onClick={stopRecategorize}>
                  <X className="h-4 w-4" />Тоқтату
                </Button>
              </div>
              <div className="bg-muted/40 rounded-md p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Прогресс</span>
                  <span className="font-bold">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>Өңделді: <span className="font-semibold text-foreground">{runningLog.total_processed}</span></div>
                  <div>Жаңартылды: <span className="font-semibold text-foreground">{runningLog.total_updated}</span></div>
                  <div>Өзгерген жоқ: <span className="font-semibold text-foreground">{runningLog.total_unchanged}</span></div>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            ⚡ Self-chaining: бетті жапсаңыз да сервер фонда барлық видеоларды автоматты өңдейді.
          </p>
        </CardContent>
      </Card>

      {/* Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ScrollText className="h-5 w-5" /> Журнал рекатегоризации
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
            {logs.map((log: any) => {
              const startedAt = new Date(log.started_at);
              const finishedAt = log.finished_at ? new Date(log.finished_at) : null;
              const durationMs = finishedAt ? finishedAt.getTime() - startedAt.getTime() : null;
              const durationStr = durationMs != null
                ? durationMs < 60000
                  ? `${Math.round(durationMs / 1000)}с`
                  : `${Math.floor(durationMs / 60000)}м ${Math.round((durationMs % 60000) / 1000)}с`
                : "—";

              return (
                <div key={log.id} className="bg-muted/30 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {log.status === "running" && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                      {log.status === "done" && <span className="text-primary">✅</span>}
                      {log.status === "stopped" && <span className="text-destructive">⛔</span>}
                      {log.status === "error" && <span className="text-destructive">❌</span>}
                      <span className="text-xs text-muted-foreground">
                        {startedAt.toLocaleString("ru-RU")}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">⏱ {durationStr}</span>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span>Өңделді: <strong>{log.total_processed}</strong></span>
                    <span>Жаңартылды: <strong>{log.total_updated}</strong></span>
                    <span>Өзгерген жоқ: <strong>{log.total_unchanged}</strong></span>
                  </div>
                  {log.error_message && (
                    <p className="text-xs text-destructive">{log.error_message}</p>
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

/* ==================== TARIFFS TAB ==================== */
// Tariffs management UI removed — subscriptions are assigned via UsersTab.


/* ==================== CLEANUP LOGS SECTION ==================== */
function CleanupLogsSection() {
  const queryClient = useQueryClient();

  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-cleanup-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cleanup_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });

  // Aggregate by day
  const dailyStats = useMemo(() => {
    if (!logs) return [];
    const byDay: Record<string, { checked: number; broken: number; deleted: number; client: number; server: number }> = {};
    for (const log of logs) {
      const day = new Date(log.created_at).toISOString().slice(0, 10);
      if (!byDay[day]) byDay[day] = { checked: 0, broken: 0, deleted: 0, client: 0, server: 0 };
      byDay[day].checked += log.checked;
      byDay[day].broken += log.broken;
      byDay[day].deleted += log.deleted;
      if (log.source === "client_browser") byDay[day].client += log.deleted;
      else byDay[day].server += log.deleted;
    }
    return Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0]));
  }, [logs]);

  const totalDeleted = logs?.reduce((sum, l) => sum + l.deleted, 0) || 0;

  const [isRunning, setIsRunning] = useState(false);
  const runManualCheck = async () => {
    setIsRunning(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-broken-covers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ batch_size: 200 }),
        }
      );
      const result = await res.json();
      toast.success(`Проверено: ${result.checked}, сломано: ${result.broken}, удалено: ${result.deleted}`);
      queryClient.invalidateQueries({ queryKey: ["admin-cleanup-logs"] });
    } catch (err) {
      toast.error("Ошибка проверки: " + String(err));
    } finally {
      setIsRunning(false);
    }
  };

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mt-4" />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Очистка сломанных обложек
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm font-bold">
              Всего удалено: {totalDeleted}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={runManualCheck}
              disabled={isRunning}
            >
              {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Play className="h-3.5 w-3.5 mr-1.5" />}
              Проверить сейчас
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Сервер (cron каждые 6ч) + Браузер (при просмотре пользователем)
        </p>
      </CardHeader>
      <CardContent>
        {dailyStats.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Нет данных об очистке</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">День</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">Проверено</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">Сломано</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">🖥 Сервер</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">🌐 Браузер</th>
                  <th className="text-center p-2 text-muted-foreground font-medium text-destructive font-bold">Удалено</th>
                </tr>
              </thead>
              <tbody>
                {dailyStats.map(([day, s]) => (
                  <tr key={day} className="border-b border-border/30">
                    <td className="p-2">
                      {new Date(day).toLocaleDateString("ru-RU", { day: "numeric", month: "short", weekday: "short" })}
                    </td>
                    <td className="text-center p-2">{s.checked}</td>
                    <td className="text-center p-2 text-amber-500">{s.broken}</td>
                    <td className="text-center p-2">{s.server || "—"}</td>
                    <td className="text-center p-2">{s.client || "—"}</td>
                    <td className="text-center p-2 font-bold text-destructive">{s.deleted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Recent individual logs */}
        {logs && logs.length > 0 && (
          <div className="mt-4 space-y-1.5">
            <h4 className="text-sm font-medium text-muted-foreground">Последние события</h4>
            {logs.slice(0, 15).map((log) => (
              <div key={log.id} className="flex items-center gap-2 text-xs py-1.5 border-b border-border/30 last:border-0">
                <Badge variant={log.source === "server_cron" ? "default" : "outline"} className="text-[10px]">
                  {log.source === "server_cron" ? "🖥 Сервер" : "🌐 Браузер"}
                </Badge>
                <span className="text-muted-foreground">
                  {new Date(log.created_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
                <span>проверено: {log.checked}</span>
                <span className="text-amber-500">сломано: {log.broken}</span>
                <span className="text-destructive font-medium">удалено: {log.deleted}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ==================== INTEGRATIONS TAB ==================== */
function IntegrationsTab() {
  const [gaId, setGaId] = useState("");
  const [fbPixelId, setFbPixelId] = useState("");
  const [tiktokPixelId, setTiktokPixelId] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { isLoading } = useQuery({
    queryKey: ["admin-integrations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("trend_settings")
        .select("key, value")
        .in("key", ["ga_id", "fb_pixel_id", "tiktok_pixel_id"]);
      data?.forEach((row) => {
        const val = String(row.value ?? "").replace(/"/g, "");
        if (row.key === "ga_id") setGaId(val);
        if (row.key === "fb_pixel_id") setFbPixelId(val);
        if (row.key === "tiktok_pixel_id") setTiktokPixelId(val);
      });
      return data;
    },
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = [
        { key: "ga_id", value: gaId },
        { key: "fb_pixel_id", value: fbPixelId },
        { key: "tiktok_pixel_id", value: tiktokPixelId },
      ];
      for (const entry of entries) {
        const { data: existing } = await supabase
          .from("trend_settings")
          .select("id")
          .eq("key", entry.key)
          .maybeSingle();
        if (existing) {
          await supabase.from("trend_settings").update({ value: entry.value as any }).eq("key", entry.key);
        } else {
          await supabase.from("trend_settings").insert({ key: entry.key, value: entry.value as any });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["tracking-pixel-settings"] });
      toast.success("Настройки интеграций сохранены");
    } catch (e) {
      toast.error("Ошибка при сохранении");
    }
    setSaving(false);
  };

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mt-8" />;

  const pixelConfigs = [
    {
      label: "Google Analytics",
      description: "Отслеживание посещений, поведения пользователей и конверсий",
      placeholder: "G-XXXXXXXXXX",
      value: gaId,
      onChange: setGaId,
      icon: "📊",
      eventInfo: "sign_up — при успешной регистрации",
    },
    {
      label: "Facebook Pixel",
      description: "Ретаргетинг и отслеживание конверсий для рекламы в Facebook/Instagram",
      placeholder: "1234567890123456",
      value: fbPixelId,
      onChange: setFbPixelId,
      icon: "📘",
      eventInfo: "CompleteRegistration — при успешной регистрации",
    },
    {
      label: "TikTok Pixel",
      description: "Отслеживание конверсий для рекламы в TikTok",
      placeholder: "CXXXXXXXXXXXXXXXXX",
      value: tiktokPixelId,
      onChange: setTiktokPixelId,
      icon: "🎵",
      eventInfo: "CompleteRegistration — при успешной регистрации",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cron Jobs Section */}
      <CronJobsSection />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Пиксели и аналитика</h2>
          <p className="text-sm text-muted-foreground">
            Настройте пиксели для отслеживания конверсий с рекламных кампаний
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Сохранить
        </Button>
      </div>

      <div className="grid gap-4">
        {pixelConfigs.map((cfg) => (
          <Card key={cfg.label}>
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-start gap-4">
                <span className="text-2xl">{cfg.icon}</span>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-medium text-foreground">{cfg.label}</h3>
                    <p className="text-sm text-muted-foreground">{cfg.description}</p>
                  </div>
                  <Input
                    placeholder={cfg.placeholder}
                    value={cfg.value}
                    onChange={(e) => cfg.onChange(e.target.value)}
                    className="max-w-md"
                  />
                  <div className="flex items-center gap-2">
                    <Badge variant={cfg.value ? "default" : "outline"} className="text-xs">
                      {cfg.value ? "✅ Активен" : "⏸️ Не настроен"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Событие: {cfg.eventInfo}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-5 pb-4 px-5">
          <h3 className="font-medium text-foreground mb-2">📋 Отслеживаемые события</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
              <Badge variant="secondary">Регистрация</Badge>
              <span>→ GA: <code className="text-xs bg-muted px-1 rounded">sign_up</code>, FB: <code className="text-xs bg-muted px-1 rounded">CompleteRegistration</code>, TikTok: <code className="text-xs bg-muted px-1 rounded">CompleteRegistration</code></span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
              <Badge variant="secondary">Оплата</Badge>
              <span>→ GA: <code className="text-xs bg-muted px-1 rounded">purchase</code>, FB: <code className="text-xs bg-muted px-1 rounded">Purchase</code>, TikTok: <code className="text-xs bg-muted px-1 rounded">PlaceAnOrder</code></span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
              <Badge variant="secondary">Просмотр видео</Badge>
              <span>→ GA: <code className="text-xs bg-muted px-1 rounded">view_item</code>, FB: <code className="text-xs bg-muted px-1 rounded">ViewContent</code>, TikTok: <code className="text-xs bg-muted px-1 rounded">ViewContent</code></span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
              <Badge variant="secondary">Поиск</Badge>
              <span>→ GA: <code className="text-xs bg-muted px-1 rounded">search</code>, FB: <code className="text-xs bg-muted px-1 rounded">Search</code>, TikTok: <code className="text-xs bg-muted px-1 rounded">Search</code></span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
              <Badge variant="secondary">Начало оплаты</Badge>
              <span>→ GA: <code className="text-xs bg-muted px-1 rounded">begin_checkout</code>, FB: <code className="text-xs bg-muted px-1 rounded">InitiateCheckout</code>, TikTok: <code className="text-xs bg-muted px-1 rounded">InitiateCheckout</code></span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
              <Badge variant="secondary">Избранное</Badge>
              <span>→ GA: <code className="text-xs bg-muted px-1 rounded">add_to_wishlist</code>, FB: <code className="text-xs bg-muted px-1 rounded">AddToWishlist</code>, TikTok: <code className="text-xs bg-muted px-1 rounded">AddToWishlist</code></span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
              <Badge variant="secondary">Просмотр страницы</Badge>
              <span>→ Все пиксели: автоматически при навигации (SPA)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ==================== CRON JOBS SECTION ==================== */
function CronJobsSection() {
  const queryClient = useQueryClient();

  // Fetch cron jobs from cron.job table
  const { data: cronJobs, isLoading } = useQuery({
    queryKey: ["admin-cron-jobs"],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_cron_jobs");
      if (error) throw error;
      return (data || []) as Array<{
        jobid: number;
        schedule: string;
        command: string;
        jobname: string;
        active: boolean;
      }>;
    },
    staleTime: 30_000,
  });

  // Fetch recent refresh logs to show last run status
  const { data: recentLogs } = useQuery({
    queryKey: ["admin-cron-recent-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("trend_refresh_logs")
        .select("started_at, finished_at, status, total_saved, mode")
        .order("started_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    staleTime: 30_000,
  });

  const getLastRunForMode = (mode: string) => {
    return recentLogs?.find((l) => l.mode === mode);
  };

  const formatSchedule = (schedule: string) => {
    if (schedule === "0 */12 * * *") return "Әр 12 сағат (00:00, 12:00 UTC)";
    if (schedule === "15 */12 * * *") return "Әр 12 сағат (00:15, 12:15 UTC)";
    if (schedule === "0 */6 * * *") return "Әр 6 сағат";
    if (schedule === "0 0 * * *") return "Күнде 00:00 UTC";
    return schedule;
  };

  const getModeFromCommand = (command: string): string | null => {
    const match = command.match(/"mode"\s*:\s*"([^"]+)"/);
    return match ? match[1] : null;
  };

  const getStatusBadge = (status: string) => {
    if (status === "done") return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">✅ Успешно</Badge>;
    if (status === "running") return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs animate-pulse">⏳ Выполняется</Badge>;
    if (status === "error") return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">❌ Ошибка</Badge>;
    return <Badge variant="outline" className="text-xs">{status}</Badge>;
  };

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mt-4" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Автоматические задачи (Cron)
          </h2>
          <p className="text-sm text-muted-foreground">Расписание автоматического обновления трендов</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-cron-jobs"] })}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Обновить
        </Button>
      </div>

      {!cronJobs || cronJobs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Нет активных cron-задач
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {cronJobs.map((job) => {
            const mode = getModeFromCommand(job.command);
            const lastRun = mode ? getLastRunForMode(mode) : null;

            return (
              <Card key={job.jobid} className={!job.active ? "opacity-50" : ""}>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground text-sm">{job.jobname}</span>
                        <Badge variant={job.active ? "default" : "secondary"} className="text-[10px]">
                          {job.active ? "🟢 Активен" : "⏸️ Пауза"}
                        </Badge>
                        {mode && (
                          <Badge variant="outline" className="text-[10px]">
                            {mode === "mass_kk" ? "🇰🇿 KK" : mode === "mass_ru" ? "🇷🇺 RU" : mode === "mass_en" ? "🇺🇸 EN" : mode}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        📅 {formatSchedule(job.schedule)}
                      </p>
                      {lastRun && (
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="text-muted-foreground">Последний запуск:</span>
                          {getStatusBadge(lastRun.status)}
                          <span className="text-muted-foreground">
                            {lastRun.finished_at
                              ? format(new Date(lastRun.finished_at), "dd.MM HH:mm")
                              : format(new Date(lastRun.started_at), "dd.MM HH:mm")}
                          </span>
                          {lastRun.total_saved !== null && lastRun.total_saved > 0 && (
                            <span className="text-emerald-400 font-medium">+{lastRun.total_saved} видео</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recent runs log */}
      {recentLogs && recentLogs.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-primary" />
              Последние запуски
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-1.5">
              {recentLogs.map((log, i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-1.5 border-b border-border/30 last:border-0">
                  {getStatusBadge(log.status)}
                  <Badge variant="outline" className="text-[10px]">
                    {log.mode === "mass_kk" ? "🇰🇿 KK" : log.mode === "mass_ru" ? "🇷🇺 RU" : log.mode === "mass_en" ? "🇺🇸 EN" : log.mode}
                  </Badge>
                  <span className="text-muted-foreground">
                    {format(new Date(log.started_at), "dd.MM HH:mm")}
                  </span>
                  {log.total_saved !== null && log.total_saved > 0 && (
                    <span className="text-emerald-400 font-medium">+{log.total_saved}</span>
                  )}
                  {log.finished_at && (
                    <span className="text-muted-foreground ml-auto">
                      {Math.round((new Date(log.finished_at).getTime() - new Date(log.started_at).getTime()) / 1000)}с
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
