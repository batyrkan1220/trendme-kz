import { AppLayout } from "@/components/layout/AppLayout";
import { Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { VideoCard, VideoCardData } from "@/components/VideoCard";
import { useNavigate } from "react-router-dom";

export default function Library() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [playingId, setPlayingId] = useState<string | null>(null);

  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites-list", user?.id],
    queryFn: async () => {
      const { data } = await supabase.
      from("favorites").
      select("*, videos(*)").
      eq("user_id", user!.id).
      order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user
  });

  const favVideoIds = new Set(favorites.map((f: any) => f.video_id));

  const removeFav = async (videoId: string) => {
    const fav = favorites.find((f: any) => f.video_id === videoId);
    if (!fav) return;
    await supabase.from("favorites").delete().eq("id", fav.id);
    queryClient.invalidateQueries({ queryKey: ["favorites-list"] });
    queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
    queryClient.invalidateQueries({ queryKey: ["favorites-count"] });
    toast.success("Удалено из избранного");
  };

  const handleAnalyze = (video: VideoCardData) => {
    navigate(`/video-analysis?url=${encodeURIComponent(video.url)}`);
  };

  return (
    <AppLayout>
      <div className="p-3 md:p-6 lg:p-8 space-y-4 md:space-y-6 animate-fade-in pb-16 md:pb-8" style={{ paddingTop: "max(env(safe-area-inset-top, 0px) + 12px, 12px)" }}>
        <div className="flex items-center justify-between">
          
        </div>

        {favorites.length === 0 ?
        <div className="text-center py-20">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Heart className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <p className="text-lg font-medium text-foreground mb-1">Пока пусто</p>
            <p className="text-sm text-muted-foreground">Добавьте видео через поиск или тренды</p>
          </div> :

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 md:gap-4 pb-20 md:pb-0">
            {favorites.map((fav: any) => {
            const video = fav.videos;
            if (!video) return null;

            const cardData: VideoCardData = {
              id: video.id,
              platform_video_id: video.platform_video_id,
              url: video.url,
              cover_url: video.cover_url,
              caption: video.caption,
              author_username: video.author_username,
              author_avatar_url: video.author_avatar_url,
              views: Number(video.views) || 0,
              likes: Number(video.likes) || 0,
              comments: Number(video.comments) || 0,
              shares: Number(video.shares) || 0,
              velocity_views: Number(video.velocity_views) || 0,
              published_at: video.published_at,
              duration: Number(video.duration_sec) || 0
            };

            return (
              <VideoCard
                key={fav.id}
                video={cardData}
                playingId={playingId}
                onPlay={setPlayingId}
                isFavorite={favVideoIds.has(video.id)}
                onToggleFav={removeFav}
                onAnalyze={handleAnalyze}
                showTier={true}
                showAuthor={true}
                showAnalyzeButton={true}
                darkMode />);


          })}
          </div>
        }
      </div>
    </AppLayout>);

}