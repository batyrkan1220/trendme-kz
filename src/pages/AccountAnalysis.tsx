import { AppLayout } from "@/components/layout/AppLayout";
import { UserCircle, Users, Heart, Video, Loader2, Plus, Check } from "lucide-react";
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
        <h1 className="text-2xl font-bold text-foreground">Анализ аккаунта</h1>

        <div className="flex gap-3">
          <Input
            placeholder="Вставьте ссылку на профиль TikTok..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            className="flex-1 bg-secondary border-border"
          />
          <Button
            onClick={handleAnalyze}
            disabled={isPending}
            className="gradient-hero text-primary-foreground border-0 px-6 glow-primary hover:opacity-90 transition-opacity"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <><UserCircle className="h-4 w-4 mr-2" />Анализировать</>
            )}
          </Button>
        </div>

        {account ? (
          <div className="bg-card rounded-xl border border-border p-6 space-y-6">
            <div className="flex items-center gap-4">
              {account.avatar_url ? (
                <img src={account.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-full gradient-hero flex items-center justify-center text-xl font-bold text-primary-foreground">
                  {account.username?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-foreground">@{account.username}</h2>
                {account.bio && <p className="text-sm text-muted-foreground mt-1">{account.bio}</p>}
                {account.verified && (
                  <span className="inline-flex items-center gap-1 text-xs text-primary mt-1">
                    <Check className="h-3 w-3" /> Верифицирован
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="gradient-card rounded-lg p-4 text-center">
                <Users className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{Number(account.followers || 0).toLocaleString("ru-RU")}</p>
                <p className="text-xs text-muted-foreground">Подписчики</p>
              </div>
              <div className="gradient-card rounded-lg p-4 text-center">
                <Users className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{Number(account.following || 0).toLocaleString("ru-RU")}</p>
                <p className="text-xs text-muted-foreground">Подписки</p>
              </div>
              <div className="gradient-card rounded-lg p-4 text-center">
                <Heart className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{Number(account.total_likes || 0).toLocaleString("ru-RU")}</p>
                <p className="text-xs text-muted-foreground">Лайки</p>
              </div>
              <div className="gradient-card rounded-lg p-4 text-center">
                <Video className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{Number(account.total_videos || 0).toLocaleString("ru-RU")}</p>
                <p className="text-xs text-muted-foreground">Видео</p>
              </div>
            </div>

            {account.bio_link && (
              <a href={account.bio_link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                {account.bio_link}
              </a>
            )}
          </div>
        ) : !isPending ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <UserCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Вставьте ссылку на профиль TikTok для анализа аккаунта</p>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
