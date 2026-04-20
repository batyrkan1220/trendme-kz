import { AppLayout } from "@/components/layout/AppLayout";
import { Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { VideoCard, VideoCardData } from "@/components/VideoCard";
import { useNavigate } from "react-router-dom";
import { isNativePlatform } from "@/lib/native";
import { useLocalFavorites } from "@/hooks/useLocalFavorites";
import { ScriptOnlyDialog } from "@/components/ScriptOnlyDialog";

export default function Library() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [scriptVideo, setScriptVideo] = useState<VideoCardData | null>(null);
  const { favorites: localFavorites, toggleFavorite: toggleLocalFav } = useLocalFavorites();

  // Remote favorites (only on web)
  const { data: favorites = [], isLoading, error } = useQuery({
    queryKey: ["favorites-list", user?.id],
    queryFn: async () => {
      console.log("[Library] Fetching favorites for user:", user?.id);
      const { data, error } = await supabase.
      from("favorites").
      select("*, videos(*)").
      eq("user_id", user!.id).
      order("created_at", { ascending: false });
      console.log("[Library] Favorites result:", { data, error });
      if (error) {
        console.error("[Library] Favorites error:", error);
      }
      return data || [];
    },
    enabled: !!user && !isNativePlatform
  });

  // Local favorites video data (native only)
  const { data: localVideos = [] } = useQuery({
    queryKey: ["local-favorite-videos", localFavorites],
    queryFn: async () => {
      if (localFavorites.length === 0) return [];
      const { data } = await supabase.from("videos").select("*").in("id", localFavorites);
      return data || [];
    },
    enabled: isNativePlatform && localFavorites.length > 0
  });

  const displayFavorites = isNativePlatform 
    ? localVideos.map(video => ({ id: video.id, video_id: video.id, videos: video }))
    : favorites;

  console.log("[Library] Render state:", { userId: user?.id, favoritesCount: displayFavorites.length, isLoading, error, isNativePlatform });

  const favVideoIds = new Set(isNativePlatform ? localFavorites : favorites.map((f: any) => f.video_id));

  const removeFav = async (videoId: string) => {
    if (isNativePlatform) {
      toggleLocalFav(videoId);
      toast.success("Удалено из избранного");
      return;
    }
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

  const handleScript = (video: VideoCardData) => {
    setScriptVideo(video);
  };

  return (
    <AppLayout>
      <div
        className="p-4 md:p-6 lg:p-8 space-y-5 md:space-y-7 animate-fade-in"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px) + 16px, 16px)" }}
      >
        {/* Header — landing/trends style */}
        <div>
          <div className="eyebrow mb-1.5 text-[11px] md:text-[12px]">
            <Heart className="h-3 w-3 fill-current" />
            Избранное
          </div>
          <h1 className="text-[22px] md:text-[32px] leading-[1.1] font-semibold tracking-tight text-foreground">
            Сохранённые <span className="gradient-text">тренды</span>
          </h1>
          {displayFavorites.length > 0 && (
            <p className="mt-1.5 text-[12.5px] md:text-[13.5px] text-muted-foreground">
              <span className="tabular-nums font-semibold text-foreground">
                {displayFavorites.length}
              </span>{" "}
              видео в коллекции
            </p>
          )}
        </div>

        {displayFavorites.length === 0 ? (
          <div className="text-center py-20">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Heart className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <p className="text-lg font-medium text-foreground mb-1">Пока пусто</p>
            <p className="text-sm text-muted-foreground">Добавьте видео через поиск или тренды</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 md:gap-4 pb-20 md:pb-0">
            {displayFavorites.map((fav: any) => {
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
                duration: Number(video.duration_sec) || 0,
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
                  onScript={handleScript}
                  showTier={true}
                  showAuthor={true}
                  showAnalyzeButton={true}
                  showScriptButton={true}
                />
              );
            })}
          </div>
        )}
      </div>
      <ScriptOnlyDialog
        video={scriptVideo as any}
        open={!!scriptVideo}
        onOpenChange={(open) => { if (!open) setScriptVideo(null); }}
      />
    </AppLayout>
  );
}