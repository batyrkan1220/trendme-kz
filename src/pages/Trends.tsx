import { AppLayout } from "@/components/layout/AppLayout";
import { trackAddToFavorites } from "@/components/TrackingPixels";
import { TrendingUp } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator";
import { NICHE_GROUPS } from "@/config/niches";
import { TREND_CATEGORIES, getNicheGroupsForCategory } from "@/config/trendCategories";
import { TrendNicheRow } from "@/components/trends/TrendNicheRow";
import { VirtualTrendGrid } from "@/components/trends/VirtualTrendGrid";
import { VideoAnalysisDialog } from "@/components/VideoAnalysisDialog";
import { useAuth } from "@/hooks/useAuth";
import { useTokens } from "@/hooks/useTokens";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import { VideoCard } from "@/components/VideoCard";


const PAGE_SIZE = 30;

export default function Trends() {
  const [activeCategory, setActiveCategory] = useState("for_you");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [analysisVideo, setAnalysisVideo] = useState<any>(null);
  const [drillNiche, setDrillNiche] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { user } = useAuth();
  const { balance } = useTokens();
  const queryClient = useQueryClient();
  const FREE_LIMIT = 5;

  const { data: userSub } = useQuery({
    queryKey: ["user-subscription", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_subscriptions")
        .select("*, plans(price_rub)")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const isFreePlan = !userSub || (userSub.plans as any)?.price_rub === 0;

  const { data: allVideos = [], isLoading } = useQuery<any[]>({
    queryKey: ["trends-all"],
    queryFn: async () => {
      const selectFields =
        "id,platform_video_id,url,caption,cover_url,author_username,author_avatar_url,views,likes,comments,shares,trend_score,velocity_views,published_at,region,niche,sub_niche,categories";
      const allRows: any[] = [];
      let from = 0;
      const pageSize = 1000;
      const since = new Date(Date.now() - 7 * 86400000).toISOString();

      while (true) {
        const { data: rows } = await supabase
          .from("videos")
          .select(selectFields)
          .gte("published_at", since)
          .order("trend_score", { ascending: false })
          .range(from, from + pageSize - 1);
        if (!rows || rows.length === 0) break;
        allRows.push(...rows);
        if (rows.length < pageSize) break;
        from += pageSize;
      }
      return allRows;
    },
    staleTime: 120_000,
    placeholderData: (prev) => prev,
  });

  const videosByNiche = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const v of allVideos) {
      const n = v.niche || "other";
      if (!map[n]) map[n] = [];
      map[n].push(v);
    }
    return map;
  }, [allVideos]);

  const { data: userFavorites = [] } = useQuery({
    queryKey: ["user-favorites", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("video_id").eq("user_id", user!.id);
      return data?.map((f) => f.video_id) || [];
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const toggleFav = useCallback(
    async (videoId: string) => {
      if (!user) return;
      const isFav = userFavorites.includes(videoId);
      if (isFav) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("video_id", videoId);
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, video_id: videoId });
        trackAddToFavorites(videoId);
      }
      queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
    },
    [user, userFavorites, queryClient]
  );

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["trends-all"] });
    await new Promise((r) => setTimeout(r, 500));
  }, [queryClient]);

  const { containerRef, pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  const categoryGroups = useMemo(
    () => getNicheGroupsForCategory(activeCategory),
    [activeCategory]
  );

  const drillVideos = useMemo(() => {
    if (!drillNiche) return [];
    return (videosByNiche[drillNiche] || []).slice(0, visibleCount);
  }, [drillNiche, videosByNiche, visibleCount]);

  const drillGroup = useMemo(
    () => NICHE_GROUPS.find((g) => g.key === drillNiche),
    [drillNiche]
  );

  const handleViewAll = (nicheKey: string) => {
    setDrillNiche(nicheKey);
    setVisibleCount(PAGE_SIZE);
  };

  const handleBack = () => {
    setDrillNiche(null);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <AppLayout>
      <div
        ref={containerRef}
        className="overflow-y-auto trends-dark-theme"
        style={{ height: "100dvh", background: "#0a0a0a", color: "#ffffff" }}
      >
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
          progress={progress}
        />

        <div className="space-y-4 pb-28">
          {/* Drill-down mode */}
          {drillNiche && drillGroup ? (
            <div className="p-4 md:p-6 lg:p-8 space-y-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBack}
                  className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-white" />
                </button>
                <h1 className="text-xl font-bold text-white">
                  {drillGroup.emoji} {drillGroup.label}
                </h1>
                <span className="text-xs text-white/50">
                  {videosByNiche[drillNiche]?.length || 0} видео
                </span>
              </div>
              <VirtualTrendGrid
                videos={drillVideos}
                playingId={playingId}
                onPlay={setPlayingId}
                userFavorites={userFavorites}
                onToggleFav={toggleFav}
                onAnalyze={(v) => setAnalysisVideo(v)}
                isFreePlan={isFreePlan}
                freeLimit={FREE_LIMIT}
                hasMore={(videosByNiche[drillNiche]?.length || 0) > visibleCount}
                onLoadMore={() => setVisibleCount((c) => c + PAGE_SIZE)}
                darkMode
              />
            </div>
          ) : (
            <>
              {/* Header — centered brand name */}
               <div className="relative pt-3 px-4 md:px-6 lg:px-8">
                <div className="flex items-center justify-center mb-3">
                  <h1
                    className="text-lg font-extrabold tracking-widest uppercase"
                    style={{
                      color: "hsl(var(--neon))",
                      textShadow: "0 0 20px hsl(var(--neon) / 0.3)",
                    }}
                  >
                    trendme
                  </h1>
                </div>

                {/* Category tabs */}
                <div className="flex items-center justify-center gap-5 overflow-x-auto scrollbar-hide">
                  {TREND_CATEGORIES.map((cat) => {
                    const active = activeCategory === cat.key;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => setActiveCategory(cat.key)}
                        className={cn(
                          "shrink-0 text-sm font-bold transition-all whitespace-nowrap pb-2 border-b-2",
                          active
                            ? "text-neon border-neon"
                            : "text-white border-transparent hover:text-white/70"
                        )}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <div className="px-4 md:px-6 lg:px-8 space-y-6">
                {isLoading ? (
                  <div className="space-y-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-5 bg-white/10 rounded w-32 animate-pulse" />
                        <div className="flex gap-3">
                          {Array.from({ length: 3 }).map((_, j) => (
                            <div
                              key={j}
                              className="shrink-0 rounded-2xl overflow-hidden animate-pulse"
                              style={{ width: "min(44vw, 200px)", background: "#1a1a1a" }}
                            >
                              <div className="aspect-[9/14] bg-white/5 m-1.5 rounded-xl" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {/* "Для тебя" → top trending row */}
                    {activeCategory === "for_you" && allVideos.length > 0 && (
                      <section className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-bold text-white">В тренде 🔥</h2>
                          <span className="text-sm font-semibold text-neon">Все</span>
                        </div>
                        <div
                          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
                          style={{ WebkitOverflowScrolling: "touch" }}
                        >
                          {allVideos.slice(0, 10).map((video) => (
                            <div
                              key={video.id}
                              className="snap-start shrink-0"
                              style={{ width: "min(38vw, 172px)" }}
                            >
                              <VideoCard
                                video={video}
                                playingId={playingId}
                                onPlay={setPlayingId}
                                isFavorite={userFavorites.includes(video.id)}
                                onToggleFav={toggleFav}
                                onAnalyze={(v) => setAnalysisVideo(v)}
                                showTier={true}
                                showAuthor={false}
                                darkMode
                              />
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {categoryGroups.map((group) => (
                      <TrendNicheRow
                        key={group.key}
                        group={group}
                        videos={videosByNiche[group.key] || []}
                        userFavorites={userFavorites}
                        onToggleFav={toggleFav}
                        onAnalyze={(v) => setAnalysisVideo(v)}
                        playingId={playingId}
                        onPlay={setPlayingId}
                        onViewAll={handleViewAll}
                        darkMode
                      />
                    ))}

                    {categoryGroups.every((g) => !(videosByNiche[g.key]?.length)) &&
                      activeCategory !== "for_you" && (
                        <div className="text-center py-20">
                          <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="h-10 w-10 text-white/20" />
                          </div>
                          <p className="text-white/50 font-medium">
                            Нет трендовых видео в этой категории
                          </p>
                        </div>
                      )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <VideoAnalysisDialog
        video={analysisVideo}
        open={!!analysisVideo}
        onOpenChange={(open) => {
          if (!open) setAnalysisVideo(null);
        }}
      />
    </AppLayout>
  );
}
