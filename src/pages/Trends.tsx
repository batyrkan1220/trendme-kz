import { AppLayout } from "@/components/layout/AppLayout";
import { isNativePlatform } from "@/lib/native";
import { useNavigate } from "react-router-dom";
import { useLocalFavorites } from "@/hooks/useLocalFavorites";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import { trackAddToFavorites } from "@/components/TrackingPixels";
import { WifiOff, Search as SearchIcon, X } from "lucide-react";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import { useOnlineStatus, saveTrendsCache, loadTrendsCache } from "@/hooks/useOfflineCache";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator";
import { NICHE_GROUPS } from "@/config/niches";
import { LazyNicheRow } from "@/components/trends/LazyNicheRow";
import { VirtualTrendGrid } from "@/components/trends/VirtualTrendGrid";
import { VideoAnalysisDialog } from "@/components/VideoAnalysisDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

const PAGE_SIZE = 30;

export default function Trends() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [analysisVideo, setAnalysisVideo] = useState<any>(null);
  const [drillNiche, setDrillNiche] = useState<string | null>(null);
  const [drillSubNiche, setDrillSubNiche] = useState<string | null>(null);
  const [drillPeriod, setDrillPeriod] = useState<number>(7);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const chipScrollRef = useRef<HTMLDivElement>(null);

  // Іздеу жолағы — Trends-тің ішінде
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
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

  const cachedVideos = useMemo(() => loadTrendsCache(), []);
  useEffect(() => {
    if (allVideos.length > 0) saveTrendsCache(allVideos);
  }, [allVideos]);
  const effectiveVideosRaw = isOnline && allVideos.length > 0 ? allVideos : (cachedVideos || allVideos);

  const effectiveVideos = useMemo(() => {
    return effectiveVideosRaw.filter((v: any) => !isBlocked(v.author_username));
  }, [effectiveVideosRaw, isBlocked]);

  // Іздеу фильтрі
  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return effectiveVideos;
    const q = searchQuery.toLowerCase();
    return effectiveVideos.filter((v: any) =>
      (v.caption || "").toLowerCase().includes(q) ||
      (v.author_username || "").toLowerCase().includes(q) ||
      (v.niche || "").toLowerCase().includes(q)
    );
  }, [effectiveVideos, searchQuery]);

  const videosByNiche = useMemo(() => {
    const source = searchQuery.trim() ? searchFiltered : effectiveVideos;
    const map: Record<string, any[]> = {};
    for (const v of source) {
      const n = v.niche || "other";
      if (!map[n]) map[n] = [];
      map[n].push(v);
    }
    return map;
  }, [effectiveVideos, searchFiltered, searchQuery]);

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
      if (isNativePlatform) { toggleLocalFav(videoId); return; }
      if (!user) { navigate("/auth"); return; }
      const isFav = userFavorites.includes(videoId);
      queryClient.setQueryData(
        ["user-favorites", user.id],
        isFav ? userFavorites.filter((id: string) => id !== videoId) : [...userFavorites, videoId]
      );
      try {
        if (isFav) {
          await supabase.from("favorites").delete().eq("user_id", user.id).eq("video_id", videoId);
        } else {
          const { error } = await supabase.from("favorites").insert({ user_id: user.id, video_id: videoId });
          if (!error) trackAddToFavorites(videoId);
        }
      } catch {}
      queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
    },
    [user, userFavorites, queryClient, isNativePlatform, toggleLocalFav]
  );

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["trends-all"] });
    await new Promise((r) => setTimeout(r, 500));
  }, [queryClient]);

  const { containerRef, pullDistance, isRefreshing, progress } = usePullToRefresh({ onRefresh: handleRefresh });

  // Drill-down (нишаға кіру)
  const { data: drillNicheVideos = [] } = useQuery<any[]>({
    queryKey: ["trends-niche", drillNiche, drillPeriod],
    queryFn: async () => {
      if (!drillNiche) return [];
      const selectFields =
        "id,platform_video_id,url,caption,cover_url,author_username,author_avatar_url,views,likes,comments,shares,trend_score,velocity_views,published_at,region,niche,sub_niche,categories";
      const since = new Date(Date.now() - drillPeriod * 86400000).toISOString();
      const allRows: any[] = [];
      let from = 0;
      while (true) {
        const { data: rows } = await supabase
          .from("videos")
          .select(selectFields)
          .eq("niche", drillNiche)
          .gte("published_at", since)
          .order("trend_score", { ascending: false })
          .range(from, from + 999);
        if (!rows || rows.length === 0) break;
        allRows.push(...rows);
        if (rows.length < 1000) break;
        from += 1000;
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
    if (drillSubNiche) return drillNicheVideos.filter((v: any) => v.sub_niche === drillSubNiche).length;
    return drillNicheVideos.length;
  }, [drillNiche, drillNicheVideos, drillSubNiche]);

  const drillGroup = useMemo(() => NICHE_GROUPS.find((g) => g.key === drillNiche), [drillNiche]);

  const PERIOD_OPTIONS = [
    { value: 3, label: "3 күн" },
    { value: 7, label: "7 күн" },
    { value: 14, label: "14 күн" },
  ];

  const handleViewAll = (nicheKey: string, subNicheKey?: string) => {
    setDrillNiche(nicheKey);
    setDrillSubNiche(subNicheKey || null);
    setVisibleCount(PAGE_SIZE);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleBack = () => {
    setDrillNiche(null);
    setVisibleCount(PAGE_SIZE);
  };

  // Swipe between sub-niches
  const swipeRef = useRef<{ startX: number; startY: number } | null>(null);
  const subNicheKeys = useMemo(() => {
    if (!drillGroup) return [];
    return [null, ...drillGroup.subNiches.map((s) => s.key)];
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
    setTimeout(() => setSlideDir(null), 300);
    setTimeout(() => {
      const el = chipScrollRef.current?.querySelector('[data-active="true"]') as HTMLElement;
      el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }, 50);
  }, [drillSubNiche, subNicheKeys]);

  // Іздеу ашылғанда фокус
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  return (
    <AppLayout>
      <div
        ref={containerRef}
        className="overflow-x-hidden overflow-y-auto h-full bg-background text-foreground relative pb-16 md:pb-8"
        style={{ paddingTop: drillNiche ? "0px" : "calc(env(safe-area-inset-top, 0px) + 12px)" }}
      >
        <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} progress={progress} />

        {/* Офлайн баннер */}
        {!isOnline && (
          <div className="mx-4 mb-2 px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-2 text-yellow-400 text-xs">
            <WifiOff className="h-3.5 w-3.5 shrink-0" />
            <span>Офлайн — кэштелген деректер</span>
          </div>
        )}

        <div className="space-y-4 pb-4">
          {drillNiche && drillGroup ? (
            /* ══════ DRILL DOWN РЕЖІМІ ══════ */
            <>
              <div
                className="sticky top-0 z-30 pb-2 px-4 backdrop-blur-md space-y-3"
                style={{
                  background: "rgba(10,10,10,0.85)",
                  paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)",
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

                {/* Кезең чиптері */}
                <div className="flex items-center gap-2 text-xs">
                  {PERIOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setDrillPeriod(opt.value); setVisibleCount(PAGE_SIZE); }}
                      className={cn(
                        "shrink-0 px-2.5 py-1 rounded-full font-medium transition-all",
                        drillPeriod === opt.value ? "bg-white/20 text-white" : "bg-white/5 text-white/40 hover:bg-white/10"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <span className="text-white/40 ml-1">· {drillTotalFiltered} видео</span>
                </div>

                {/* Суб-ниша чиптері */}
                {drillGroup.subNiches.length > 0 && (
                  <div ref={chipScrollRef} className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                    <button
                      data-active={!drillSubNiche ? "true" : undefined}
                      onClick={() => { setDrillSubNiche(null); setVisibleCount(PAGE_SIZE); }}
                      className={cn(
                        "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        !drillSubNiche ? "bg-neon text-black" : "bg-white/10 text-white/70 hover:bg-white/20"
                      )}
                    >
                      Барлығы
                    </button>
                    {drillGroup.subNiches.map((sub) => {
                      const count = drillNicheVideos.filter((v: any) => v.sub_niche === sub.key).length;
                      return (
                        <button
                          key={sub.key}
                          data-active={drillSubNiche === sub.key ? "true" : undefined}
                          onClick={() => { setDrillSubNiche(sub.key === drillSubNiche ? null : sub.key); setVisibleCount(PAGE_SIZE); }}
                          className={cn(
                            "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                            drillSubNiche === sub.key ? "bg-neon text-black" : "bg-white/10 text-white/70 hover:bg-white/20"
                          )}
                        >
                          {sub.label}{count > 0 && <span className="ml-1 opacity-60">{count}</span>}
                        </button>
                      );
                    })}
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
                  onAnalyze={(v) => setAnalysisVideo(v)}
                  isFreePlan={isFreePlan}
                  freeLimit={FREE_LIMIT}
                  hasMore={drillTotalFiltered > visibleCount}
                  onLoadMore={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  darkMode
                />
              </div>
            </>
          ) : (
            /* ══════ НЕГІЗГІ ЛЕНТА ══════ */
            <>
              {/* Header: Logo + Search */}
              <div
                className="sticky top-0 z-30 flex items-center justify-between px-4 py-3"
                style={{
                  paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
                  background: "rgba(8,8,8,0.85)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                {searchOpen ? (
                  /* Іздеу input */
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1 flex items-center gap-2 bg-white/8 rounded-xl px-3 py-2 border border-white/10">
                      <SearchIcon className="h-4 w-4 text-white/40 shrink-0" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Тренд іздеу..."
                        className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery("")}>
                          <X className="h-4 w-4 text-white/40" />
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                      className="text-white/50 text-sm font-medium px-2"
                    >
                      Болдырмау
                    </button>
                  </div>
                ) : (
                  /* Қалыпты header */
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center relative">
                        <div className="w-3 h-3 rounded-full bg-viral" />
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-viral animate-ping" />
                      </div>
                      <span className="font-bold text-[17px] tracking-tight text-foreground">trendme</span>
                    </div>
                    <button
                      onClick={() => setSearchOpen(true)}
                      className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <SearchIcon className="h-4 w-4 text-white/70" />
                    </button>
                  </>
                )}
              </div>

              {/* Нишалар тізімі */}
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
                              <div className="aspect-[9/16] bg-white/5 m-1.5 rounded-xl" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery.trim() ? (
                  /* Іздеу нәтижелері */
                  <div>
                    <p className="text-sm text-white/40 mb-4">
                      «{searchQuery}» бойынша {searchFiltered.length} видео табылды
                    </p>
                    {searchFiltered.length > 0 ? (
                      <VirtualTrendGrid
                        videos={searchFiltered.slice(0, 60)}
                        playingId={playingId}
                        onPlay={setPlayingId}
                        userFavorites={userFavorites}
                        onToggleFav={toggleFav}
                        onAnalyze={(v) => setAnalysisVideo(v)}
                        isFreePlan={isFreePlan}
                        freeLimit={FREE_LIMIT}
                        hasMore={false}
                        onLoadMore={() => {}}
                        darkMode
                      />
                    ) : (
                      <div className="text-center py-16 text-white/30 text-sm">
                        Ештеңе табылмады 😔
                      </div>
                    )}
                  </div>
                ) : (
                  /* Нишалар */
                  <>
                    {NICHE_GROUPS.map((group) => (
                      <LazyNicheRow
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

                    {NICHE_GROUPS.every((g) => !(videosByNiche[g.key]?.length)) && !isLoading && (
                      <div className="text-center py-20">
                        <p className="text-white/30 font-medium text-sm">Трендтер жүктелуде...</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Анализ диалогы — бет ауыспайды, drawer ашылады */}
      <VideoAnalysisDialog
        video={analysisVideo}
        open={!!analysisVideo}
        onOpenChange={(open) => { if (!open) setAnalysisVideo(null); }}
      />
    </AppLayout>
  );
}
