import { AppLayout } from "@/components/layout/AppLayout";
import { isNativePlatform } from "@/lib/native";
import { useNavigate } from "react-router-dom";
import { useLocalFavorites } from "@/hooks/useLocalFavorites";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";

import { trackAddToFavorites } from "@/components/TrackingPixels";
import { TrendingUp, WifiOff, Flame, Eye, Sparkles, Layers } from "lucide-react";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { hapticLight, hapticMedium, hapticSuccess } from "@/lib/haptics";
import { useOnlineStatus, saveTrendsCache, loadTrendsCache } from "@/hooks/useOfflineCache";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator";
import { NICHE_GROUPS } from "@/config/niches";
import { TREND_CATEGORIES } from "@/config/trendCategories";
import { LazyNicheRow } from "@/components/trends/LazyNicheRow";
import { VirtualTrendGrid } from "@/components/trends/VirtualTrendGrid";
import { VideoAnalysisDialog } from "@/components/VideoAnalysisDialog";
import { useAuth } from "@/hooks/useAuth";
import { useTokens } from "@/hooks/useTokens";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";



const PAGE_SIZE = 30;
const EMPTY_ARR: any[] = [];

export default function Trends() {
  // removed activeCategory state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [analysisVideo, setAnalysisVideo] = useState<any>(null);
  const [drillNiche, setDrillNiche] = useState<string | null>(null);
  const [drillSubNiche, setDrillSubNiche] = useState<string | null>(null);
  const [drillPeriod, setDrillPeriod] = useState<number>(7);
  const [headerPeriod, setHeaderPeriod] = useState<number>(1); // 1 / 7 / 30 days
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

  // Cache trends data when loaded, use cache when offline
  const cachedVideos = useMemo(() => loadTrendsCache(), []);
  useEffect(() => {
    if (allVideos.length > 0) saveTrendsCache(allVideos);
  }, [allVideos]);
  const effectiveVideosRaw = isOnline && allVideos.length > 0 ? allVideos : (cachedVideos || allVideos);

  // Filter out blocked authors
  const effectiveVideos = useMemo(() => {
    return effectiveVideosRaw.filter((v: any) => !isBlocked(v.author_username));
  }, [effectiveVideosRaw, isBlocked]);

  const videosByNiche = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const v of effectiveVideos) {
      const n = v.niche || "other";
      if (!map[n]) map[n] = [];
      map[n].push(v);
    }
    return map;
  }, [effectiveVideos]);

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
      hapticLight();
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

  const openAnalysis = useCallback((v: any) => setAnalysisVideo(v), []);
  const openScript = useCallback((v: any) => {
    navigate(`/video-analysis?url=${encodeURIComponent(v.url)}&script=1`);
  }, [navigate]);

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
    let vids = drillNicheVideos.filter((v: any) => !isBlocked(v.author_username));
    if (drillSubNiche) {
      vids = vids.filter((v: any) => v.sub_niche === drillSubNiche);
    }
    return vids.slice(0, visibleCount);
  }, [drillNiche, drillNicheVideos, drillSubNiche, visibleCount, isBlocked]);

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
    { value: 14, label: "14 дней" },
  ];

  const HEADER_PERIODS = [
    { value: 1, label: "24ч" },
    { value: 7, label: "7д" },
    { value: 30, label: "30д" },
  ];

  // KPI metrics for header strip
  const kpiStats = useMemo(() => {
    const since = Date.now() - headerPeriod * 86400000;
    const inWindow = effectiveVideos.filter(
      (v) => v.published_at && new Date(v.published_at).getTime() >= since
    );
    const totalVideos = inWindow.length;
    const viralCount = inWindow.filter((v) => (v.trend_score || 0) >= 70).length;
    const avgViews =
      inWindow.length > 0
        ? Math.round(inWindow.reduce((s, v) => s + (Number(v.views) || 0), 0) / inWindow.length)
        : 0;
    const activeNiches = new Set(inWindow.map((v) => v.niche).filter(Boolean)).size;
    return { totalVideos, viralCount, avgViews, activeNiches };
  }, [effectiveVideos, headerPeriod]);

  const formatNum = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  };

  const filteredGroups = useMemo(
    () => (activeNicheFilter ? allGroups.filter((g) => g.key === activeNicheFilter) : allGroups),
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

  // Swipe between sub-niches
  const swipeRef = useRef<{ startX: number; startY: number } | null>(null);
  const subNicheKeys = useMemo(() => {
    if (!drillGroup) return [];
    return [null, ...drillGroup.subNiches.map(s => s.key)];
  }, [drillGroup]);

  const handleSwipeStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    swipeRef.current = { startX: t.clientX, startY: t.clientY };
  }, []);

  const handleSwipeEnd = useCallback((e: React.TouchEvent) => {
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
    // Clear direction after animation
    setTimeout(() => setSlideDir(null), 300);
    // Auto-scroll active chip into view
    setTimeout(() => {
      const el = chipScrollRef.current?.querySelector('[data-active="true"]') as HTMLElement;
      el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }, 50);
  }, [drillSubNiche, subNicheKeys]);

  return (
    <AppLayout>
      <div
        ref={containerRef}
        className={cn(
          "overflow-x-hidden overflow-y-auto h-full text-foreground relative pb-16 md:pb-8",
          drillNiche ? "bg-background" : "bg-background-subtle"
        )}
        style={{ paddingTop: drillNiche ? "0px" : "calc(env(safe-area-inset-top, 0px) + 12px)" }}
      >
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
          progress={progress}
        />

        {/* Offline banner */}
        {!isOnline && (
          <div className="mx-4 mb-2 px-3 py-2 rounded-xl bg-warning/10 border border-warning/30 flex items-center gap-2 text-warning text-xs">
            <WifiOff className="h-3.5 w-3.5 shrink-0" />
            <span>Офлайн режим — кэштелген деректер көрсетілуде</span>
          </div>
        )}

        <div className="space-y-4 pb-4">
          {/* Drill-down mode */}
          {drillNiche && drillGroup ? (
            <>
              {/* Sticky header with back + title — light premium */}
              <div
                className="sticky top-0 z-30 pb-3 px-4 md:px-6 lg:px-8 space-y-3 glass border-b border-border"
                style={{
                  paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)"
                }}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBack}
                    className="h-9 w-9 rounded-full bg-background-muted hover:bg-muted border border-border flex items-center justify-center transition-colors shrink-0"
                  >
                    <ChevronLeft className="h-4 w-4 text-foreground" />
                  </button>
                  <h1 className="text-lg md:text-xl font-bold text-foreground truncate tracking-tight">
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
                        "shrink-0 px-3 py-1.5 rounded-full font-semibold transition-all border",
                        drillPeriod === opt.value
                          ? "bg-foreground text-background border-foreground shadow-soft"
                          : "bg-card text-muted-foreground border-border hover:bg-muted"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <span className="text-muted-foreground ml-1 font-medium">· {drillTotalFiltered} видео</span>
                </div>

                {/* Sub-niche chips */}
                {drillGroup.subNiches.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-primary uppercase tracking-[0.14em]">Под-темы</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <div ref={chipScrollRef} className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                      <button
                        data-active={!drillSubNiche ? "true" : undefined}
                        onClick={() => { setDrillSubNiche(null); setVisibleCount(PAGE_SIZE); }}
                        className={cn(
                          "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border",
                          !drillSubNiche
                            ? "bg-foreground text-background border-foreground"
                            : "bg-card text-foreground/70 border-border hover:bg-muted"
                        )}
                      >
                        Все
                      </button>
                      {drillGroup.subNiches.map((sub) => {
                        const count = drillNicheVideos.filter((v: any) => v.sub_niche === sub.key).length;
                        return (
                          <button
                            key={sub.key}
                            data-active={drillSubNiche === sub.key ? "true" : undefined}
                            onClick={() => { setDrillSubNiche(sub.key === drillSubNiche ? null : sub.key); setVisibleCount(PAGE_SIZE); }}
                            className={cn(
                              "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap border",
                              drillSubNiche === sub.key
                                ? "bg-foreground text-background border-foreground"
                                : "bg-card text-foreground/70 border-border hover:bg-muted"
                            )}
                          >
                            {sub.label}{count > 0 && <span className="ml-1 opacity-60">{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div
                key={drillSubNiche ?? "__all"}
                className={cn(
                  "p-4 md:p-6 lg:p-8",
                  slideDir === "left" && "animate-slide-in-from-right",
                  slideDir === "right" && "animate-slide-in-from-left",
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
              {/* Page header — eyebrow + h1 + KPI strip + niche tabs */}
              <div className="px-4 md:px-6 lg:px-8 space-y-5">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                    Дашборд трендов
                  </p>
                  <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                        Тренды TikTok
                      </h1>
                      <p className="text-sm text-muted-foreground mt-1">
                        Лучшее за последние 24 часа в твоей нише
                      </p>
                    </div>
                    {/* Period switcher */}
                    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-card border border-border">
                      {HEADER_PERIODS.map((p) => (
                        <button
                          key={p.value}
                          onClick={() => setHeaderPeriod(p.value)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all",
                            headerPeriod === p.value
                              ? "bg-foreground text-background shadow-soft"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* KPI strip — 4 cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      label: "Всего видео",
                      value: formatNum(kpiStats.totalVideos),
                      icon: Layers,
                      tint: "bg-primary-soft text-primary",
                    },
                    {
                      label: "Вирусных",
                      value: formatNum(kpiStats.viralCount),
                      icon: Flame,
                      tint: "bg-viral/20 text-foreground",
                      accent: true,
                    },
                    {
                      label: "Средний охват",
                      value: formatNum(kpiStats.avgViews),
                      icon: Eye,
                      tint: "bg-blue-500/10 text-blue-600",
                    },
                    {
                      label: "Активных ниш",
                      value: String(kpiStats.activeNiches),
                      icon: Sparkles,
                      tint: "bg-violet-500/10 text-violet-600",
                    },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="rounded-2xl bg-card border border-border p-3.5 flex items-center gap-3 hover:shadow-card transition-shadow"
                    >
                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", kpi.tint)}>
                        <kpi.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide truncate">
                          {kpi.label}
                        </div>
                        <div className="text-lg md:text-xl font-bold text-foreground leading-tight">
                          {kpi.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Niche pill-tabs (emoji chips) */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
                  <button
                    onClick={() => setActiveNicheFilter(null)}
                    className={cn(
                      "shrink-0 px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-all whitespace-nowrap border",
                      !activeNicheFilter
                        ? "bg-foreground text-background border-foreground shadow-soft"
                        : "bg-card text-foreground/70 border-border hover:bg-muted"
                    )}
                  >
                    🌍 Все
                  </button>
                  {allGroups.map((g) => {
                    const count = (videosByNiche[g.key] || []).length;
                    const active = activeNicheFilter === g.key;
                    return (
                      <button
                        key={g.key}
                        onClick={() => setActiveNicheFilter(active ? null : g.key)}
                        className={cn(
                          "shrink-0 px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-all whitespace-nowrap border flex items-center gap-1.5",
                          active
                            ? "bg-foreground text-background border-foreground shadow-soft"
                            : "bg-card text-foreground/70 border-border hover:bg-muted"
                        )}
                      >
                        <span>{g.emoji}</span>
                        <span>{g.label}</span>
                        {count > 0 && (
                          <span
                            className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                              active ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
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

              {/* Content rows */}
              <div className="px-4 md:px-6 lg:px-8 space-y-6 pt-2">
                {isLoading ? (
                  <div className="space-y-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-5 bg-background-muted rounded w-32 animate-pulse" />
                        <div className="flex gap-3">
                          {Array.from({ length: 3 }).map((_, j) => (
                            <div
                              key={j}
                              className="shrink-0 rounded-2xl overflow-hidden animate-pulse bg-card border border-border"
                              style={{ width: "min(44vw, 200px)" }}
                            >
                              <div className="aspect-[9/16] bg-background-muted m-1.5 rounded-xl" />
                            </div>
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
                        playingId={playingId}
                        onPlay={setPlayingId}
                        onViewAll={handleViewAll}
                      />
                    ))}

                    {filteredGroups.every((g) => !(videosByNiche[g.key]?.length)) && (
                      <div className="text-center py-20">
                        <div className="h-20 w-20 rounded-full bg-background-muted flex items-center justify-center mx-auto mb-4">
                          <TrendingUp className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                        <p className="text-muted-foreground font-medium">
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
