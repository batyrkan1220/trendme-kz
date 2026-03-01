import { AppLayout } from "@/components/layout/AppLayout";
import { TrendingUp, Eye, Heart, MessageCircle, Star, RefreshCw, Share2, Clock, Flame, Play } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function Trends() {
  const [period, setPeriod] = useState<7 | 30>(7);
  const [tab, setTab] = useState<"all" | "kz" | "world">("all");
  const [refreshing, setRefreshing] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { error } = await supabase.functions.invoke("refresh-trends", { body: { lite: true } });
      if (error) throw error;
      toast.success("Тренды обновлены!");
      queryClient.invalidateQueries({ queryKey: ["trends"] });
    } catch (e: any) {
      toast.error("Ошибка обновления: " + (e.message || "Попробуйте позже"));
    } finally {
      setRefreshing(false);
    }
  };

  const { data: videos = [] } = useQuery({
    queryKey: ["trends", period, tab],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - period);

      if (tab === "all") {
        // 80% KZ, 20% world
        const kzLimit = 400;
        const worldLimit = 100;

        const [kzRes, worldRes] = await Promise.all([
          supabase
            .from("videos")
            .select("*")
            .eq("region", "kz")
            .gte("published_at", since.toISOString())
            .order("trend_score", { ascending: false })
            .limit(kzLimit),
          supabase
            .from("videos")
            .select("*")
            .eq("region", "world")
            .gte("published_at", since.toISOString())
            .order("trend_score", { ascending: false })
            .limit(worldLimit),
        ]);

        const kzVideos = (kzRes.data || []).map(v => ({ ...v, _region: "kz" as const }));
        const worldVideos = (worldRes.data || []).map(v => ({ ...v, _region: "world" as const }));

        // Interleave: every 5th is world
        const merged: any[] = [];
        let ki = 0, wi = 0;
        while (ki < kzVideos.length || wi < worldVideos.length) {
          for (let j = 0; j < 4 && ki < kzVideos.length; j++) {
            merged.push(kzVideos[ki++]);
          }
          if (wi < worldVideos.length) {
            merged.push(worldVideos[wi++]);
          }
        }
        return merged;
      } else {
        const { data } = await supabase
          .from("videos")
          .select("*")
          .eq("region", tab)
          .gte("published_at", since.toISOString())
          .order("trend_score", { ascending: false })
          .limit(500);
        return (data || []).map(v => ({ ...v, _region: tab }));
      }
    },
  });

  const { data: userFavorites = [] } = useQuery({
    queryKey: ["user-favorites", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("video_id")
        .eq("user_id", user!.id);
      return data?.map((f) => f.video_id) || [];
    },
    enabled: !!user,
  });

  const toggleFav = async (videoId: string) => {
    if (!user) return;
    const isFav = userFavorites.includes(videoId);
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("video_id", videoId);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, video_id: videoId });
    }
    queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
  };

  const tabs = [
    { key: "all" as const, label: "Все (80% KZ)" },
    { key: "kz" as const, label: "🇰🇿 Казахстан" },
    { key: "world" as const, label: "🌍 Мировые" },
  ];

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold text-foreground">Тренды 🔥</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Обновление..." : "Обновить"}
            </button>
          <div className="flex bg-card rounded-xl p-1 border border-border/50 card-shadow">
            {([7, 30] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  period === p
                    ? "gradient-hero text-primary-foreground glow-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p} дней
              </button>
            ))}
          </div>
          </div>
        </div>

        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                tab === t.key
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-card text-muted-foreground border-border/50 hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video: any, i: number) => {
              const fmt = (n: number) => {
                if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
                if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
                return String(n);
              };
              const score = video.trend_score || 0;
              const scoreColor = score > 10000 ? "text-red-500" : score > 1000 ? "text-orange-500" : "text-primary";
              const publishedDate = video.published_at ? new Date(video.published_at) : null;
              const timeAgo = publishedDate
                ? (() => {
                    const h = Math.floor((Date.now() - publishedDate.getTime()) / 3600000);
                    if (h < 1) return "только что";
                    if (h < 24) return `${h}ч назад`;
                    const d = Math.floor(h / 24);
                    return `${d}д назад`;
                  })()
                : "";

              return (
                <div
                  key={video.id}
                  className="group bg-card rounded-2xl border border-border/50 overflow-hidden card-shadow hover:shadow-xl hover:border-primary/20 transition-all duration-300 cursor-pointer relative flex flex-col"
                  style={{ animationDelay: `${i * 0.02}s` }}
                  onClick={() => window.open(video.url, "_blank")}
                >
                  {/* Cover — full TikTok ratio */}
                  <div className="relative aspect-[9/12] bg-muted overflow-hidden">
                    {video.cover_url ? (
                      <img
                        src={video.cover_url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="h-12 w-12 text-muted-foreground/20" />
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Region badge */}
                    {video._region === "kz" && (
                      <span className="absolute top-2.5 left-2.5 z-10 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm shadow-lg">
                        🇰🇿 KZ
                      </span>
                    )}
                    {video._region === "world" && (
                      <span className="absolute top-2.5 left-2.5 z-10 bg-accent text-accent-foreground text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm shadow-lg">
                        🌍 World
                      </span>
                    )}

                    {/* Trend score flame */}
                    <div className={`absolute top-2.5 right-2.5 z-10 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full ${scoreColor}`}>
                      <Flame className="h-3.5 w-3.5" />
                      <span className="text-[11px] font-bold">{score > 1000 ? fmt(score) : score.toFixed(0)}</span>
                    </div>

                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <Play className="h-7 w-7 text-white fill-white ml-1" />
                      </div>
                    </div>

                    {/* Bottom stats on cover */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                      <div className="flex items-center gap-3 text-white/90 text-[11px] font-medium">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />{fmt(Number(video.views))}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5" />{fmt(Number(video.likes))}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5" />{fmt(Number(video.comments))}
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="h-3.5 w-3.5" />{fmt(Number(video.shares || 0))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info section */}
                  <div className="p-3.5 flex flex-col gap-2 flex-1">
                    <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
                      {video.caption || "Без описания"}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {video.author_avatar_url && (
                          <img
                            src={video.author_avatar_url}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                          />
                        )}
                        <span className="text-xs text-primary font-semibold truncate">
                          @{video.author_username}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {timeAgo && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" />{timeAgo}
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFav(video.id); }}
                          className="hover:scale-125 transition-transform"
                        >
                          <Star
                            className={`h-4 w-4 transition-all ${
                              userFavorites.includes(video.id)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-muted-foreground/30 hover:text-yellow-400"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground font-medium">
              Нет трендовых видео. Начните поиск, чтобы собрать данные.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
