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
} from "lucide-react";
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
            <TabsTrigger value="keywords"><Hash className="h-4 w-4 mr-1" />Запросы</TabsTrigger>
            <TabsTrigger value="refresh"><Play className="h-4 w-4 mr-1" />Обновление</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-1" />Настройки</TabsTrigger>
            <TabsTrigger value="stats"><BarChart3 className="h-4 w-4 mr-1" />По нишам</TabsTrigger>
          </TabsList>

          <TabsContent value="platform"><PlatformTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="keywords"><NicheKeywordsTab /></TabsContent>
          <TabsContent value="refresh"><RefreshTab /></TabsContent>
          <TabsContent value="settings"><SettingsTab /></TabsContent>
          <TabsContent value="stats"><StatsTab /></TabsContent>
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
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: null,
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      // Edge function uses GET with query params, need to use fetch directly
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
                    <th className="text-left p-3 text-muted-foreground font-medium">Роли</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
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
                  ))}
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

/* ==================== NICHE KEYWORDS TAB ==================== */
function NicheKeywordsTab() {
  const queryClient = useQueryClient();
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [newQuery, setNewQuery] = useState("");

  const { data: nicheQueries = {}, isLoading } = useQuery({
    queryKey: ["trend-settings", "niche_queries"],
    queryFn: async () => {
      const { data } = await supabase
        .from("trend_settings")
        .select("value")
        .eq("key", "niche_queries")
        .single();
      return (data?.value as Record<string, string[]>) || {};
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (updated: Record<string, string[]>) => {
      const { error } = await supabase
        .from("trend_settings")
        .update({ value: updated as any, updated_at: new Date().toISOString() })
        .eq("key", "niche_queries");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trend-settings"] });
      toast.success("Запросы сохранены");
    },
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

  const niches = Object.keys(nicheQueries).sort();

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mt-8" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {niches.map((niche) => (
          <Badge
            key={niche}
            variant={selectedNiche === niche ? "default" : "outline"}
            className="cursor-pointer text-sm"
            onClick={() => setSelectedNiche(selectedNiche === niche ? null : niche)}
          >
            {niche} ({nicheQueries[niche]?.length || 0})
          </Badge>
        ))}
      </div>

      {selectedNiche && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Запросы для ниши: <span className="text-primary">{selectedNiche}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Новый запрос или хэштег..."
                value={newQuery}
                onChange={(e) => setNewQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addQuery()}
              />
              <Button onClick={addQuery} size="sm" disabled={saveMutation.isPending}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
              {(nicheQueries[selectedNiche] || []).map((q, i) => (
                <Badge key={i} variant="secondary" className="gap-1 pr-1">
                  {q}
                  <button
                    onClick={() => removeQuery(selectedNiche, i)}
                    className="ml-1 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ==================== REFRESH TAB ==================== */
function RefreshTab() {
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const triggerRefresh = async (mode: string) => {
    setRefreshing(mode);
    try {
      const body: any = {};
      if (mode === "lite") body.lite = true;
      else if (mode === "mass") body.mass = true;

      const { error } = await supabase.functions.invoke("refresh-trends", { body });
      if (error) throw error;
      toast.success(`Обновление (${mode}) запущено`);
    } catch {
      toast.info(`Обновление (${mode}) запущено — может занять несколько минут`);
    } finally {
      setRefreshing(null);
    }
  };

  const { data: logs = [] } = useQuery({
    queryKey: ["refresh-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("trend_refresh_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    refetchInterval: 10000,
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Запуск обновления трендов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {[
              { mode: "lite", label: "Lite", desc: "Быстрое (2 запроса/ниша)" },
              { mode: "full", label: "Full", desc: "Стандартное (3 запроса/ниша)" },
              { mode: "mass", label: "Mass", desc: "Полное (6 запросов/ниша)" },
            ].map(({ mode, label, desc }) => (
              <Button
                key={mode}
                onClick={() => triggerRefresh(mode)}
                disabled={!!refreshing}
                variant={mode === "mass" ? "default" : "outline"}
                className="flex-col h-auto py-3 px-6"
              >
                {refreshing === mode ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <RefreshCw className="h-5 w-5" />
                )}
                <span className="font-semibold">{label}</span>
                <span className="text-xs opacity-70">{desc}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Последние обновления</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {logs.map((log: any) => (
                <div key={log.id} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-muted/30">
                  <Badge variant={log.status === "completed" ? "default" : log.status === "running" ? "secondary" : "destructive"}>
                    {log.status}
                  </Badge>
                  <span className="text-muted-foreground">
                    {new Date(log.started_at).toLocaleString("ru-RU")}
                  </span>
                  <span className="font-medium">{log.mode}</span>
                  <span className="text-muted-foreground">
                    Сохранено: {log.total_saved} + {log.general_saved} общих
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ==================== SETTINGS TAB ==================== */
function SettingsTab() {
  const queryClient = useQueryClient();

  const { data: thresholds, isLoading } = useQuery({
    queryKey: ["trend-settings", "thresholds"],
    queryFn: async () => {
      const { data } = await supabase
        .from("trend_settings")
        .select("value")
        .eq("key", "thresholds")
        .single();
      return (data?.value as any) || {};
    },
  });

  const [localThresholds, setLocalThresholds] = useState<any>(null);
  const current = localThresholds || thresholds || {};

  const saveMutation = useMutation({
    mutationFn: async (updated: any) => {
      const { error } = await supabase
        .from("trend_settings")
        .update({ value: updated, updated_at: new Date().toISOString() })
        .eq("key", "thresholds");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trend-settings"] });
      toast.success("Настройки сохранены");
      setLocalThresholds(null);
    },
    onError: () => toast.error("Ошибка сохранения"),
  });

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mt-8" />;

  const updateField = (path: string, value: number) => {
    const updated = { ...current };
    const keys = path.split(".");
    let obj = updated;
    for (let i = 0; i < keys.length - 1; i++) {
      obj[keys[i]] = { ...obj[keys[i]] };
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    setLocalThresholds(updated);
  };

  return (
    <div className="space-y-4 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Пороги и лимиты</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            label="Порог слабой ниши (видео за 7 дней)"
            value={current.weak_niche_threshold || 20}
            onChange={(v) => updateField("weak_niche_threshold", v)}
          />
          <SettingRow
            label="Мин. trend_score для зарубежных видео"
            value={current.min_foreign_trend_score || 500}
            onChange={(v) => updateField("min_foreign_trend_score", v)}
          />

          <div className="pt-2 border-t border-border">
            <p className="text-sm font-medium text-muted-foreground mb-2">Запросов на нишу</p>
            {["lite", "full", "mass"].map((mode) => (
              <SettingRow
                key={mode}
                label={`${mode} режим`}
                value={current.queries_per_niche?.[mode] || 3}
                onChange={(v) => updateField(`queries_per_niche.${mode}`, v)}
              />
            ))}
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-sm font-medium text-muted-foreground mb-2">Запросов на слабую нишу</p>
            {["lite", "full", "mass"].map((mode) => (
              <SettingRow
                key={mode}
                label={`${mode} режим`}
                value={current.weak_queries_per_niche?.[mode] || 6}
                onChange={(v) => updateField(`weak_queries_per_niche.${mode}`, v)}
              />
            ))}
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-sm font-medium text-muted-foreground mb-2">Общих KZ запросов</p>
            {["lite", "full", "mass"].map((mode) => (
              <SettingRow
                key={mode}
                label={`${mode} режим`}
                value={current.general_kz_count?.[mode] || 5}
                onChange={(v) => updateField(`general_kz_count.${mode}`, v)}
              />
            ))}
          </div>

          {localThresholds && (
            <Button onClick={() => saveMutation.mutate(localThresholds)} disabled={saveMutation.isPending} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Сохранить настройки
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
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-24 text-center"
      />
    </div>
  );
}

/* ==================== STATS TAB ==================== */
function StatsTab() {
  const { data: nicheStats = [], isLoading } = useQuery({
    queryKey: ["admin-niche-stats"],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000).toISOString();
      
      const { data: allVideos } = await supabase
        .from("videos")
        .select("niche");
      
      const { data: recentVideos } = await supabase
        .from("videos")
        .select("niche")
        .gte("published_at", sevenDaysAgo);

      const totalMap: Record<string, number> = {};
      const recentMap: Record<string, number> = {};
      
      for (const v of allVideos || []) {
        const n = v.niche || "uncategorized";
        totalMap[n] = (totalMap[n] || 0) + 1;
      }
      for (const v of recentVideos || []) {
        const n = v.niche || "uncategorized";
        recentMap[n] = (recentMap[n] || 0) + 1;
      }

      return Object.keys(totalMap)
        .map((niche) => ({
          niche,
          total: totalMap[niche] || 0,
          recent: recentMap[niche] || 0,
        }))
        .sort((a, b) => b.total - a.total);
    },
    refetchInterval: 30000,
  });

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mt-8" />;

  const totalAll = nicheStats.reduce((s, n) => s + n.total, 0);
  const recentAll = nicheStats.reduce((s, n) => s + n.recent, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Статистика по нишам
          <Badge variant="secondary">{totalAll} всего / {recentAll} за 7 дней</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 max-h-[500px] overflow-y-auto">
          {nicheStats.map((s) => (
            <div key={s.niche} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-muted/30">
              <span className="text-sm font-medium w-28 truncate">{s.niche}</span>
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (s.total / (nicheStats[0]?.total || 1)) * 100)}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-20 text-right">{s.total}</span>
              <Badge variant={s.recent < 20 ? "destructive" : "default"} className="text-xs w-16 justify-center">
                {s.recent} / 7д
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
