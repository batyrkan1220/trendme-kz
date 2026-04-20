import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { hapticSuccess } from "@/lib/haptics";
import { LogOut, CreditCard, UserCircle, Search, Loader2, ExternalLink, ArrowRight, Check } from "lucide-react";
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
    onError: (err: Error) => toast.error(err.message || "Ошибка анализа"),
  });

  const stats = result?.user_info;

  return (
    <AppLayout>
      <div
        className="h-full overflow-y-auto bg-background"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0px)" }}
      >
        {/* Header */}
        <div className="glass border-b border-border px-4 h-14 flex items-center sticky top-0 z-10" style={{ paddingTop: "calc(env(safe-area-inset-top,0px) + 0px)" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center relative">
              <div className="w-3 h-3 rounded-full bg-viral" />
            </div>
            <span className="font-bold text-[17px] tracking-tight text-foreground">trendme</span>
          </div>
        </div>

        <div className="px-4 pb-24 max-w-2xl mx-auto">
          {/* Профиль блогы */}
          <div className="mt-6 mb-6">
            <span className="eyebrow">Аккаунт</span>
            <h1 className="mt-2 text-[22px] font-bold tracking-tight text-foreground">Профиль</h1>
          </div>

          {/* User card */}
          <div className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-card hover-lift">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-soft flex items-center justify-center">
                <UserCircle className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-[15px] truncate">{user?.email}</p>
                <div className="mt-1">
                  {hasActiveSubscription && !isFreeTrial ? (
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <Check className="h-3 w-3" /> Подписка активна
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[12px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      Бесплатный план
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => navigate("/subscription")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border text-[13px] font-semibold text-foreground hover:bg-muted transition-all hover-lift press-feedback"
              >
                <CreditCard className="h-4 w-4 text-primary" />
                Подписка
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border text-[13px] font-semibold text-destructive hover:bg-destructive/5 transition-all press-feedback"
              >
                <LogOut className="h-4 w-4" />
                Выйти
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border my-6" />

          {/* Аккаунт анализі */}
          <div className="mb-4">
            <span className="eyebrow">Инструменты</span>
            <h2 className="mt-2 text-[20px] font-bold tracking-tight text-foreground">Анализ TikTok профиля</h2>
            <p className="mt-1 text-[14px] text-muted-foreground">Введите username любого TikTok аккаунта</p>
          </div>

          <div className="flex gap-2 mb-5">
            <div className="flex-1 flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-2.5 focus-within:border-primary transition-colors">
              <span className="text-muted-foreground text-[14px] font-medium">@</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="flex-1 bg-transparent text-foreground text-[14px] outline-none placeholder:text-muted-foreground"
                onKeyDown={(e) => e.key === "Enter" && username && analyze(username)}
              />
            </div>
            <button
              onClick={() => analyze(username)}
              disabled={!username || isPending}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-foreground text-background text-[14px] font-semibold hover:bg-foreground/90 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:translate-y-0 press-feedback shadow-sm"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4" /> Анализ</>}
            </button>
          </div>

          {/* Нәтиже */}
          {stats && (
            <div className="space-y-3">
              {/* Профиль карточкасы */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-card hover-lift">
                <div className="flex items-center gap-4">
                  {stats.avatar_larger?.url_list?.[0] ? (
                    <img src={stats.avatar_larger.url_list[0]} alt="" className="w-16 h-16 rounded-2xl object-cover border border-border" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                      <UserCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[17px] text-foreground truncate">{stats.nickname}</p>
                    <p className="text-[13px] text-primary font-medium">@{stats.unique_id}</p>
                    {stats.signature && (
                      <p className="text-[12px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{stats.signature}</p>
                    )}
                  </div>
                  <a
                    href={`https://tiktok.com/@${stats.unique_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors press-feedback"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                </div>
              </div>

              {/* Статистика */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Подписчики", value: fmt(stats.follower_count || 0), color: "text-primary" },
                  { label: "Лайки",      value: fmt(stats.heart_count || 0),    color: "text-rose-500" },
                  { label: "Видео",      value: fmt(stats.video_count || 0),    color: "text-foreground" },
                ].map((s) => (
                  <div key={s.label} className="bg-card border border-border rounded-2xl p-4 text-center shadow-card">
                    <p className={`text-[20px] font-bold tracking-tight ${s.color}`}>{s.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* AI анализ */}
              {result?.analysis && (
                <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-primary-soft flex items-center justify-center">
                      <Search className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <h3 className="text-[14px] font-bold text-foreground">AI Анализ</h3>
                  </div>
                  <p className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {typeof result.analysis === "string" ? result.analysis : JSON.stringify(result.analysis, null, 2)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!stats && !isPending && (
            <div className="text-center py-14 border border-dashed border-border rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                <UserCircle className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-[14px] font-medium text-foreground mb-1">Введите username</p>
              <p className="text-[13px] text-muted-foreground">Любой открытый TikTok аккаунт</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
