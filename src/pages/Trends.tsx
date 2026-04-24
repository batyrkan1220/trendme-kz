import { AppLayout } from "@/components/layout/AppLayout";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
import { TrendingUp, WifiOff, Instagram } from "lucide-react";
import { trackPlausible, trackAddToFavorites } from "@/components/TrackingPixels";
import { useOnlineStatus, saveTrendsCache, loadTrendsCache } from "@/hooks/useOfflineCache";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useIsFreePlan } from "@/hooks/useIsFreePlan";
import { MemoVideoCard, VideoCardData } from "@/components/VideoCard";
import { VideoAnalysisDialog } from "@/components/VideoAnalysisDialog";
import { ScriptOnlyDialog } from "@/components/ScriptOnlyDialog";
import { LockedVideoOverlay } from "@/components/trends/LockedVideoOverlay";

const FREE_TRENDS_VISIBLE = 5;

interface TrendVideo {
  id: string;
  shortcode: string | null;
  url: string;
  platform_video_id: string | null;
  author_username: string | null;
  full_name: string | null;
  profile_pic_url: string | null;
  author_avatar_url: string | null;
  is_verified: boolean | null;
  caption: string | null;
  thumbnail_url: string | null;
  cover_url: string | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  shares: number | null;
  posted_at: string | null;
  published_at: string | null;
  viral_score: number | null;
  duration_sec: number | null;
  velocity_views: number | null;
}

export default function Trends() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const { user } = useAuth();
  const { isFreePlan } = useIsFreePlan();

  const [playingId, setPlayingId] = useState<string | null>(null);
  const [analysisVideo, setAnalysisVideo] = useState<any>(null);
  const [scriptVideo, setScriptVideo] = useState<any>(null);

  useEffect(() => {
    trackPlausible("Trends Viewed");
  }, []);

  const { data: videos = [] } = useQuery<TrendVideo[]>({
    queryKey: ["ig-trends"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select(
          "id, shortcode, url, platform_video_id, author_username, full_name, profile_pic_url, author_avatar_url, is_verified, caption, thumbnail_url, cover_url, view_count, like_count, comment_count, shares, posted_at, published_at, viral_score, duration_sec, velocity_views",
        )
        .eq("source", "trends")
        .eq("platform", "instagram")
        .order("viral_score", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as TrendVideo[];
    },
    staleTime: 120_000,
    placeholderData: (prev) => prev,
    enabled: isOnline,
  });

  const cachedVideos = useMemo(
    () => (loadTrendsCache() ?? []) as unknown as TrendVideo[],
    [],
  );
  useEffect(() => {
    if (videos.length > 0) saveTrendsCache(videos as any);
  }, [videos]);

  const effectiveVideos = isOnline && videos.length > 0 ? videos : cachedVideos;

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

  const toggleFav = useCallback(async (videoId: string) => {
    if (!user) return;
    const isFav = userFavorites.includes(videoId);
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("video_id", videoId);
      trackPlausible("Favorite Removed", { source: "trends" });
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, video_id: videoId });
      trackAddToFavorites(videoId);
      trackPlausible("Favorite Added", { source: "trends" });
    }
    queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
    queryClient.invalidateQueries({ queryKey: ["favorites-count"] });
  }, [user, userFavorites, queryClient]);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["ig-trends"] });
    await new Promise((r) => setTimeout(r, 500));
  };
  const { containerRef, pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  return (
    <AppLayout>
      <div
        ref={containerRef}
        className="overflow-x-hidden overflow-y-auto h-full text-foreground bg-background"
      >
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
          progress={progress}
        />

        {!isOnline && (
          <div className="mx-4 md:mx-6 lg:mx-8 mt-4 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-amber-500 text-[12.5px]">
            <WifiOff className="h-3.5 w-3.5 shrink-0" />
            <span>Офлайн режим — кэшированные данные</span>
          </div>
        )}

        <div className="px-4 md:px-6 lg:px-8 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Тренды</h1>
          </div>
        </div>

        {effectiveVideos.length > 0 && (
          <div className="px-4 md:px-6 lg:px-8 pb-10">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 md:gap-4">
              {effectiveVideos.map((v, i) => {
                const cardData: VideoCardData = {
                  id: v.id,
                  platform_video_id: v.platform_video_id ?? v.shortcode ?? v.id,
                  url: v.url,
                  cover_url: v.cover_url ?? v.thumbnail_url ?? null,
                  caption: v.caption,
                  author_username: v.author_username,
                  profile_pic_url: v.profile_pic_url ?? null,
                  author_avatar_url: v.author_avatar_url ?? v.profile_pic_url ?? null,
                  views: Number(v.view_count) || 0,
                  likes: Number(v.like_count) || 0,
                  comments: Number(v.comment_count) || 0,
                  shares: 0,
                  velocity_views: Number(v.velocity_views) || 0,
                  published_at: v.published_at ?? v.posted_at,
                  duration: Number(v.duration_sec) || 0,
                };

                const isLocked = isFreePlan && i >= FREE_TRENDS_VISIBLE;

                return (
                  <div
                    key={v.id}
                    className={cn(
                      "relative",
                      isLocked && "group/lock cursor-pointer rounded-2xl transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-glow-viral"
                    )}
                    onClick={isLocked ? () => navigate("/subscription") : undefined}
                  >
                    <div className={isLocked ? "pointer-events-none select-none" : ""}>
                      <MemoVideoCard
                        video={cardData}
                        playingId={playingId}
                        onPlay={setPlayingId}
                        isFavorite={userFavorites.includes(v.id)}
                        onToggleFav={toggleFav}
                        onAnalyze={() => setAnalysisVideo(cardData)}
                        onScript={() => setScriptVideo(cardData)}
                        showTier={true}
                        showAuthor={false}
                        showAnalyzeButton={!isLocked}
                        showScriptButton={!isLocked}
                      />
                    </div>
                    {isLocked && <LockedVideoOverlay />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <VideoAnalysisDialog
        video={analysisVideo}
        open={!!analysisVideo}
        onOpenChange={(open) => { if (!open) setAnalysisVideo(null); }}
      />
      <ScriptOnlyDialog
        video={scriptVideo}
        open={!!scriptVideo}
        onOpenChange={(open) => { if (!open) setScriptVideo(null); }}
      />
    </AppLayout>
  );
}
