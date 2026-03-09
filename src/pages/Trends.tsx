import { AppLayout } from "@/components/layout/AppLayout";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { isNativePlatform } from "@/lib/native";
import { useNavigate } from "react-router-dom";
import { useLocalFavorites } from "@/hooks/useLocalFavorites";

import { trackAddToFavorites } from "@/components/TrackingPixels";
import { TrendingUp } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator";
import { NICHE_GROUPS } from "@/config/niches";
import { TREND_CATEGORIES } from "@/config/trendCategories";
import { LazyNicheRow } from "@/components/trends/LazyNicheRow";
import { VirtualTrendGrid } from "@/components/trends/VirtualTrendGrid";

import { useAuth } from "@/hooks/useAuth";
import { useTokens } from "@/hooks/useTokens";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";



const PAGE_SIZE = 30;

export default function Trends() {
  // removed activeCategory state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [drillNiche, setDrillNiche] = useState<string | null>(null);
  const [drillSubNiche, setDrillSubNiche] = useState<string | null>(null);
  const [drillPeriod, setDrillPeriod] = useState<number>(7);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { user } = useAuth();
  const { balance } = useTokens();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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

  const isFreePlan = isNativePlatform ? false : (!userSub || (userSub.plans as any)?.price_rub === 0);

  const { data: allVideos = [], isLoading } = useQuery<any[]>({
    queryKey: ["trends-all"],
    queryFn: async () => {
      const selectFields =
        "id,platform_video_id,url,caption,cover_url,author_username,author_avatar_url,views,likes,comments,shares,trend_score,velocity_views,published_at,region,niche,sub_niche,categories";
      const since = new Date(Date.now() - 7 * 86400000).toISOString();

      const { data: rows } = await supabase
        .from("videos")
        .select(selectFields)
        .gte("published_at", since)
        .order("trend_score", { ascending: false })
        .range(0, 999);
      return rows || [];
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

  const { favorites: localFavorites, toggleFavorite: toggleLocalFav } = useLocalFavorites();

  const { data: remoteFavorites = [] } = useQuery({
    queryKey: ["user-favorites", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("video_id").eq("user_id", user!.id);
      return data?.map((f) => f.video_id) || [];
    },
    enabled: !!user && !isNativePlatform,
    staleTime: 30_000,
  });

  const userFavorites = isNativePlatform ? localFavorites : remoteFavorites;

  const toggleFav = useCallback(
    async (videoId: string) => {
      if (isNativePlatform) {
        toggleLocalFav(videoId);
        return;
      }

      if (!user) {
        console.warn("[Trends] toggleFav: No user, redirecting to auth");
        navigate("/auth");
        return;
      }
      console.log("[Trends] toggleFav called:", { userId: user.id, videoId });
      const isFav = userFavorites.includes(videoId);

      // Optimistic update — UI жедел жаңартылады
      queryClient.setQueryData(
        ["user-favorites", user.id],
        isFav ? userFavorites.filter((id: string) => id !== videoId) : [...userFavorites, videoId]
      );

      try {
        if (isFav) {
          const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("video_id", videoId);
          console.log("[Trends] Delete favorite result:", { error });
        } else {
          const { data, error } = await supabase.from("favorites").insert({ user_id: user.id, video_id: videoId }).select();
          console.log("[Trends] Insert favorite result:", { data, error });
          if (!error) trackAddToFavorites(videoId);
        }
      } catch (err) {
        console.error("[Trends] toggleFav error:", err);
      }
      queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
    },
    [user, userFavorites, queryClient, isNativePlatform, toggleLocalFav]
  );

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["trends-all"] });
    await new Promise((r) => setTimeout(r, 500));
  }, [queryClient]);

  const { containerRef, pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  // Show all niches in one list
  const allGroups = NICHE_GROUPS;

  // Fetch full niche data only when drilling down
  const { data: drillNicheVideos = [] } = useQuery<any[]>({
    queryKey: ["trends-niche", drillNiche, drillPeriod],
    queryFn: async () => {
      if (!drillNiche) return [];
      const selectFields =
        "id,platform_video_id,url,caption,cover_url,author_username,author_avatar_url,views,likes,comments,shares,trend_score,velocity_views,published_at,region,niche,sub_niche,categories";
      const since = new Date(Date.now() - drillPeriod * 86400000).toISOString();
      const allRows: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data: rows } = await supabase
          .from("videos")
          .select(selectFields)
          .eq("niche", drillNiche)
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
    enabled: !!drillNiche,
    staleTime: 120_000,
  });

  const drillVideosFiltered = useMemo(() => {
    if (!drillNiche) return [];
    let vids = drillNicheVideos;
    if (drillSubNiche) {
      vids = vids.filter((v: any) => v.sub_niche === drillSubNiche);
    }
    return vids.slice(0, visibleCount);
  }, [drillNiche, drillNicheVideos, drillSubNiche, visibleCount]);

  const drillTotalFiltered = useMemo(() => {
    if (!drillNiche) return 0;
    if (drillSubNiche) return drillNicheVideos.filter((v: any) => v.sub_niche === drillSubNiche).length;
    return drillNicheVideos.length;
  }, [drillNiche, drillNicheVideos, drillSubNiche]);

  const drillGroup = useMemo(
    () => NICHE_GROUPS.find((g) => g.key === drillNiche),
    [drillNiche]
  );

  const PERIOD_OPTIONS = [
    { value: 3, label: "3 дня" },
    { value: 7, label: "7 дней" },
    { value: 30, label: "30 дней" },
  ];

  const handleViewAll = (nicheKey: string) => {
    setDrillNiche(nicheKey);
    setDrillSubNiche(null);
    setVisibleCount(PAGE_SIZE);
  };

  const handleBack = () => {
    setDrillNiche(null);
    setVisibleCount(PAGE_SIZE);
  };

  const { swipeProps: drillSwipeProps, swipeStyle: drillSwipeStyle, showIndicator: drillShowIndicator, indicatorProgress: drillIndicatorProgress } = useSwipeBack({
    onBack: handleBack,
    disabled: !drillNiche,
  });

  return (
    <AppLayout>
      <div
        ref={containerRef}
        className="overflow-x-hidden overflow-y-auto h-full trends-dark-theme relative pb-16 md:pb-8"
        style={{ background: "#0a0a0a", color: "#ffffff", overscrollBehavior: "none", paddingTop: drillNiche ? "0px" : "12px" }}
      >
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
          progress={progress}
        />

        <div className="space-y-4 pb-4">
          {/* Drill-down mode */}
          {drillNiche && drillGroup ? (
            <>
              {/* Sticky header with back + title */}
              <div
                className="sticky top-0 z-30 pb-2 px-4 backdrop-blur-md space-y-3"
                style={{ 
                  background: "rgba(10,10,10,0.85)", 
                  paddingTop: "8px"
                }}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBack}
                    className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors shrink-0"
                  >
                    <ChevronLeft className="h-4 w-4 text-white" />
                  </button>
                  <h1 className="text-lg font-bold text-white truncate">
                    {drillGroup.emoji} {drillGroup.label}
                  </h1>
                </div>

                {/* Period chips + video count */}
                <div className="flex items-center gap-2 text-xs">
                  {PERIOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setDrillPeriod(opt.value); setVisibleCount(PAGE_SIZE); }}
                      className={cn(
                        "shrink-0 px-2.5 py-1 rounded-full font-medium transition-all",
                        drillPeriod === opt.value
                          ? "bg-white/20 text-white"
                          : "bg-white/5 text-white/40 hover:bg-white/10"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <span className="text-white/40 ml-1">· {drillTotalFiltered} видео</span>
                </div>

                {/* Sub-niche chips */}
                {drillGroup.subNiches.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                    <button
                      onClick={() => { setDrillSubNiche(null); setVisibleCount(PAGE_SIZE); }}
                      className={cn(
                        "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        !drillSubNiche
                          ? "bg-neon text-black"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      )}
                    >
                      Все
                    </button>
                    {drillGroup.subNiches.map((sub) => (
                      <button
                        key={sub.key}
                        onClick={() => { setDrillSubNiche(sub.key === drillSubNiche ? null : sub.key); setVisibleCount(PAGE_SIZE); }}
                        className={cn(
                          "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                          drillSubNiche === sub.key
                            ? "bg-neon text-black"
                            : "bg-white/10 text-white/70 hover:bg-white/20"
                        )}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 md:p-6 lg:p-8">
                <VirtualTrendGrid
                  videos={drillVideosFiltered}
                  playingId={playingId}
                  onPlay={setPlayingId}
                  userFavorites={userFavorites}
                  onToggleFav={toggleFav}
                  onAnalyze={(v) => navigate(`/video-analysis?url=${encodeURIComponent(v.url)}`)}
                  isFreePlan={isFreePlan}
                  freeLimit={FREE_LIMIT}
                  hasMore={drillTotalFiltered > visibleCount}
                  onLoadMore={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  darkMode
                />
              </div>
            </>
          ) : (
            <>

              {/* Content below hero */}
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
                    {allGroups.map((group) => (
                      <LazyNicheRow
                        key={group.key}
                        group={group}
                        videos={videosByNiche[group.key] || []}
                        userFavorites={userFavorites}
                        onToggleFav={toggleFav}
                        onAnalyze={(v) => navigate(`/video-analysis?url=${encodeURIComponent(v.url)}`)}
                        playingId={playingId}
                        onPlay={setPlayingId}
                        onViewAll={handleViewAll}
                        darkMode
                      />
                    ))}

                    {allGroups.every((g) => !(videosByNiche[g.key]?.length)) && (
                      <div className="text-center py-20">
                        <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                          <TrendingUp className="h-10 w-10 text-white/20" />
                        </div>
                        <p className="text-white/50 font-medium">
                          Нет трендовых видео
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

    </AppLayout>
  );
}
