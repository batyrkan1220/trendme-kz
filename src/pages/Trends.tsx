import { AppLayout } from "@/components/layout/AppLayout";
import { TrendingUp, Eye, Heart, MessageCircle, Star } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function Trends() {
  const [period, setPeriod] = useState<7 | 30>(7);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: videos = [] } = useQuery({
    queryKey: ["trends", period],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - period);
      const { data } = await supabase
        .from("videos")
        .select("*")
        .gte("fetched_at", since.toISOString())
        .order("trend_score", { ascending: false })
        .limit(50);
      return data || [];
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

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Тренды 🔥</h1>
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

        {videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {videos.map((video, i) => (
              <div
                key={video.id}
                className="bg-card rounded-2xl border border-border/50 overflow-hidden card-shadow hover-lift card-shadow-hover transition-all"
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                {video.cover_url && (
                  <img src={video.cover_url} alt="" className="w-full h-48 object-cover" />
                )}
                <div className="p-4 space-y-2">
                  <p className="text-sm font-medium text-foreground line-clamp-2">{video.caption || "Без описания"}</p>
                  <p className="text-xs text-primary font-semibold">@{video.author_username}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{Number(video.views).toLocaleString("ru-RU")}</span>
                    <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{Number(video.likes).toLocaleString("ru-RU")}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{Number(video.comments).toLocaleString("ru-RU")}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-xs font-bold gradient-text">
                      Score: {(video.trend_score || 0).toFixed(1)}
                    </span>
                    <button onClick={() => toggleFav(video.id)}>
                      <Star
                        className={`h-4 w-4 transition-all ${
                          userFavorites.includes(video.id)
                            ? "text-yellow-400 fill-yellow-400 scale-110"
                            : "text-muted-foreground/40 hover:text-yellow-400"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
