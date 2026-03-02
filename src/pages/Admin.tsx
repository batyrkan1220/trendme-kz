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
  RefreshCw, Settings, Hash, BarChart3, Play, Trash2, Plus, Save, Shield, Loader2,
  Users, Activity, Video, Search, BookOpen, Heart, UserCircle, ScrollText,
  CreditCard, Crown, X, Edit2, Sparkles, Check,
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
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-platform-stats"],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=platform-stats`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    refetchInterval: 60000,
  });

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mt-8" />;

  const statCards = [
    { label: "Пользователи", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-500" },
    { label: "Активные (7д)", value: stats?.activeUsers || 0, icon: Activity, color: "text-green-500" },
    { label: "Видео в базе", value: stats?.totalVideos || 0, icon: Video, color: "text-primary" },
    { label: "Избранные", value: stats?.totalFavorites || 0, icon: Heart, color: "text-red-500" },
    { label: "Скрипты", value: stats?.totalScripts || 0, icon: ScrollText, color: "text-amber-500" },
    { label: "Анализы видео", value: stats?.totalAnalyses || 0, icon: Video, color: "text-violet-500" },
    { label: "Поисковые запросы", value: stats?.totalSearches || 0, icon: Search, color: "text-cyan-500" },
    { label: "Отслеживаемые аккаунты", value: stats?.totalAccounts || 0, icon: UserCircle, color: "text-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

      {stats?.activityBreakdown && Object.keys(stats.activityBreakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Активность за 24 часа</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.activityBreakdown).map(([type, count]) => (
                <Badge key={type} variant="secondary" className="text-sm py-1 px-3">
                  {type}: {count as number}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ==================== USERS TAB ==================== */
function UsersTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

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

  const users = data?.users || [];

  return (
    <div className="space-y-4">
      <Input
        placeholder="Поиск по email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

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
                    <th className="text-left p-3 text-muted-foreground font-medium">Посл. вход</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Тариф</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Роли</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => {
                    const sub = u.subscription;
                    const isExpired = sub && new Date(sub.expires_at) < new Date();
                    return (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-3 font-medium">{u.email}</td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("ru-RU")}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {u.last_sign_in_at
                          ? new Date(u.last_sign_in_at).toLocaleDateString("ru-RU")
                          : "—"}
                      </td>
                      <td className="p-3">
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
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
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
  const [section, setSection] = useState<"refresh" | "keywords" | "settings" | "stats">("refresh");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          { key: "refresh" as const, label: "Обновление", icon: Play },
          { key: "keywords" as const, label: "Запросы", icon: Hash },
          { key: "settings" as const, label: "Настройки", icon: Settings },
          { key: "stats" as const, label: "По категориям", icon: BarChart3 },
        ].map(({ key, label, icon: Icon }) => (
          <Button key={key} variant={section === key ? "default" : "outline"} size="sm" onClick={() => setSection(key)} className="gap-1.5">
            <Icon className="h-4 w-4" />{label}
          </Button>
        ))}
      </div>
      {section === "refresh" && <RefreshSection />}
      {section === "keywords" && <KeywordsSection />}
      {section === "settings" && <SettingsSection />}
      {section === "stats" && <StatsSection />}
    </div>
  );
}

function RefreshSection() {
  const queryClient = useQueryClient();

  const { data: logs = [] } = useQuery({
    queryKey: ["refresh-logs"],
    queryFn: async () => {
      const { data } = await supabase.from("trend_refresh_logs").select("*").order("started_at", { ascending: false }).limit(20);
      return data || [];
    },
    refetchInterval: 5000,
  });

  const isRunning = logs.some((l: any) => l.status === "running");

  const triggerRefresh = async () => {
    toast.info("Обновление запущено на сервере. Можете закрыть страницу — процесс продолжится.");
    supabase.functions.invoke("refresh-trends", { 
      body: { mode: "mass" } 
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
        <CardHeader><CardTitle className="text-lg">Массовое обновление трендов</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={triggerRefresh} 
            disabled={isRunning} 
            size="lg"
            className="w-full gap-3 h-14 text-base"
          >
            {isRunning ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
            {isRunning 
              ? "⏳ Обновление идёт на сервере..." 
              : "🚀 Запустить обновление (все 30 категорий)"
            }
          </Button>
          {isRunning && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Обновление работает на сервере. Можете закрыть страницу — процесс не остановится.</span>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Обновление запускается на сервере и работает независимо от браузера. Даже если закроете страницу — процесс продолжится.
          </p>
        </CardContent>
      </Card>
      {logs.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><BookOpen className="h-5 w-5" />Журнал обновлений</CardTitle></CardHeader>
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
              const nicheStats: Record<string, number> = (log.niche_stats as any) || {};
              const nicheEntries = Object.entries(nicheStats).sort(([, a], [, b]) => (b as number) - (a as number));
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
                      <p className="text-xs text-muted-foreground">Всего видео</p>
                    </div>
                    <div className="bg-muted/40 rounded-md p-2">
                      <p className="text-lg font-bold text-foreground">{totalNiche}</p>
                      <p className="text-xs text-muted-foreground">По категориям</p>
                    </div>
                    <div className="bg-muted/40 rounded-md p-2">
                      <p className="text-lg font-bold text-foreground">{totalGeneral}</p>
                      <p className="text-xs text-muted-foreground">Общие KZ</p>
                    </div>
                  </div>

                  {nicheEntries.length > 0 && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors text-xs font-medium">
                        📊 По категориям ({nicheEntries.length})
                      </summary>
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                        {nicheEntries.map(([niche, count]) => (
                          <div key={niche} className="flex items-center justify-between bg-muted/30 rounded px-2 py-1 text-xs">
                            <span className="truncate font-medium">{niche}</span>
                            <Badge variant={Number(count) > 0 ? "default" : "secondary"} className="ml-1 text-[10px] px-1.5 py-0">
                              {count as number}
                            </Badge>
                          </div>
                        ))}
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
    if (!selectedNiche || !newQuery.trim()) return;
    const updated = { ...nicheQueries };
    updated[selectedNiche] = [...(updated[selectedNiche] || []), newQuery.trim()];
    saveMutation.mutate(updated);
    setNewQuery("");
  };
  const removeQuery = (niche: string, index: number) => {
    const updated = { ...nicheQueries };
    updated[niche] = updated[niche].filter((_, i) => i !== index);
    saveMutation.mutate(updated);
  };

  const generateWithAI = async () => {
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
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Ошибка генерации");
      }
      const data = await res.json();
      setAiSuggestions(data.keywords || []);
      if ((data.keywords || []).length === 0) {
        toast.info("AI не сгенерировал новых запросов");
      } else {
        toast.success(`Сгенерировано ${data.keywords.length} запросов`);
      }
    } catch (e: any) {
      toast.error(e.message || "Ошибка AI генерации");
    } finally {
      setAiLoading(false);
    }
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

  const niches = Object.keys(nicheQueries).sort();
  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mt-8" />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {niches.map((niche) => (
          <Badge key={niche} variant={selectedNiche === niche ? "default" : "outline"} className="cursor-pointer text-sm" onClick={() => { setSelectedNiche(selectedNiche === niche ? null : niche); setAiSuggestions([]); }}>
            {niche} ({nicheQueries[niche]?.length || 0})
          </Badge>
        ))}
      </div>
      {selectedNiche && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Запросы для категории: <span className="text-primary">{selectedNiche}</span></CardTitle>
              <Button onClick={generateWithAI} disabled={aiLoading} size="sm" variant="outline" className="gap-1.5">
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                AI запросы
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Новый запрос или хэштег..." value={newQuery} onChange={(e) => setNewQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addQuery()} />
              <Button onClick={addQuery} size="sm" disabled={saveMutation.isPending}><Plus className="h-4 w-4" /></Button>
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
              {(nicheQueries[selectedNiche] || []).map((q, i) => (
                <Badge key={i} variant="secondary" className="gap-1 pr-1">
                  {q}
                  <button onClick={() => removeQuery(selectedNiche, i)} className="ml-1 hover:text-destructive transition-colors"><Trash2 className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SettingsSection() {
  const queryClient = useQueryClient();
  const { data: thresholds, isLoading } = useQuery({
    queryKey: ["trend-settings", "thresholds"],
    queryFn: async () => {
      const { data } = await supabase.from("trend_settings").select("value").eq("key", "thresholds").single();
      return (data?.value as any) || {};
    },
  });
  const [localThresholds, setLocalThresholds] = useState<any>(null);
  const current = localThresholds || thresholds || {};
  const saveMutation = useMutation({
    mutationFn: async (updated: any) => {
      const { error } = await supabase.from("trend_settings").update({ value: updated, updated_at: new Date().toISOString() }).eq("key", "thresholds");
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["trend-settings"] }); toast.success("Настройки сохранены"); setLocalThresholds(null); },
    onError: () => toast.error("Ошибка сохранения"),
  });
  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mt-8" />;
  const updateField = (path: string, value: number) => {
    const updated = { ...current };
    const keys = path.split(".");
    let obj = updated;
    for (let i = 0; i < keys.length - 1; i++) { obj[keys[i]] = { ...obj[keys[i]] }; obj = obj[keys[i]]; }
    obj[keys[keys.length - 1]] = value;
    setLocalThresholds(updated);
  };
  return (
    <div className="space-y-4 max-w-lg">
      <Card>
        <CardHeader><CardTitle className="text-lg">Пороги и лимиты</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <SettingRow label="Порог слабой категории (видео за 7 дней)" value={current.weak_niche_threshold ?? 20} onChange={(v) => updateField("weak_niche_threshold", v)} />
          <SettingRow label="Порог заполненной категории (пропуск при обновлении)" value={current.full_niche_threshold ?? 100} onChange={(v) => updateField("full_niche_threshold", v)} />
          <SettingRow label="Мин. trend_score для зарубежных видео" value={current.min_foreign_trend_score ?? 500} onChange={(v) => updateField("min_foreign_trend_score", v)} />
          <div className="pt-2 border-t border-border">
            <p className="text-sm font-medium text-muted-foreground mb-2">Запросов на категорию</p>
            {["lite", "full", "mass"].map((mode) => (<SettingRow key={mode} label={`${mode} режим`} value={current.queries_per_niche?.[mode] ?? 3} onChange={(v) => updateField(`queries_per_niche.${mode}`, v)} />))}
          </div>
          <div className="pt-2 border-t border-border">
            <p className="text-sm font-medium text-muted-foreground mb-2">Запросов на слабую категорию</p>
            {["lite", "full", "mass"].map((mode) => (<SettingRow key={mode} label={`${mode} режим`} value={current.weak_queries_per_niche?.[mode] ?? 6} onChange={(v) => updateField(`weak_queries_per_niche.${mode}`, v)} />))}
          </div>
          <div className="pt-2 border-t border-border">
            <p className="text-sm font-medium text-muted-foreground mb-2">Общих KZ запросов</p>
            {["lite", "full", "mass"].map((mode) => (<SettingRow key={mode} label={`${mode} режим`} value={current.general_kz_count?.[mode] ?? 5} onChange={(v) => updateField(`general_kz_count.${mode}`, v)} />))}
          </div>
          {localThresholds && (
            <Button onClick={() => saveMutation.mutate(localThresholds)} disabled={saveMutation.isPending} className="w-full">
              <Save className="h-4 w-4 mr-2" />Сохранить настройки
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SettingRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-foreground">{label}</span>
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-24 text-center" />
    </div>
  );
}

function StatsSection() {
  const { data: nicheStats = [], isLoading } = useQuery({
    queryKey: ["admin-niche-stats"],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000).toISOString();
      // Fetch ALL videos in pages of 1000 to avoid default limit
      const fetchAll = async (filter?: { gte?: string }) => {
        const counts: Record<string, number> = {};
        let from = 0;
        const PAGE = 1000;
        while (true) {
          let q = supabase.from("videos").select("niche", { count: "exact" }).range(from, from + PAGE - 1);
          if (filter?.gte) q = q.gte("published_at", filter.gte);
          const { data, error } = await q;
          if (error || !data || data.length === 0) break;
          for (const v of data) {
            const n = v.niche || "uncategorized";
            counts[n] = (counts[n] || 0) + 1;
          }
          if (data.length < PAGE) break;
          from += PAGE;
        }
        return counts;
      };
      const [totalMap, recentMap] = await Promise.all([fetchAll(), fetchAll({ gte: sevenDaysAgo })]);
      const allNiches = new Set([...Object.keys(totalMap), ...Object.keys(recentMap)]);
      return [...allNiches].map((niche) => ({ niche, total: totalMap[niche] || 0, recent: recentMap[niche] || 0 })).sort((a, b) => b.total - a.total);
    },
    refetchInterval: 5000,
  });
  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mt-8" />;
  const totalAll = nicheStats.reduce((s, n) => s + n.total, 0);
  const recentAll = nicheStats.reduce((s, n) => s + n.recent, 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">Статистика по категориям <Badge variant="secondary">{totalAll} всего / {recentAll} за 7 дней</Badge></CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 max-h-[500px] overflow-y-auto">
          {nicheStats.map((s) => (
            <div key={s.niche} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-muted/30">
              <span className="text-sm font-medium w-28 truncate">{s.niche}</span>
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${Math.min(100, (s.total / (nicheStats[0]?.total || 1)) * 100)}%` }} />
              </div>
              <span className="text-sm text-muted-foreground w-20 text-right">{s.total}</span>
              <Badge variant={s.recent < 20 ? "destructive" : "default"} className="text-xs w-16 justify-center">{s.recent} / 7д</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
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
          <Button size="sm" onClick={() => setEditPlan({ name: "", price_rub: 0, duration_days: 30, max_requests: 100, max_tracked_accounts: 5, features: [], is_active: true, sort_order: plans.length + 1 })}><Plus className="h-4 w-4 mr-1" /> Новый тариф</Button>
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
                <p className="text-xl font-bold text-foreground">{plan.price_rub === 0 ? "Бесплатно" : `${plan.price_rub.toLocaleString()} ₽/мес`}</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Запросов: {plan.max_requests === -1 ? "∞" : plan.max_requests}</p>
                  <p>Авторов: {plan.max_tracked_accounts === -1 ? "∞" : plan.max_tracked_accounts}</p>
                  <p>Срок: {plan.duration_days} дн.</p>
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
            <div><label className="text-sm text-muted-foreground">Цена (₽/мес)</label><Input type="number" value={form.price_rub} onChange={(e) => setForm({ ...form, price_rub: e.target.value })} /></div>
            <div><label className="text-sm text-muted-foreground">Срок (дней)</label><Input type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm text-muted-foreground">Макс запросов (-1 = ∞)</label><Input type="number" value={form.max_requests} onChange={(e) => setForm({ ...form, max_requests: e.target.value })} /></div>
            <div><label className="text-sm text-muted-foreground">Макс авторов (-1 = ∞)</label><Input type="number" value={form.max_tracked_accounts} onChange={(e) => setForm({ ...form, max_tracked_accounts: e.target.value })} /></div>
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
              <SelectContent>{plans.filter((p) => p.is_active).map((p) => (<SelectItem key={p.id} value={p.id}>{p.name} — {p.price_rub === 0 ? "Бесплатно" : `${p.price_rub} ₽`}</SelectItem>))}</SelectContent>
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
