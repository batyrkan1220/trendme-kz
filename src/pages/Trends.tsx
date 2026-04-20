import { AppLayout } from "@/components/layout/AppLayout";
import { isNativePlatform } from "@/lib/native";
import { useNavigate } from "react-router-dom";
import { useLocalFavorites } from "@/hooks/useLocalFavorites";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import { trackAddToFavorites } from "@/components/TrackingPixels";
import { TrendingUp, WifiOff, ChevronLeft } from "lucide-react";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import {
  useOnlineStatus,
  saveTrendsCache,
  loadTrendsCache,
} from "@/hooks/useOfflineCache";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator";
import { NICHE_GROUPS } from "@/config/niches";
import { LazyNicheRow } from "@/components/trends/LazyNicheRow";
import { VirtualTrendGrid } from "@/components/trends/VirtualTrendGrid";
import { VideoAnalysisDialog } from "@/components/VideoAnalysisDialog";
import { ScriptOnlyDialog } from "@/components/ScriptOnlyDialog";
import { useAuth } from "@/hooks/useAuth";
import { useTokens } from "@/hooks/useTokens";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

/**
 * /trends — simplified Light Premium page.
 *
 * Structure (top → bottom):
 *   1. Header row     : title + period switcher (single line on desktop)
 *   2. Inline stats   : "N видео · M вирусных · K ниш"  (no KPI card grid)
 *   3. Niche filter   : pill chips (horizontal scroll)
 *   4. Niche rows     : LazyNicheRow per group
 *
 * Drill-down: sticky clean header + sub-niche chips + grid.
 */

const PAGE_SIZE = 30;
const EMPTY_ARR: any[] = [];
const FREE_LIMIT = 5;

const PERIOD_OPTIONS = [
  { value: 3, label: "3 дня" },
  { value: 7, label: "7 дней" },
  { value: 14, label: "14 дней" },
];
const HEADER_PERIODS = [
  { value: 1, label: "24ч" },
  { value: 7, label: "7д" },
  { value: 30, label: "30д" },
];

export default function Trends() {
  /* ======================= state ======================= */
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [analysisVideo, setAnalysisVideo] = useState<any>(null);
  const [scriptVideo, setScriptVideo] = useState<any>(null);
  const [drillNiche, setDrillNiche] = useState<string | null>(null);
  const [drillSubNiche, setDrillSubNiche] = useState<string | null>(null);
  const [drillPeriod, setDrillPeriod] = useState<number>(7);
  const [headerPeriod, setHeaderPeriod] = useState<number>(1);
  const [activeNicheFilter, setActiveNicheFilter] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const chipScrollRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const { balance } = useTokens();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const { isBlocked } = useBlockedUsers();

  /* ======================= subscription ======================= */
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
  const isFreePlan = isNativePlatform
    ? false
    : !userSub || (userSub.plans as any)?.price_rub === 0;

  /* ======================= all videos ======================= */
  const { data: allVideos = [], isLoading } = useQuery<any[]>({
    queryKey: ["trends-all"],
    queryFn: async () => {
      const selectFields =
        "id,platform_video_id,url,caption,cover_url,author_username,author_avatar_url,views,likes,comments,shares,trend_score,velocity_views,published_at,region,niche,sub_niche,categories";
      const since = new Date(Date.now() - 2 * 86400000).toISOString();
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
    enabled: isOnline,
  });

  /* ======================= offline cache ======================= */
  const cachedVideos = useMemo(() => loadTrendsCache(), []);
  useEffect(() => {
    if (allVideos.length > 0) saveTrendsCache(allVideos);
  }, [allVideos]);
  const effectiveVideosRaw =
    isOnline && allVideos.length > 0 ? allVideos : cachedVideos || allVideos;
  const effectiveVideos = useMemo(
    () => effectiveVideosRaw.filter((v: any) => !isBlocked(v.author_username)),
    [effectiveVideosRaw, isBlocked]
  );

  /* ======================= group by niche ======================= */
  const videosByNiche = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const v of effectiveVideos) {
      const n = v.niche || "other";
      if (!map[n]) map[n] = [];
      map[n].push(v);
    }
    return map;
  }, [effectiveVideos]);

  /* ======================= favorites ======================= */
  const { favorites: localFavorites, toggleFavorite: toggleLocalFav } =
    useLocalFavorites();
  const { data: remoteFavorites = [] } = useQuery({
    queryKey: ["user-favorites", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("video_id")
        .eq("user_id", user!.id);
      return data?.map((f) => f.video_id) || [];
    },
    enabled: !!user && !isNativePlatform,
    staleTime: 30_000,
  });
  const userFavorites = isNativePlatform ? localFavorites : remoteFavorites;

  const toggleFav = useCallback(
    async (videoId: string) => {
      hapticLight();
      if (isNativePlatform) {
        toggleLocalFav(videoId);
        return;
      }
      if (!user) {
        navigate("/auth");
        return;
      }
      const isFav = userFavorites.includes(videoId);
      queryClient.setQueryData(
        ["user-favorites", user.id],
        isFav
          ? userFavorites.filter((id: string) => id !== videoId)
          : [...userFavorites, videoId]
      );
      try {
        if (isFav) {
          await supabase
            .from("favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("video_id", videoId);
        } else {
          const { error } = await supabase
            .from("favorites")
            .insert({ user_id: user.id, video_id: videoId })
            .select();
          if (!error) trackAddToFavorites(videoId);
        }
      } catch (err) {
        console.error(err);
      }
      queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
    },
    [user, userFavorites, queryClient, toggleLocalFav, navigate]
  );

  /* ======================= pull to refresh ======================= */
  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["trends-all"] });
    await new Promise((r) => setTimeout(r, 500));
  }, [queryClient]);
  const { containerRef, pullDistance, isRefreshing, progress } =
    usePullToRefresh({ onRefresh: handleRefresh });

  const openAnalysis = useCallback((v: any) => setAnalysisVideo(v), []);
  const openScript = useCallback((v: any) => setScriptVideo(v), []);
  const allGroups = NICHE_GROUPS;

  /* ======================= drill-down ======================= */
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
    let vids = drillNicheVideos.filter((v: any) => !isBlocked(v.author_username));
    if (drillSubNiche) vids = vids.filter((v: any) => v.sub_niche === drillSubNiche);
    return vids.slice(0, visibleCount);
  }, [drillNiche, drillNicheVideos, drillSubNiche, visibleCount, isBlocked]);

  const drillTotalFiltered = useMemo(() => {
    if (!drillNiche) return 0;
    if (drillSubNiche)
      return drillNicheVideos.filter((v: any) => v.sub_niche === drillSubNiche).length;
    return drillNicheVideos.length;
  }, [drillNiche, drillNicheVideos, drillSubNiche]);

  const drillGroup = useMemo(
    () => NICHE_GROUPS.find((g) => g.key === drillNiche),
    [drillNiche]
  );

  /* ======================= inline stats (replaces KPI grid) ======================= */
  const inlineStats = useMemo(() => {
    const since = Date.now() - headerPeriod * 86400000;
    const inWindow = effectiveVideos.filter(
      (v) => v.published_at && new Date(v.published_at).getTime() >= since
    );
    const totalVideos = inWindow.length;
    const viralCount = inWindow.filter((v) => (v.trend_score || 0) >= 70).length;
    const activeNiches = new Set(inWindow.map((v) => v.niche).filter(Boolean)).size;
    return { totalVideos, viralCount, activeNiches };
  }, [effectiveVideos, headerPeriod]);

  const formatNum = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  };

  const filteredGroups = useMemo(
    () =>
      activeNicheFilter ? allGroups.filter((g) => g.key === activeNicheFilter) : allGroups,
    [allGroups, activeNicheFilter]
  );

  const handleViewAll = useCallback((nicheKey: string, subNicheKey?: string) => {
    setDrillNiche(nicheKey);
    setDrillSubNiche(subNicheKey || null);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleBack = useCallback(() => {
    setDrillNiche(null);
    setVisibleCount(PAGE_SIZE);
  }, []);

  /* ======================= swipe between sub-niches ======================= */
  const swipeRef = useRef<{ startX: number; startY: number } | null>(null);
  const subNicheKeys = useMemo(() => {
    if (!drillGroup) return [];
    return [null, ...drillGroup.subNiches.map((s) => s.key)];
  }, [drillGroup]);

  const handleSwipeStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    swipeRef.current = { startX: t.clientX, startY: t.clientY };
  }, []);

  const handleSwipeEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!swipeRef.current || subNicheKeys.length <= 1) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - swipeRef.current.startX;
      const dy = t.clientY - swipeRef.current.startY;
      swipeRef.current = null;
      if (Math.abs(dx) < 80 || Math.abs(dy) > Math.abs(dx) * 0.7) return;
      const currentIdx = subNicheKeys.indexOf(drillSubNiche);
      let nextIdx: number;
      if (dx < 0) {
        nextIdx = currentIdx + 1 >= subNicheKeys.length ? 0 : currentIdx + 1;
        setSlideDir("left");
      } else {
        nextIdx = currentIdx - 1 < 0 ? subNicheKeys.length - 1 : currentIdx - 1;
        setSlideDir("right");
      }
      setDrillSubNiche(subNicheKeys[nextIdx]);
      setVisibleCount(PAGE_SIZE);
      hapticMedium();
      setTimeout(() => setSlideDir(null), 300);
      setTimeout(() => {
        const el = chipScrollRef.current?.querySelector(
          '[data-active="true"]'
        ) as HTMLElement;
        el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }, 50);
    },
    [drillSubNiche, subNicheKeys]
  );

  /* ======================= shared styles (lux) ======================= */
  // Glass chips — compact on mobile, lux on desktop
  const chipBase =
    "shrink-0 inline-flex items-center gap-1.5 px-3 h-7 md:h-8 rounded-full text-[12px] md:text-[12.5px] font-medium transition-all whitespace-nowrap border";
  const chipInactive =
    "bg-card/70 md:bg-white/60 md:backdrop-blur-md border-border/60 text-foreground/65 hover:bg-white hover:text-foreground hover:border-border-strong/70";
  const chipActive =
    "bg-viral text-viral-foreground border-transparent shadow-glow-viral";

  // Segmented control button (period switcher)
  const segBase =
    "px-3 md:px-3.5 h-7 rounded-md text-[12px] font-semibold transition-all";
  const segActive = "bg-white text-foreground shadow-soft";
  const segInactive = "text-foreground/55 hover:text-foreground";

  /* ======================= render ======================= */
  return (
    <AppLayout>
      <div
        ref={containerRef}
        className="overflow-x-hidden overflow-y-auto h-full text-foreground relative bg-background md:[background-image:var(--gradient-mesh)]"
      >
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
          progress={progress}
        />

        {/* Offline banner */}
        {!isOnline && (
          <div className="mx-4 md:mx-6 lg:mx-8 mt-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 flex items-center gap-2 text-amber-700 text-[12.5px]">
            <WifiOff className="h-3.5 w-3.5 shrink-0" />
            <span>Офлайн режим — кэштелген деректер көрсетілуде</span>
          </div>
        )}

        <div className="pb-10">
          {/* =================== DRILL-DOWN =================== */}
          {drillNiche && drillGroup ? (
            <>
              {/* Sticky drill header */}
              <div
                className="sticky top-0 z-30 px-4 md:px-6 lg:px-8 pb-3 border-b border-border/60"
                style={{
                  paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
                  background: "hsl(var(--background) / 0.85)",
                  backdropFilter: "blur(20px) saturate(1.2)",
                  WebkitBackdropFilter: "blur(20px) saturate(1.2)",
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={handleBack}
                    className="h-8 w-8 rounded-full border border-border bg-background hover:bg-foreground/[0.04] flex items-center justify-center transition-colors active:scale-95 shrink-0"
                    aria-label="Назад"
                  >
                    <ChevronLeft className="h-4 w-4 text-foreground/70" strokeWidth={2} />
                  </button>
                  <h1 className="text-[18px] md:text-[20px] font-semibold text-foreground truncate tracking-tight">
                    {drillGroup.emoji} {drillGroup.label}
                  </h1>
                  <span className="text-[12.5px] text-foreground/50 tabular-nums ml-auto">
                    {drillTotalFiltered} видео
                  </span>
                </div>

                {/* Period chips */}
                <div className="flex items-center gap-1 mb-2">
                  {PERIOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setDrillPeriod(opt.value);
                        setVisibleCount(PAGE_SIZE);
                        hapticLight();
                      }}
                      className={cn(
                        chipBase,
                        drillPeriod === opt.value ? chipActive : chipInactive
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Sub-niche chips */}
                {drillGroup.subNiches.length > 0 && (
                  <div
                    ref={chipScrollRef}
                    className="flex items-center gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1"
                  >
                    <button
                      data-active={!drillSubNiche ? "true" : undefined}
                      onClick={() => {
                        setDrillSubNiche(null);
                        setVisibleCount(PAGE_SIZE);
                        hapticLight();
                      }}
                      className={cn(chipBase, !drillSubNiche ? chipActive : chipInactive)}
                    >
                      Все
                    </button>
                    {drillGroup.subNiches.map((sub) => {
                      const count = drillNicheVideos.filter(
                        (v: any) => v.sub_niche === sub.key
                      ).length;
                      const active = drillSubNiche === sub.key;
                      return (
                        <button
                          key={sub.key}
                          data-active={active ? "true" : undefined}
                          onClick={() => {
                            setDrillSubNiche(active ? null : sub.key);
                            setVisibleCount(PAGE_SIZE);
                            hapticLight();
                          }}
                          className={cn(chipBase, active ? chipActive : chipInactive)}
                        >
                          <span>{sub.label}</span>
                          {count > 0 && (
                            <span
                              className={cn(
                                "text-[10.5px] font-semibold tabular-nums",
                                active ? "text-background/70" : "text-foreground/40"
                              )}
                            >
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Drill grid */}
              <div
                key={drillSubNiche ?? "__all"}
                className={cn(
                  "p-4 md:p-6 lg:p-8",
                  slideDir === "left" && "animate-slide-in-from-right",
                  slideDir === "right" && "animate-slide-in-from-left"
                )}
                onTouchStart={handleSwipeStart}
                onTouchEnd={handleSwipeEnd}
              >
                <VirtualTrendGrid
                  videos={drillVideosFiltered}
                  playingId={playingId}
                  onPlay={setPlayingId}
                  userFavorites={userFavorites}
                  onToggleFav={toggleFav}
                  onAnalyze={openAnalysis}
                  onScript={openScript}
                  isFreePlan={isFreePlan}
                  freeLimit={FREE_LIMIT}
                  hasMore={drillTotalFiltered > visibleCount}
                  onLoadMore={() => setVisibleCount((c) => c + PAGE_SIZE)}
                />
              </div>
            </>
          ) : (
            <>
              {/* =================== MAIN VIEW =================== */}

              {/* Header — compact on mobile, lux on desktop */}
              <div
                className="px-4 md:px-6 lg:px-8 pt-4 md:pt-8"
                style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
              >
                <div className="eyebrow mb-1.5 text-[11px] md:text-[12px]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                  </span>
                  Live trends
                </div>

                <div className="flex items-center md:items-end justify-between gap-3 md:gap-4 flex-wrap">
                  <div className="min-w-0">
                    <h1 className="text-[22px] md:text-[40px] leading-[1.1] md:leading-[1.05] font-semibold tracking-tight text-foreground">
                      Что взрывается{" "}
                      <span className="text-foreground">сейчас</span>
                    </h1>
                  </div>

                  {/* Period segmented control */}
                  <div className="inline-flex items-center gap-0.5 p-0.5 md:p-1 rounded-lg md:rounded-xl bg-background-muted md:glass md:shadow-soft">
                    {HEADER_PERIODS.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => {
                          setHeaderPeriod(p.value);
                          hapticLight();
                        }}
                        className={cn(
                          segBase,
                          headerPeriod === p.value ? segActive : segInactive
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Inline stats */}
                <p className="mt-2 md:mt-3 text-[12.5px] md:text-[13.5px] text-muted-foreground">
                  <span className="tabular-nums font-semibold text-foreground">
                    {formatNum(inlineStats.totalVideos)}
                  </span>{" "}
                  видео
                  <span className="mx-1.5 md:mx-2 text-foreground/20">·</span>
                  <span className="tabular-nums font-semibold text-foreground">
                    {formatNum(inlineStats.viralCount)}
                  </span>{" "}
                  вирусных
                  <span className="mx-1.5 md:mx-2 text-foreground/20">·</span>
                  <span className="tabular-nums font-semibold text-foreground">
                    {inlineStats.activeNiches}
                  </span>{" "}
                  ниш
                </p>

                {/* Niche filter chips */}
                <div className="mt-5 flex items-center gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
                  <button
                    onClick={() => {
                      setActiveNicheFilter(null);
                      hapticLight();
                    }}
                    className={cn(chipBase, !activeNicheFilter ? chipActive : chipInactive)}
                  >
                    Все
                  </button>
                  {allGroups.map((g) => {
                    const count = (videosByNiche[g.key] || []).length;
                    const active = activeNicheFilter === g.key;
                    return (
                      <button
                        key={g.key}
                        onClick={() => {
                          setActiveNicheFilter(active ? null : g.key);
                          hapticLight();
                        }}
                        className={cn(chipBase, active ? chipActive : chipInactive)}
                      >
                        <span>{g.emoji}</span>
                        <span>{g.label}</span>
                        {count > 0 && (
                          <span
                            className={cn(
                              "text-[10.5px] font-semibold tabular-nums",
                              active ? "text-background/70" : "text-foreground/40"
                            )}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Separator — subtle */}
              <div className="mx-4 md:mx-6 lg:mx-8 mt-4 md:mt-6 border-t border-border/60" />

              {/* Niche rows */}
              <div className="px-4 md:px-6 lg:px-8 mt-4 md:mt-6 space-y-6 md:space-y-10">
                {isLoading ? (
                  <div className="space-y-8">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-3">
                        <div className="h-4 bg-background-muted rounded w-28 animate-pulse" />
                        <div className="flex gap-3">
                          {Array.from({ length: 3 }).map((_, j) => (
                            <div
                              key={j}
                              className="shrink-0 rounded-xl bg-background-muted animate-pulse"
                              style={{
                                width: "min(44vw, 200px)",
                                aspectRatio: "9/16",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {filteredGroups.map((group) => (
                      <LazyNicheRow
                        key={group.key}
                        group={group}
                        videos={videosByNiche[group.key] || EMPTY_ARR}
                        userFavorites={userFavorites}
                        onToggleFav={toggleFav}
                        onAnalyze={openAnalysis}
                        onScript={openScript}
                        playingId={playingId}
                        onPlay={setPlayingId}
                        onViewAll={handleViewAll}
                      />
                    ))}
                    {filteredGroups.every((g) => !videosByNiche[g.key]?.length) && (
                      <div className="text-center py-24">
                        <div className="h-14 w-14 rounded-full bg-background-muted flex items-center justify-center mx-auto mb-4">
                          <TrendingUp
                            className="h-6 w-6 text-foreground/40"
                            strokeWidth={1.8}
                          />
                        </div>
                        <p className="text-foreground/70 font-medium text-[14px]">
                          Нет трендовых видео
                        </p>
                        <p className="text-[13px] text-foreground/45 mt-1">
                          Попробуйте сменить нишу или период
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
      <ScriptOnlyDialog
        video={scriptVideo}
        open={!!scriptVideo}
        onOpenChange={(open) => {
          if (!open) setScriptVideo(null);
        }}
      />
    </AppLayout>
  );
}
