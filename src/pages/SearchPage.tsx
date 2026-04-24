import { AppLayout } from "@/components/layout/AppLayout";
import { trackSearchEvent, trackAddToFavorites, trackPlausible } from "@/components/TrackingPixels";
import {
  Search as SearchIcon, Clock, Loader2, Sparkles, TrendingUp
} from "lucide-react";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsFreePlan } from "@/hooks/useIsFreePlan";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MemoVideoCard, VideoCardData } from "@/components/VideoCard";
import { VideoAnalysisDialog } from "@/components/VideoAnalysisDialog";
import { ScriptOnlyDialog } from "@/components/ScriptOnlyDialog";
import { LockedVideoOverlay } from "@/components/trends/LockedVideoOverlay";
import { cn } from "@/lib/utils";

const FREE_SEARCH_VISIBLE = 5;

type PlatformFilter = "all" | "tiktok" | "instagram";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [analysisVideo, setAnalysisVideo] = useState<any>(null);
  const [scriptVideo, setScriptVideo] = useState<any>(null);
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { checkAndLog } = useSubscription();
  const { isFreePlan } = useIsFreePlan();
  const navigate = useNavigate();

  const { data: recentQueries } = useQuery({
    queryKey: ["search-queries", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("search_queries")
        .select("*")
        .eq("user_id", user!.id)
        .order("last_run_at", { ascending: false })
        .limit(8);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: searchResults, isPending: isSearching, mutate: doSearch } = useMutation({
    mutationFn: async (q: string) => {
      const { data, error } = await supabase.functions.invoke("ensemble-search", {
        body: { query: q },
      });
      if (error) {
        if (data?.error) throw new Error(data.error);
        throw error;
      }
      return { videos: data.videos || [], relatedKeywords: data.relatedKeywords || [] };
    },
    onSuccess: (_, query) => {
      trackSearchEvent(query);
      trackPlausible("Search Performed", { query: String(query).slice(0, 100) });
      queryClient.invalidateQueries({ queryKey: ["search-queries"] });
      queryClient.invalidateQueries({ queryKey: ["recent-queries"] });
    },
    onError: () => {
      toast.error("Не удалось выполнить поиск. Попробуйте позже.");
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

  const toggleFav = useCallback(async (videoId: string) => {
    if (!user) return;
    const isFav = userFavorites.includes(videoId);
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("video_id", videoId);
      trackPlausible("Favorite Removed", { source: "search" });
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, video_id: videoId });
      trackAddToFavorites(videoId);
      trackPlausible("Favorite Added", { source: "search" });
    }
    queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
    queryClient.invalidateQueries({ queryKey: ["favorites-count"] });
  }, [user, userFavorites, queryClient]);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) {
      toast.error("Введите запрос");
      return;
    }
    const ok = await checkAndLog("search", `Поиск: ${q}`);
    if (!ok) return;
    doSearch(q);
  };

  const handleSearchDirect = async (q: string) => {
    if (!q.trim()) return;
    const ok = await checkAndLog("search", `Поиск: ${q.trim()}`);
    if (!ok) return;
    doSearch(q.trim());
  };

  const allResults = [...(searchResults?.videos || [])].sort(
    (a: any, b: any) => (Number(b.views) || 0) - (Number(a.views) || 0)
  );
  const tiktokCount = allResults.filter((v: any) => (v.platform || "tiktok") === "tiktok").length;
  const instagramCount = allResults.filter((v: any) => v.platform === "instagram").length;
  const results =
    platformFilter === "all"
      ? allResults
      : allResults.filter((v: any) => (v.platform || "tiktok") === platformFilter);
  const relatedKeywords: string[] = searchResults?.relatedKeywords || [];

  // Shared lux search bar (used in both empty + results states)
  const renderSearchBar = (compact = false) => (
    <form
      onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
      className={cnFlex(compact)}
    >
      <div className="relative flex-1">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Введите ключевое слово..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 pl-11 pr-4 bg-card/80 backdrop-blur-xl border-border/60 rounded-2xl shadow-soft text-base"
        />
      </div>
      <Button
        type="submit"
        disabled={isSearching}
        className="h-12 bg-foreground text-background hover:bg-foreground/90 px-6 rounded-2xl font-bold text-sm shadow-soft ring-1 ring-foreground/10"
      >
        {isSearching ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <SearchIcon className="h-4 w-4 mr-1.5" />
            Искать
          </>
        )}
      </Button>
    </form>
  );

  return (
    <AppLayout>
      {/* ========= EMPTY STATE ========= */}
      {!searchResults && !isSearching ? (
        <div
          className="animate-fade-in bg-background-subtle min-h-full"
          style={{
            paddingTop: "max(env(safe-area-inset-top, 0px) + 16px, 16px)",
            paddingBottom: "6rem",
          }}
        >
          <div className="px-4 pb-3 md:p-6 lg:p-8 max-w-3xl mx-auto">
            <div className="space-y-6">
              {/* Hero header — same style as /trends */}
              <div className="space-y-1.5">
                <span className="eyebrow">Поиск</span>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                  Найдите свои тренды
                </h1>
                <p className="text-[13px] md:text-sm text-muted-foreground">
                  Введите ключевое слово — соберём релевантные TikTok видео
                </p>
              </div>

              {renderSearchBar()}

              {/* Recent queries — pill chips like /trends niche filters */}
              {recentQueries && recentQueries.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                      Недавние запросы
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentQueries.slice(0, 8).map((q) => (
                      <button
                        key={q.id}
                        onClick={() => {
                          setQuery(q.query_text);
                          handleSearchDirect(q.query_text);
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-card/70 backdrop-blur-md border border-border/60 text-[13px] font-medium text-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-all active:scale-95 shadow-soft"
                      >
                        {q.query_text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips card */}
              <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-border/60 p-4 md:p-5 shadow-soft">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="h-7 w-7 rounded-lg bg-viral/15 flex items-center justify-center ring-1 ring-viral/30">
                    <Sparkles className="h-3.5 w-3.5 text-viral" />
                  </div>
                  <h3 className="font-bold text-[13px] text-foreground">Совет</h3>
                </div>
                <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                  Используйте конкретные ключевые слова на русском, английском или казахском.
                  Например: <span className="text-foreground font-semibold">«рецепты завтрака»</span>,{" "}
                  <span className="text-foreground font-semibold">«morning routine»</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : isSearching && !searchResults ? (
        /* ========= LOADING STATE ========= */
        <div
          className="flex flex-col items-center justify-center p-4 animate-fade-in bg-background-subtle"
          style={{
            minHeight: "calc(100dvh - 8rem)",
            paddingTop: "max(env(safe-area-inset-top, 0px) + 16px, 16px)",
          }}
        >
          <div className="w-full max-w-lg flex flex-col items-center gap-5">
            <div className="relative">
              <span className="absolute inset-0 rounded-2xl bg-viral/40 blur-2xl -z-10" />
              <div className="w-20 h-20 rounded-2xl bg-viral flex items-center justify-center shadow-glow-primary animate-scale-in ring-1 ring-white/20">
                <Sparkles className="h-9 w-9 text-foreground animate-pulse" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-center text-sm md:text-base animate-fade-in">
              Ищем видео по вашему запросу...<br />
              Это займёт 1–2 минуты
            </p>
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        </div>
      ) : (
        /* ========= RESULTS STATE ========= */
        <>
          <div
            className="animate-fade-in bg-background-subtle min-h-full"
            style={{
              paddingTop: "max(env(safe-area-inset-top, 0px) + 16px, 16px)",
              paddingBottom: "6rem",
            }}
          >
            <div className="px-4 pb-3 md:p-6 lg:p-8">
              <div className="space-y-4 md:space-y-6">
                {/* Hero header */}
                <div className="space-y-1.5">
                  <span className="eyebrow">Поиск</span>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                    Результаты 🔍
                  </h1>
                  {results.length > 0 && (
                    <p className="text-[13px] md:text-sm text-muted-foreground">
                      <span className="font-bold text-foreground">{results.length}</span> видео найдено
                    </p>
                  )}
                </div>

                {renderSearchBar(true)}

                {/* Related keywords as pill chips */}
                {relatedKeywords.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                        Похожие запросы
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {relatedKeywords.map((kw) => (
                        <button
                          key={kw}
                          onClick={() => {
                            setQuery(kw);
                            doSearch(kw);
                          }}
                          className="px-3.5 py-1.5 rounded-full bg-card/70 backdrop-blur-md border border-border/60 text-[13px] font-medium text-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-all active:scale-95 shadow-soft"
                        >
                          {kw}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty results */}
                {results.length === 0 && searchResults && !isSearching && (
                  <div
                    className="flex-1 flex flex-col items-center justify-center gap-4 animate-fade-in"
                    style={{ minHeight: "calc(100dvh - 22rem)" }}
                  >
                    <div className="h-16 w-16 rounded-2xl bg-card/60 border border-border/60 flex items-center justify-center">
                      <SearchIcon className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-lg font-bold text-foreground">Ничего не найдено</p>
                    <p className="text-sm text-muted-foreground text-center max-w-sm">
                      По запросу «{query}» не найдено видео. Попробуйте изменить запрос.
                    </p>
                  </div>
                )}

                {/* Grid — identical to /trends VirtualTrendGrid */}
                {results.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 md:gap-4">
                    {results.map((video: any, i: number) => {
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

                      const isLocked = isFreePlan && i >= FREE_SEARCH_VISIBLE;

                      return (
                        <div
                          key={video.id || i}
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
                              isFavorite={userFavorites.includes(video.id)}
                              onToggleFav={toggleFav}
                              onAnalyze={() => setAnalysisVideo(video)}
                              onScript={() => setScriptVideo(video)}
                              showTier={true}
                              showAuthor={true}
                              showAnalyzeButton={!isLocked}
                              showScriptButton={!isLocked}
                            />
                          </div>
                          {isLocked && <LockedVideoOverlay />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
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
        </>
      )}
    </AppLayout>
  );
}

function cnFlex(compact: boolean) {
  return `flex flex-col sm:flex-row gap-2 w-full ${compact ? "" : "max-w-2xl"}`;
}
