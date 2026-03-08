import { AppLayout } from "@/components/layout/AppLayout";
import {
  UserCircle, Users, Heart, Video, Loader2, Check, Eye, MessageCircle, Share2,
  TrendingUp, BarChart3, Zap, ExternalLink, Play, Music, X, Sparkles, Star
} from "lucide-react";
import { VideoCard, VideoCardData } from "@/components/VideoCard";
import { useState, useCallback, useMemo } from "react";
import { VideoAnalysisDialog } from "@/components/VideoAnalysisDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

const isValidTikTokUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url.trim());
    const hosts = ["tiktok.com", "www.tiktok.com", "vm.tiktok.com", "m.tiktok.com", "vt.tiktok.com", "lite.tiktok.com"];
    return hosts.some(h => parsed.hostname === h || parsed.hostname.endsWith("." + h));
  } catch {
    return false;
  }
};

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString("ru-RU");
}

function getTimeAgo(ts: number): string {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days < 1) return "сегодня";
  if (days < 7) return `${days}д назад`;
  if (days < 30) return `${Math.floor(days / 7)}нед назад`;
  if (days < 365) return `${Math.floor(days / 30)} мес. назад`;
  return `${Math.floor(days / 365)}г назад`;
}

interface TopVideo {
  id: string; desc: string; cover: string; url: string;
  views: number; likes: number; comments: number; shares: number;
  duration: number; createTime: number;
}

export default function AccountAnalysis() {
  const [url, setUrl] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [analysisVideo, setAnalysisVideo] = useState<any>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { checkAndLog } = useSubscription();



  // Favorites
  const { data: userFavorites = [] } = useQuery({
    queryKey: ["user-favorites", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("video_id").eq("user_id", user!.id);
      return data?.map((f) => f.video_id) || [];
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const toggleFav = useCallback(async (videoId: string) => {
    if (!user) return;
    const isFav = userFavorites.includes(videoId);
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("video_id", videoId);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, video_id: videoId });
    }
    queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
  }, [user, userFavorites, queryClient]);

  const [account, setAccount] = useState<any>(null);

  const { isPending, mutate: analyze } = useMutation({
    mutationFn: async (profileUrl: string) => {
      const { data, error } = await supabase.functions.invoke("socialkit", {
        body: { action: "account_stats", profile_url: profileUrl },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setAccount(data);
      queryClient.invalidateQueries({ queryKey: ["accounts-tracked"] });
      toast.success("Аккаунт проанализирован");
    },
    onError: (err: Error) => {
      toast.error("Ошибка: " + err.message);
    },
  });



  const handleAnalyze = async () => {
    if (!url.trim() || isPending) return;
    if (!isValidTikTokUrl(url.trim())) {
      toast.error("Используйте только ссылку на TikTok (например: https://www.tiktok.com/@username)");
      return;
    }
    const ok = await checkAndLog("account_analysis", `Анализ аккаунта: ${url.trim()}`);
    if (!ok) return;
    analyze(url.trim());
  };

  const topVideos: TopVideo[] = account?.top_videos || [];

  return (
    <AppLayout>
      {!account && !isPending ? (
        /* Centered empty state */
        <div className="flex flex-col items-center justify-center p-4 animate-fade-in" style={{ minHeight: "calc(100dvh - 8rem)", paddingTop: "max(env(safe-area-inset-top, 0px) + 16px, 16px)" }}>
          <div className="w-full max-w-lg flex flex-col items-center gap-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground text-center">Анализ аккаунта 👤</h1>
            <p className="text-muted-foreground text-sm text-center">Вставьте ссылку на профиль TikTok для анализа</p>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Input
                placeholder="Вставьте ссылку на профиль TikTok..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                className="flex-1 h-12 bg-card border-border rounded-xl card-shadow text-base"
              />
              <Button
                onClick={handleAnalyze}
                disabled={isPending}
                className="h-12 gradient-hero text-primary-foreground border-0 px-7 glow-primary hover:opacity-90 transition-opacity rounded-xl font-semibold text-sm"
              >
                <UserCircle className="h-4 w-4 mr-2" />Анализировать
              </Button>
            </div>
            {/* History section removed */}
          </div>
        </div>
      ) : isPending && !account ? (
        /* Centered loading */
        <div className="flex flex-col items-center justify-center p-4 animate-fade-in" style={{ minHeight: "calc(100dvh - 8rem)", paddingTop: "max(env(safe-area-inset-top, 0px) + 16px, 16px)" }}>
          <div className="w-full max-w-lg flex flex-col items-center gap-5">
            <div className="w-20 h-20 rounded-2xl gradient-hero flex items-center justify-center glow-primary animate-scale-in">
              <Sparkles className="h-9 w-9 text-primary-foreground animate-pulse" />
            </div>
            <p className="text-muted-foreground font-medium text-center text-sm md:text-base animate-fade-in">
              Анализируем аккаунт...
            </p>
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        </div>
      ) : (
      <>
      <div className="p-3 md:p-6 lg:p-8 space-y-4 md:space-y-6 animate-fade-in max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Анализ аккаунта 👤</h1>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Вставьте ссылку на профиль TikTok..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            className="flex-1 h-11 md:h-12 bg-card border-border rounded-xl card-shadow text-base"
          />
          <Button
            onClick={handleAnalyze}
            disabled={isPending}
            className="h-11 md:h-12 gradient-hero text-primary-foreground border-0 px-5 md:px-7 glow-primary hover:opacity-90 transition-opacity rounded-xl font-semibold text-sm"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <><UserCircle className="h-4 w-4 mr-2" />Анализировать</>
            )}
          </Button>
        </div>

        {/* Results */}
        {account && (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="bg-card rounded-xl md:rounded-2xl border border-border/50 p-4 md:p-6 card-shadow">
              <div className="flex items-start gap-3 md:gap-5">
                {account.avatar_url ? (
                  <img src={account.avatar_url} alt="" className="h-14 w-14 md:h-20 md:w-20 rounded-full object-cover ring-4 ring-primary/10 shrink-0" />
                ) : (
                  <div className="h-14 w-14 md:h-20 md:w-20 rounded-full gradient-hero flex items-center justify-center text-xl md:text-2xl font-bold text-primary-foreground shadow-lg shrink-0">
                    {account.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg md:text-xl font-bold text-foreground">@{account.username}</h2>
                    {account.verified && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        <Check className="h-3 w-3" /> Верифицирован
                      </span>
                    )}
                  </div>
                  {account.bio && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{account.bio}</p>}
                  {account.bio_link && (
                    <a href={account.bio_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium mt-1">
                      <ExternalLink className="h-3 w-3" /> {account.bio_link}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              {[
                { icon: Users, value: account.followers, label: "Подписчики", color: "text-primary" },
                { icon: Heart, value: account.total_likes, label: "Лайки", color: "text-primary/80" },
                { icon: Video, value: account.total_videos, label: "Видео", color: "text-primary/70" },
                { icon: Users, value: account.following, label: "Подписки", color: "text-primary/60" },
              ].map((s) => (
                <div key={s.label} className="bg-card rounded-xl border border-border/50 p-3 md:p-4 text-center card-shadow hover-lift transition-transform">
                  <s.icon className={`h-4 w-4 md:h-5 md:w-5 ${s.color} mx-auto mb-1 md:mb-2`} />
                  <p className="text-lg md:text-xl font-bold text-foreground">{formatNum(Number(s.value || 0))}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Advanced Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
              <div className="bg-card rounded-xl border border-border/50 p-5 card-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Engagement Rate</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{account.engagement_rate || 0}%</p>
                <p className="text-xs text-muted-foreground mt-1">Среднее вовлечение на видео</p>
              </div>

              <div className="bg-card rounded-xl border border-border/50 p-5 card-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Eye className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Средние просмотры</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatNum(account.avg_views || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">Среднее по найденным видео</p>
              </div>

              <div className="bg-card rounded-xl border border-border/50 p-5 card-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Средние лайки</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatNum(account.avg_likes_per_video || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">Лайков на видео в среднем</p>
              </div>
            </div>

            {/* Top Videos */}
            {topVideos.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" /> Топ видео по просмотрам
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
                  {topVideos.map((v) => {
                    const cardData: VideoCardData = {
                      id: v.id,
                      platform_video_id: v.id,
                      url: v.url,
                      cover_url: v.cover,
                      caption: v.desc,
                      author_username: account?.username,
                      author_avatar_url: account?.avatar_url,
                      views: v.views,
                      likes: v.likes,
                      comments: v.comments,
                      shares: v.shares,
                      published_at: null,
                      createTime: v.createTime,
                      duration: v.duration,
                    };
                    return (
                      <VideoCard
                        key={v.id}
                        video={cardData}
                        playingId={playingId}
                        onPlay={setPlayingId}
                        isFavorite={userFavorites.includes(v.id)}
                        onToggleFav={toggleFav}
                        onAnalyze={(vid) => {
                          setAnalysisVideo({
                            id: vid.id,
                            url: vid.url,
                            cover_url: vid.cover_url || vid.cover,
                            platform_video_id: vid.id,
                            views: vid.views,
                            likes: vid.likes,
                            comments: vid.comments,
                            shares: vid.shares,
                            caption: vid.caption || vid.desc,
                          });
                        }}
                        showTier={true}
                        showAuthor={false}
                        darkMode
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
      <VideoAnalysisDialog
        video={analysisVideo}
        open={!!analysisVideo}
        onOpenChange={(open) => { if (!open) setAnalysisVideo(null); }}
      />
      </>
      )}
    </AppLayout>
  );
}
