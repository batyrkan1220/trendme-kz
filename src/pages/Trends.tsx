import { AppLayout } from "@/components/layout/AppLayout";
import { trackAddToFavorites } from "@/components/TrackingPixels";
import { TrendingUp, ChevronDown, ChevronRight } from "lucide-react";
import { VirtualTrendGrid } from "@/components/trends/VirtualTrendGrid";
import { useState, useMemo, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { NICHE_GROUPS } from "@/config/niches";
import { VideoAnalysisDialog } from "@/components/VideoAnalysisDialog";
import { useAuth } from "@/hooks/useAuth";
import { useTokens } from "@/hooks/useTokens";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const fmt = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
};

const getTimeAgo = (published_at: string | null) => {
  if (!published_at) return "";
  const h = Math.floor((Date.now() - new Date(published_at).getTime()) / 3600000);
  if (h < 1) return "только что";
  if (h < 24) return `${h}ч назад`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}д назад`;
  return `${Math.floor(d / 30)} мес. назад`;
};

type TrendTier = "strong" | "mid" | "micro";

const getTier = (views: number): TrendTier | null => {
  if (views >= 80_000) return "strong";
  if (views >= 15_000) return "mid";
  if (views >= 3_000) return "micro";
  return null;
};

const tierOrder: Record<TrendTier, number> = {
  strong: 0,
  mid: 1,
  micro: 2,
};

const PAGE_SIZE = 30;

export default function Trends() {
  const [period, setPeriod] = useState<3 | 7 | 30>(7);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [analysisVideo, setAnalysisVideo] = useState<any>(null);
  const [expandedNiche, setExpandedNiche] = useState<string | null>(null);
  const [nicheFilter, setNicheFilter] = useState("all");
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

  const isFreePlan = !userSub || (userSub.plans as any)?.price_rub === 0;

  // Parse filter: "all" | "business" (main niche) | "business:crypto" (sub-niche)
  const parsedFilter = useMemo(() => {
    if (nicheFilter === "all") return { type: "all" as const, niche: "", subNiche: "" };
    const parts = nicheFilter.split(":");
    if (parts.length === 2) return { type: "sub" as const, niche: parts[0], subNiche: parts[1] };
    return { type: "niche" as const, niche: parts[0], subNiche: "" };
  }, [nicheFilter]);

  const activeGroup = useMemo(() => NICHE_GROUPS.find(g => g.key === parsedFilter.niche), [parsedFilter.niche]);

  // Fetch up to 500 videos once per period+niche combo, then paginate client-side
  const { data: allVideos = [], isLoading } = useQuery<any[]>({
    queryKey: ["trends", period, nicheFilter],
    queryFn: async () => {
      const selectFields = "id,platform_video_id,url,caption,cover_url,author_username,author_avatar_url,views,likes,comments,shares,trend_score,velocity_views,published_at,region,niche,sub_niche,categories";

      let q = supabase.from("videos").select(selectFields);
      if (period > 0) {
        const since = new Date();
        since.setDate(since.getDate() - period);
        q = q.gte("published_at", since.toISOString());
      }
      if (parsedFilter.type === "niche") {
        q = q.eq("niche", parsedFilter.niche);
      } else if (parsedFilter.type === "sub") {
        q = q.eq("niche", parsedFilter.niche).eq("sub_niche", parsedFilter.subNiche);
      }
      const { data } = await q.order("trend_score", { ascending: false }).limit(500);
      return data || [];
    },
    staleTime: 120_000,
    placeholderData: (prev) => prev,
  });

  // Sort: Strong > Mid > Micro, then by trend_score within tier
  const sortedVideos = useMemo(() => {
    return [...allVideos].sort((a: any, b: any) => {
      const tierA = getTier(Number(a.views));
      const tierB = getTier(Number(b.views));
      const orderA = tierA ? tierOrder[tierA] : 3;
      const orderB = tierB ? tierOrder[tierB] : 3;
      if (orderA !== orderB) return orderA - orderB;
      return (b.trend_score || 0) - (a.trend_score || 0);
    });
  }, [allVideos]);

  const videos = useMemo(() => {
    return sortedVideos.slice(0, visibleCount);
  }, [sortedVideos, visibleCount]);


  const hasMore = allVideos.length >= visibleCount;


  const { data: userFavorites = [] } = useQuery({
    queryKey: ["user-favorites", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("video_id").eq("user_id", user!.id);
      return data?.map((f) => f.video_id) || [];
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const toggleFav = useCallback(async (videoId: string) => {
    if (!user) return;
    const isFav = userFavorites.includes(videoId);
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("video_id", videoId);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, video_id: videoId });
      trackAddToFavorites(videoId);
    }
    queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
  }, [user, userFavorites, queryClient]);




  return (
    <AppLayout>
       <div className="p-4 md:p-6 lg:p-8 space-y-3 md:space-y-4 animate-fade-in">
        {/* Compact header: title + period + niche in one row */}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl md:text-2xl font-bold text-foreground mr-1">Тренды 🔥</h1>

          <div className="flex bg-card rounded-lg p-0.5 border border-border/50">
            {([3, 7, 30] as const).map((p) => (
              <button
                key={p}
                onClick={() => { setPeriod(p); setVisibleCount(PAGE_SIZE); }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  period === p
                    ? "gradient-hero text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {`${p}д`}
              </button>
            ))}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                nicheFilter !== "all"
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-card text-muted-foreground border-border/50 hover:text-foreground"
              }`}>
                <span>
                  {activeGroup ? `${activeGroup.emoji} ${activeGroup.label}` : "🔥 Все ниши"}
                  {parsedFilter.subNiche && activeGroup
                    ? ` → ${activeGroup.subNiches.find(s => s.key === parsedFilter.subNiche)?.label || ""}`
                    : ""}
                </span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-[420px] overflow-y-auto w-64">
              <DropdownMenuItem
                onClick={() => { setNicheFilter("all"); setVisibleCount(PAGE_SIZE); }}
                className={`cursor-pointer font-semibold ${nicheFilter === "all" ? "bg-primary/10 text-primary" : ""}`}
              >
                🔥 Все ниши
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {NICHE_GROUPS.map((group) => (
                <div key={group.key}>
                  <DropdownMenuItem
                    className={`cursor-pointer justify-between ${parsedFilter.niche === group.key ? "bg-primary/10 text-primary" : ""}`}
                    onSelect={(e) => { e.preventDefault(); setExpandedNiche(prev => prev === group.key ? null : group.key); }}
                  >
                    <span><span className="mr-2">{group.emoji}</span>{group.label}</span>
                    <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expandedNiche === group.key ? "rotate-90" : ""}`} />
                  </DropdownMenuItem>
                  {expandedNiche === group.key && (
                    <div className="pl-4 border-l-2 border-primary/20 ml-3 my-1">
                      <DropdownMenuItem
                        onClick={() => { setNicheFilter(group.key); setVisibleCount(PAGE_SIZE); }}
                        className={`cursor-pointer font-semibold text-xs ${nicheFilter === group.key ? "bg-primary/10 text-primary" : ""}`}
                      >
                        {group.emoji} Все {group.label}
                      </DropdownMenuItem>
                      {group.subNiches.map((sub) => (
                        <DropdownMenuItem
                          key={sub.key}
                          onClick={() => { setNicheFilter(`${group.key}:${sub.key}`); setVisibleCount(PAGE_SIZE); }}
                          className={`cursor-pointer text-xs ${parsedFilter.subNiche === sub.key && parsedFilter.niche === group.key ? "bg-primary/10 text-primary" : ""}`}
                        >
                          {sub.label}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {allVideos.length > 0 && (
            <span className="text-xs text-muted-foreground">{allVideos.length} видео</span>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border/40 overflow-hidden animate-pulse">
                <div className="aspect-[9/14] bg-muted m-2 rounded-2xl" />
                <div className="px-3 py-3 space-y-2">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : videos.length > 0 ? (
          <VirtualTrendGrid
            videos={videos}
            playingId={playingId}
            onPlay={setPlayingId}
            userFavorites={userFavorites}
            onToggleFav={toggleFav}
            onAnalyze={(v) => setAnalysisVideo(v)}
            isFreePlan={isFreePlan}
            freeLimit={FREE_LIMIT}
            hasMore={hasMore}
            onLoadMore={() => setVisibleCount((c) => c + PAGE_SIZE)}
          />
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
      <VideoAnalysisDialog
        video={analysisVideo}
        open={!!analysisVideo}
        onOpenChange={(open) => { if (!open) setAnalysisVideo(null); }}
      />
    </AppLayout>
  );
}
