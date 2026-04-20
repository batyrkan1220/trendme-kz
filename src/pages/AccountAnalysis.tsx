import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { hapticSuccess } from "@/lib/haptics";
import { LogOut, CreditCard, UserCircle, Search, Loader2, ExternalLink } from "lucide-react";
import { isNativePlatform } from "@/lib/native";

const fmt = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
};

export default function AccountAnalysis() {
  const { user, signOut } = useAuth();
  const { isFreeTrial, hasActiveSubscription } = useSubscription();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const { data: result, isPending, mutate: analyze } = useMutation({
    mutationFn: async (uname: string) => {
      const { data, error } = await supabase.functions.invoke("socialkit", {
        body: { action: "analyze_account", username: uname.replace("@", "") },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => hapticSuccess(),
    onError: (err: Error) => toast.error(err.message || "Қате шықты"),
  });

  const stats = result?.user_info;

  return (
    <AppLayout>
      <div
        className="h-full overflow-y-auto pb-24 bg-background"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
      >
        {/* Профиль карточкасы */}
        <div className="px-4 mb-6">
          <div className="rounded-2xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <UserCircle className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm truncate max-w-[200px]">{user?.email}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {hasActiveSubscription && !isFreeTrial ? (
                    <span className="text-green-500 font-medium">✓ Подписка активна</span>
                  ) : (
                    <span className="text-muted-foreground">Бесплатный план</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8"
                onClick={() => navigate("/subscription")}
              >
                <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                Подписка
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Выйти
              </Button>
            </div>
          </div>
        </div>

        {/* Аккаунт анализі */}
        <div className="px-4">
          <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            Анализ TikTok аккаунта
          </h2>
          <div className="flex gap-2 mb-4">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@username"
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && username && analyze(username)}
            />
            <Button
              onClick={() => analyze(username)}
              disabled={!username || isPending}
              className="shrink-0"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Анализ"}
            </Button>
          </div>

          {/* Нәтиже */}
          {stats && (
            <div className="space-y-3">
              {/* Аватар + ат */}
              <div className="rounded-2xl border border-border/50 bg-card p-4 flex items-center gap-3">
                {stats.avatar_larger?.url_list?.[0] && (
                  <img
                    src={stats.avatar_larger.url_list[0]}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover border-2 border-border/50"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground truncate">{stats.nickname}</p>
                  <p className="text-sm text-primary">@{stats.unique_id}</p>
                  {stats.signature && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{stats.signature}</p>
                  )}
                </div>
                <a
                  href={`https://tiktok.com/@${stats.unique_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-muted-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              {/* Статистика */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Жазылушы", value: fmt(stats.follower_count || 0) },
                  { label: "Лайк", value: fmt(stats.heart_count || 0) },
                  { label: "Видео", value: fmt(stats.video_count || 0) },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-border/50 bg-card p-3 text-center">
                    <p className="text-lg font-bold text-foreground">{s.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* AI анализ */}
              {result?.analysis && (
                <div className="rounded-2xl border border-border/50 bg-card p-4">
                  <h3 className="text-sm font-bold text-foreground mb-2">AI Анализ</h3>
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {typeof result.analysis === "string" ? result.analysis : JSON.stringify(result.analysis, null, 2)}
                  </p>
                </div>
              )}
            </div>
          )}

          {!stats && !isPending && (
            <div className="text-center py-12 text-muted-foreground/40">
              <UserCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">TikTok аккаунтының username-ін енгізіңіз</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
