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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SubscriptionsTab from "@/components/admin/SubscriptionsTab";

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
            <TabsTrigger value="subscriptions"><CreditCard className="h-4 w-4 mr-1" />Подписки</TabsTrigger>
            <TabsTrigger value="moderation"><Flag className="h-4 w-4 mr-1" />Модерация</TabsTrigger>
            <TabsTrigger value="trends"><RefreshCw className="h-4 w-4 mr-1" />Тренды</TabsTrigger>
            <TabsTrigger value="integrations"><Link2 className="h-4 w-4 mr-1" />Интеграции</TabsTrigger>
          </TabsList>

          <TabsContent value="platform"><PlatformTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="subscriptions"><SubscriptionsTab /></TabsContent>
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
  const [planChangeUser, setPlanChangeUser] = useState<{ userId: string; email: string; currentPlanId?: string; currentExpiresAt?: string } | null>(null);

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

  const confirmUserMutation = useMutation({
    mutationFn: async (user_id: string) => {
      const res = await adminFetch(`?action=confirm-user`, {
        method: "POST",
        body: JSON.stringify({ user_id }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-platform-stats"] });
      toast.success("Email подтверждён вручную");
    },
    onError: () => toast.error("Не удалось подтвердить email"),
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
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Подтвердить email ${u.email} вручную?`)) {
                                    confirmUserMutation.mutate(u.id);
                                  }
                                }}
                                disabled={confirmUserMutation.isPending}
                                title="Кликните, чтобы подтвердить email вручную"
                                className="inline-flex items-center rounded border border-destructive text-destructive text-[10px] px-1.5 py-0 hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
                              >
                                не подтв. ✓
                              </button>
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
                                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold w-fit", getPlanBadgeClass(sub.plans?.name), isExpired && "opacity-60 line-through")}>
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  {sub.plans?.name || "—"}
                                </span>
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
                            <Button
                              size="sm" variant="ghost" className="h-7 px-2 text-primary"
                              onClick={() => setPlanChangeUser({
                                userId: u.id, email: u.email,
                                currentPlanId: sub?.plan_id,
                                currentExpiresAt: sub?.expires_at,
                              })}
                              title="Сменить тариф"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
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
      <UserDetailsDialog
        userId={detailUserId}
        onClose={() => setDetailUserId(null)}
        onChangePlan={(uid, email, planId, expiresAt) => {
          setDetailUserId(null);
          setPlanChangeUser({ userId: uid, email, currentPlanId: planId, currentExpiresAt: expiresAt });
        }}
      />

      {/* Change plan dialog */}
      <ChangePlanDialog
        target={planChangeUser}
        plans={plans}
        onClose={() => setPlanChangeUser(null)}
      />
    </div>
  );
}

/* ==================== USER DETAILS DIALOG ==================== */
function UserDetailsDialog({
  userId,
  onClose,
  onChangePlan,
}: {
  userId: string | null;
  onClose: () => void;
  onChangePlan?: (userId: string, email: string, planId?: string, expiresAt?: string) => void;
}) {
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

            {/* Current plan + change button */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4" /> Текущий тариф
                </h4>
                {onChangePlan && (
                  <Button
                    size="sm" variant="outline" className="h-7 text-xs gap-1"
                    onClick={() => {
                      const active = (data.subscriptions || []).find((s: any) => s.is_active);
                      onChangePlan(userId!, data.auth?.email || "", active?.plan_id, active?.expires_at);
                    }}
                  >
                    <Edit2 className="h-3 w-3" /> Сменить тариф
                  </Button>
                )}
              </div>
              {(() => {
                const active = (data.subscriptions || []).find((s: any) => s.is_active);
                if (!active) return <p className="text-xs text-muted-foreground">Нет активного тарифа</p>;
                const expired = new Date(active.expires_at) < new Date();
                return (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-2">
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", getPlanBadgeClass(active.plans?.name))}>
                        <CreditCard className="h-3 w-3 mr-1" />
                        {active.plans?.name || "—"}
                      </span>
                      {expired && <Badge variant="destructive" className="text-[10px]">истёк</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      до {new Date(active.expires_at).toLocaleDateString("ru-RU")}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Subscription history */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <ScrollText className="h-4 w-4" /> История подписок
              </h4>
              {(data.subscriptions || []).length === 0 ? (
                <p className="text-xs text-muted-foreground">Нет подписок</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {(data.subscriptions || []).map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-2 rounded border border-border text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant={s.is_active ? "default" : "outline"} className="text-[10px]">
                          {s.is_active ? "активна" : "истекла"}
                        </Badge>
                        <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold", getPlanBadgeClass(s.plans?.name))}>
                          {s.plans?.name || "—"}
                        </span>
                        {s.note && <span className="text-muted-foreground truncate max-w-[200px]">· {s.note}</span>}
                      </div>
                      <span className="text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString("ru-RU")} → {new Date(s.expires_at).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Plan change history (admin audit) */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Shield className="h-4 w-4" /> История смены тарифа
              </h4>
              {(data.plan_history || []).length === 0 ? (
                <p className="text-xs text-muted-foreground">Админ не менял тариф</p>
              ) : (
                <div className="overflow-x-auto rounded border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/40 text-muted-foreground">
                        <th className="text-left p-2 font-medium">Дата</th>
                        <th className="text-left p-2 font-medium">Админ</th>
                        <th className="text-left p-2 font-medium">Изменение</th>
                        <th className="text-left p-2 font-medium">До</th>
                        <th className="text-left p-2 font-medium">Причина</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.plan_history || []).map((h: any) => (
                        <tr key={h.id} className="border-t border-border">
                          <td className="p-2 text-muted-foreground whitespace-nowrap">
                            {new Date(h.created_at).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })}
                          </td>
                          <td className="p-2 text-foreground truncate max-w-[140px]">{h.admin_email || "—"}</td>
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">{h.old_plan || "—"}</span>
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold", getPlanBadgeClass(h.new_plan))}>
                                {h.new_plan || "—"}
                              </span>
                            </div>
                          </td>
                          <td className="p-2 text-muted-foreground whitespace-nowrap">
                            {h.new_expires_at ? new Date(h.new_expires_at).toLocaleDateString("ru-RU") : "—"}
                          </td>
                          <td className="p-2 text-muted-foreground truncate max-w-[200px]">{h.reason || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

/* ==================== CHANGE PLAN DIALOG ==================== */
function ChangePlanDialog({
  target,
  plans,
  onClose,
}: {
  target: { userId: string; email: string; currentPlanId?: string; currentExpiresAt?: string } | null;
  plans: any[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [planId, setPlanId] = useState<string>("");
  const [startedAt, setStartedAt] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const activePlans = (plans || []).filter((p: any) => p.is_active);

  // Initialize when dialog opens
  useMemo(() => {
    if (!target) return;
    const today = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    setStartedAt(iso(today));
    setPlanId(target.currentPlanId || activePlans[0]?.id || "");
    setExpiresAt(target.currentExpiresAt ? iso(new Date(target.currentExpiresAt)) : iso(new Date(today.getTime() + 30 * 86400000)));
    setReason("");
  }, [target?.userId]);

  const isTrial = (() => {
    const p = activePlans.find((x: any) => x.id === planId);
    return p?.price_rub === 0;
  })();

  // Auto-recalc expiry when plan changes (based on plan duration)
  const onPlanChange = (newId: string) => {
    setPlanId(newId);
    const p = activePlans.find((x: any) => x.id === newId);
    if (!p) return;
    if (p.price_rub === 0) {
      // Trial → no expiry
      setExpiresAt("");
      return;
    }
    if (startedAt) {
      const start = new Date(startedAt);
      const days = p.duration_days || 30;
      const end = new Date(start.getTime() + days * 86400000);
      setExpiresAt(end.toISOString().slice(0, 10));
    }
  };

  const onStartChange = (v: string) => {
    setStartedAt(v);
    const p = activePlans.find((x: any) => x.id === planId);
    if (p && p.price_rub !== 0 && v) {
      const end = new Date(new Date(v).getTime() + (p.duration_days || 30) * 86400000);
      setExpiresAt(end.toISOString().slice(0, 10));
    }
  };

  const changeMutation = useMutation({
    mutationFn: async () => {
      if (!target?.userId) throw new Error("Қате: пайдаланушы ID табылмады");
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=change-user-plan`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: target.userId,
            plan_id: planId,
            started_at: new Date(startedAt).toISOString(),
            // Trial → expires_at null; otherwise end-of-day ISO
            expires_at: isTrial || !expiresAt ? null : new Date(expiresAt + "T23:59:59").toISOString(),
            reason: reason || null,
          }),
        }
      );
      if (!res.ok) {
        let msg = "Failed";
        try { msg = (await res.json()).error || msg; } catch {}
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: (d) => {
      toast.success(`Тариф изменён на «${d.plan_name}»`);
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-details"] });
      setConfirmOpen(false);
      onClose();
    },
    onError: (e: any) => {
      toast.error(e?.message || "Не удалось изменить тариф");
      // Keep modal + selection so admin can retry
      setConfirmOpen(false);
    },
  });

  const selectedPlan = activePlans.find((p: any) => p.id === planId);
  const currentPlan = activePlans.find((p: any) => p.id === target?.currentPlanId);

  // ===== Validation flags =====
  const isSamePlan = !!target?.currentPlanId && planId === target.currentPlanId;
  const todayStr = new Date().toISOString().slice(0, 10);
  const isPastExpiry = !isTrial && !!expiresAt && expiresAt < todayStr;
  const isInvalidRange = !isTrial && !!startedAt && !!expiresAt && new Date(expiresAt) <= new Date(startedAt);
  const isMissingUserId = !target?.userId;
  const hasError = isSamePlan || isPastExpiry || isInvalidRange || isMissingUserId || !planId || !startedAt || (!isTrial && !expiresAt);

  return (
    <>
      <Dialog open={!!target} onOpenChange={(o) => { if (!o && !changeMutation.isPending) onClose(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Сменить тариф
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{target?.email}</p>

            <div>
              <label className="text-sm font-medium">Тариф</label>
              <RadioGroup value={planId} onValueChange={onPlanChange} className="mt-2 gap-2">
                {activePlans.map((p: any) => (
                  <label
                    key={p.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                      planId === p.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                    )}
                  >
                    <RadioGroupItem value={p.id} />
                    <div className="flex-1 flex items-center justify-between">
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", getPlanBadgeClass(p.name))}>
                        {p.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {p.duration_days} дн · {p.price_rub === 0 ? "Бесплатно" : `${p.price_rub.toLocaleString()} ₸`}
                      </span>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {isTrial ? (
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-sm font-medium">Дата начала</label>
                  <Input type="date" value={startedAt} onChange={(e) => onStartChange(e.target.value)} className="mt-1" />
                </div>
                <p className="text-xs text-muted-foreground italic">Пробный тарифте мерзім белгіленбейді</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Дата начала</label>
                  <Input type="date" value={startedAt} onChange={(e) => onStartChange(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Дата окончания</label>
                  <Input
                    type="date"
                    value={expiresAt}
                    min={todayStr}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className={cn("mt-1", isPastExpiry && "border-destructive")}
                  />
                </div>
              </div>
            )}

            {/* Inline validation messages */}
            {isSamePlan && (
              <p className="text-xs text-amber-500">⚠️ Пайдаланушы қазірдің өзінде осы тарифте</p>
            )}
            {isPastExpiry && (
              <p className="text-xs text-destructive">⚠️ Мерзім өткен күнді таңдау мүмкін емес</p>
            )}
            {isInvalidRange && !isPastExpiry && (
              <p className="text-xs text-destructive">⚠️ Дата окончания должна быть позже даты начала</p>
            )}
            {isMissingUserId && (
              <p className="text-xs text-destructive">⚠️ Қате: пайдаланушы ID табылмады</p>
            )}

            <div>
              <label className="text-sm font-medium">Причина / заметка</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Необязательно — например: компенсация, тестовый доступ"
                className="mt-1 min-h-[60px] text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={changeMutation.isPending}>Отмена</Button>
            <Button
              onClick={() => {
                if (isMissingUserId) return toast.error("Қате: пайдаланушы ID табылмады");
                if (!planId) return toast.error("Выберите тариф");
                if (isSamePlan) return toast.error("Пайдаланушы қазірдің өзінде осы тарифте");
                if (!startedAt) return toast.error("Укажите дату начала");
                if (!isTrial) {
                  if (!expiresAt) return toast.error("Укажите дату окончания");
                  if (isPastExpiry) return toast.error("Мерзім өткен күнді таңдау мүмкін емес");
                  if (isInvalidRange) return toast.error("Дата окончания должна быть позже даты начала");
                }
                setConfirmOpen(true);
              }}
              disabled={hasError || changeMutation.isPending}
            >
              Сменить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={(o) => { if (!changeMutation.isPending) setConfirmOpen(o); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердите смену тарифа</AlertDialogTitle>
            <AlertDialogDescription>
              Пользователь <strong>{target?.email}</strong>:<br />
              <strong>«{currentPlan?.name || "—"}»</strong> → <strong>«{selectedPlan?.name}»</strong>
              {!isTrial && expiresAt && (
                <> (до <strong>{new Date(expiresAt).toLocaleDateString("ru-RU")}</strong>)</>
              )}
              {isTrial && <> (без срока)</>}
              {reason && <><br /><span className="text-xs">Причина: {reason}</span></>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changeMutation.isPending}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); if (!changeMutation.isPending) changeMutation.mutate(); }}
              disabled={changeMutation.isPending}
            >
              {changeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Подтвердить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}



/* ==================== TRENDS MANAGEMENT TAB (Instagram Viral) ==================== */
function TrendsManagementTab() {
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);

  const { data: count = 0 } = useQuery({
    queryKey: ["ig-trends-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("videos")
        .select("*", { count: "exact", head: true })
        .eq("source", "trends")
        .eq("platform", "instagram");
      return count || 0;
    },
    refetchInterval: 10000,
  });

  const { data: lastLog } = useQuery({
    queryKey: ["ig-trends-last-log"],
    queryFn: async () => {
      const { data } = await supabase
        .from("trend_refresh_logs")
        .select("*")
        .eq("mode", "ig-viral")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    refetchInterval: 5000,
  });

  const startedAtMs = lastLog?.started_at ? new Date(lastLog.started_at).getTime() : null;
  const isStaleRunning = !!(
    lastLog?.status === "running" &&
    startedAtMs &&
    Date.now() - startedAtMs > 5 * 60 * 1000
  );
  const isBusy = running || (lastLog?.status === "running" && !isStaleRunning);
  const progressAccounts = Number((lastLog as any)?.niche_stats?.processed_accounts ?? 0);
  const totalAccounts = Number((lastLog as any)?.niche_stats?.accounts_polled ?? 38);

  const lastRefreshLabel = lastLog?.finished_at
    ? format(new Date(lastLog.finished_at), "dd MMM yyyy, HH:mm")
    : lastLog?.started_at
    ? `${format(new Date(lastLog.started_at), "dd MMM yyyy, HH:mm")} (в процессе)`
    : "никогда";

  const handleRefresh = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("refresh-trends", {
        body: {},
      });

      if (error || !data?.ok) {
        toast.error(data?.error || error?.message || "Ошибка обновления трендов");
      } else if (data?.queued) {
        toast.success("Запущено в фоне — результат через 1–3 минуты");
      } else {
        toast.success(`Обновлено: ${data.count} видео из ${data.raw} собранных`);
      }
    } catch (e: any) {
      toast.error(e?.message || "Сетевая ошибка");
    } finally {
      setRunning(false);
      queryClient.invalidateQueries({ queryKey: ["ig-trends-count"] });
      queryClient.invalidateQueries({ queryKey: ["ig-trends-last-log"] });
      queryClient.invalidateQueries({ queryKey: ["ig-trends"] });
    }
  };

  const handleStop = async () => {
    if (!lastLog?.id) return;
    const { error } = await supabase
      .from("trend_refresh_logs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: "Остановлено вручную администратором",
      })
      .eq("id", lastLog.id)
      .eq("status", "running");
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Refresh остановлен");
      queryClient.invalidateQueries({ queryKey: ["ig-trends-last-log"] });
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Viral Worldwide (Instagram)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border/50 p-4 bg-muted/30">
              <div className="text-xs text-muted-foreground mb-1">Видео в ленте</div>
              <div className="text-2xl font-bold tabular-nums">{count}</div>
            </div>
            <div className="rounded-lg border border-border/50 p-4 bg-muted/30">
              <div className="text-xs text-muted-foreground mb-1">Последний refresh</div>
              <div className="text-sm font-semibold">{lastRefreshLabel}</div>
              {lastLog?.status && (
                <Badge
                  variant="outline"
                  className={cn(
                    "mt-1.5 text-[10px]",
                    lastLog.status === "completed" && "border-green-500/40 text-green-500",
                    lastLog.status === "running" && "border-blue-500/40 text-blue-500",
                    lastLog.status === "failed" && "border-red-500/40 text-red-500",
                  )}
                >
                  {lastLog.status}
                </Badge>
              )}
            </div>
          </div>

          {lastLog?.error_message && (
            <div className="rounded-md border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-500">
              {lastLog.error_message}
            </div>
          )}

          {lastLog?.status === "running" && (
            <div className="rounded-md border border-border/50 bg-muted/20 p-3 text-xs text-muted-foreground space-y-1.5">
              <div>
                Обработано аккаунтов: <span className="font-semibold text-foreground">{progressAccounts}/{totalAccounts}</span>
              </div>
              {isStaleRunning && (
                <div className="text-red-500">
                  Похоже, прошлый запуск завис — можно безопасно запустить refresh ещё раз.
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handleRefresh}
            disabled={isBusy}
            className="w-full gap-2"
            size="lg"
          >
            {isBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isBusy ? "Обновляем..." : "🔄 Обновить тренды"}
          </Button>

          {lastLog?.status === "running" && (
            <Button
              onClick={handleStop}
              variant="outline"
              className="w-full gap-2 border-red-500/40 text-red-500 hover:bg-red-500/10 hover:text-red-500"
              size="lg"
            >
              <X className="h-4 w-4" />
              Остановить refresh
            </Button>
          )}

          <p className="text-xs text-muted-foreground leading-relaxed">
            Опрашивает курированный список вирусных Instagram-аккаунтов через EnsembleData,
            считает viral_score = (views + likes×2 + comments×3) / часы с публикации,
            оставляет топ-50 с не менее 100K просмотров.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


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
