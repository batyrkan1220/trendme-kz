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
          <h1 className="text-2xl font-bold text-foreground">Тренды</h1>
          <div className="flex bg-secondary rounded-lg p-1 border border-border">
            {([7, 30] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  period === p
                    ? "gradient-hero text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p} дней
              </button>
            ))}
          </div>
        </div>

        {videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 transition-colors"
              >
                {video.cover_url && (
                  <img src={video.cover_url} alt="" className="w-full h-48 object-cover" />
                )}
                <div className="p-4 space-y-2">
                  <p className="text-sm text-foreground line-clamp-2">{video.caption || "Без описания"}</p>
                  <p className="text-xs text-muted-foreground">@{video.author_username}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{Number(video.views).toLocaleString("ru-RU")}</span>
                    <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{Number(video.likes).toLocaleString("ru-RU")}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{Number(video.comments).toLocaleString("ru-RU")}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-medium text-primary">
                      Score: {(video.trend_score || 0).toFixed(1)}
                    </span>
                    <button onClick={() => toggleFav(video.id)}>
                      <Star
                        className={`h-4 w-4 ${
                          userFavorites.includes(video.id)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-muted-foreground hover:text-yellow-400"
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
            <TrendingUp className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">
              Нет трендовых видео. Начните поиск, чтобы собрать данные.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
