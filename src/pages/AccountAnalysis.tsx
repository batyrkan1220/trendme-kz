import { AppLayout } from "@/components/layout/AppLayout";
import { UserCircle, Users, Heart, Video, Loader2, Check } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function AccountAnalysis() {
  const [url, setUrl] = useState("");
  const queryClient = useQueryClient();

  const { data: account, isPending, mutate: analyze } = useMutation({
    mutationFn: async (profileUrl: string) => {
      const { data, error } = await supabase.functions.invoke("socialkit", {
        body: { action: "account_stats", profile_url: profileUrl },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts-tracked"] });
      toast.success("Аккаунт проанализирован и добавлен в отслеживаемые");
    },
    onError: (err: Error) => {
      toast.error("Не удалось проанализировать аккаунт: " + err.message);
    },
  });

  const handleAnalyze = () => {
    if (!url.trim()) return;
    analyze(url.trim());
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Анализ аккаунта 👤</h1>

        <div className="flex gap-3">
          <Input
            placeholder="Вставьте ссылку на профиль TikTok..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            className="flex-1 h-12 bg-card border-border rounded-xl card-shadow"
          />
          <Button
            onClick={handleAnalyze}
            disabled={isPending}
            className="h-12 gradient-hero text-primary-foreground border-0 px-7 glow-primary hover:opacity-90 transition-opacity rounded-xl font-semibold"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <><UserCircle className="h-4 w-4 mr-2" />Анализировать</>
            )}
          </Button>
        </div>

        {account ? (
          <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-6 card-shadow">
            <div className="flex items-center gap-4">
              {account.avatar_url ? (
                <img src={account.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover ring-4 ring-primary/10" />
              ) : (
                <div className="h-16 w-16 rounded-full gradient-hero flex items-center justify-center text-xl font-bold text-primary-foreground shadow-lg">
                  {account.username?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-foreground">@{account.username}</h2>
                {account.bio && <p className="text-sm text-muted-foreground mt-1">{account.bio}</p>}
                {account.verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent mt-1 bg-accent/10 px-2 py-0.5 rounded-full">
                    <Check className="h-3 w-3" /> Верифицирован
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Users, value: account.followers, label: "Подписчики" },
                { icon: Users, value: account.following, label: "Подписки" },
                { icon: Heart, value: account.total_likes, label: "Лайки" },
                { icon: Video, value: account.total_videos, label: "Видео" },
              ].map((s) => (
                <div key={s.label} className="gradient-card rounded-xl p-5 text-center hover-lift transition-transform">
                  <s.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{Number(s.value || 0).toLocaleString("ru-RU")}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {account.bio_link && (
              <a href={account.bio_link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline font-semibold">
                🔗 {account.bio_link}
              </a>
            )}
          </div>
        ) : !isPending ? (
          <div className="bg-card rounded-2xl border border-border/50 p-12 text-center card-shadow">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <UserCircle className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground font-medium">Вставьте ссылку на профиль TikTok для анализа</p>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
