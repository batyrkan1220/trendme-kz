import { AppLayout } from "@/components/layout/AppLayout";
import { ScrollText, Search, Video, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const typeLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; emoji: string }> = {
  search_run: { label: "Поиск", icon: Search, emoji: "🔍" },
  video_analysis: { label: "Анализ видео", icon: Video, emoji: "🎬" },
  account_analysis: { label: "Анализ аккаунта", icon: UserCircle, emoji: "👤" },
};

export default function Journal() {
  const { user } = useAuth();

  const { data: logs = [] } = useQuery({
    queryKey: ["activity-log", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("activity_log")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Журнал 📋</h1>

        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden card-shadow">
          <div className="grid grid-cols-3 gap-4 px-6 py-3 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>Дата и время</span>
            <span>Тип действия</span>
            <span>Детали</span>
          </div>

          {logs.length > 0 ? (
            <div className="divide-y divide-border/50">
              {logs.map((log) => {
                const info = typeLabels[log.type] || { label: log.type, icon: ScrollText, emoji: "📝" };
                const Icon = info.icon;
                const payload = log.payload_json as Record<string, any> | null;
                return (
                  <div key={log.id} className="grid grid-cols-3 gap-4 px-6 py-3.5 text-sm hover:bg-muted/30 transition-colors">
                    <span className="text-muted-foreground">
                      {new Date(log.created_at).toLocaleString("ru-RU")}
                    </span>
                    <span className="flex items-center gap-2 text-foreground font-medium">
                      <span>{info.emoji}</span>
                      {info.label}
                    </span>
                    <span className="text-muted-foreground truncate">
                      {payload?.query || payload?.video_url || payload?.profile_url || payload?.username || "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <ScrollText className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <p className="text-muted-foreground font-medium">Нет записей в журнале</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
