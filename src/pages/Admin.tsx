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
} from "lucide-react";

export default function Admin() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { user } = useAuth();

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

        <Tabs defaultValue="keywords" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-xl">
            <TabsTrigger value="keywords"><Hash className="h-4 w-4 mr-1" />Запросы</TabsTrigger>
            <TabsTrigger value="refresh"><Play className="h-4 w-4 mr-1" />Обновление</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-1" />Настройки</TabsTrigger>
            <TabsTrigger value="stats"><BarChart3 className="h-4 w-4 mr-1" />Статистика</TabsTrigger>
          </TabsList>

          <TabsContent value="keywords"><NicheKeywordsTab /></TabsContent>
          <TabsContent value="refresh"><RefreshTab /></TabsContent>
          <TabsContent value="settings"><SettingsTab /></TabsContent>
          <TabsContent value="stats"><StatsTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
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
  const { user } = useAuth();
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
      // Function might timeout but still running
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
      
      // Get total counts
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
