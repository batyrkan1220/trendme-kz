import { AppLayout } from "@/components/layout/AppLayout";
import { trackSearchEvent, trackAddToFavorites } from "@/components/TrackingPixels";
import {
  Search as SearchIcon, Clock, Loader2, Sparkles, TrendingUp, X
} from "lucide-react";
import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { VideoCard, VideoCardData } from "@/components/VideoCard";
import { VideoAnalysisDialog } from "@/components/VideoAnalysisDialog";
import { ScriptOnlyDialog } from "@/components/ScriptOnlyDialog";
import { cn } from "@/lib/utils";

const SUGGESTED_KEYWORDS = ["мотивация", "юмор", "лайфхаки", "рецепты", "тренировки", "путешествия"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [analysisVideo, setAnalysisVideo] = useState<any>(null);
  const [inputFocused, setInputFocused] = useState(false);

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { checkAndLog } = useSubscription();

  const { data: recentQueries } = useQuery({
    queryKey: ["search-queries", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("search_queries")
        .select("*")
        .eq("user_id", user!.id)
        .order("last_run_at", { ascending: false })
        .limit(5);
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
      queryClient.invalidateQueries({ queryKey: ["favorites-count"] });
    },
    [user, userFavorites, queryClient],
  );

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
    setQuery(q.trim());
    const ok = await checkAndLog("search", `Поиск: ${q.trim()}`);
    if (!ok) return;
    doSearch(q.trim());
  };

  const results = [...(searchResults?.videos || [])].sort(
    (a: any, b: any) => (Number(b.views) || 0) - (Number(a.views) || 0),
  );
  const relatedKeywords: string[] = searchResults?.relatedKeywords || [];

  // ───────────────────── HERO SEARCH BAR (reusable) ─────────────────────
  const HeroSearch = ({ compact = false }: { compact?: boolean }) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSearch();
      }}
      className="w-full"
    >
      <div
        className={cn(
          "relative group transition-all duration-300",
          inputFocused && "scale-[1.01]",
        )}
      >
        {/* Outer glow on focus */}
        <div
          className={cn(
            "absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/40 via-viral/30 to-primary/40 blur-xl opacity-0 transition-opacity duration-500 pointer-events-none",
            inputFocused && "opacity-60",
          )}
        />
        <div className="relative flex items-center bg-card border border-border rounded-2xl shadow-soft overflow-hidden focus-within:border-primary/40 focus-within:shadow-card transition-all duration-300">
          <div className="pl-4 pr-2 shrink-0">
            <SearchIcon
              className={cn(
                "h-5 w-5 transition-colors duration-300",
                inputFocused ? "text-primary" : "text-muted-foreground",
              )}
            />
          </div>
          <Input
            placeholder="Введите ключевое слово..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            className={cn(
              "flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-muted-foreground/60",
              compact ? "h-12" : "h-14",
            )}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mr-2 h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
              aria-label="Очистить"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          <button
            type="submit"
            disabled={isSearching}
            className={cn(
              "shrink-0 mr-1.5 flex items-center justify-center gap-1.5 rounded-xl bg-foreground text-background font-bold text-sm tracking-wide active:scale-[0.96] transition-all disabled:opacity-60 ring-1 ring-foreground/20",
              compact ? "h-10 px-4" : "h-11 px-5",
            )}
            style={{ boxShadow: "0 4px 16px -4px hsl(var(--foreground) / 0.4)" }}
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-viral" />
                <span>Найти</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );

  return (
    <AppLayout>
      {/* ════════════════ EMPTY STATE — LUX HERO ════════════════ */}
      {!searchResults && !isSearching ? (
        <div
          className="relative flex flex-col items-center justify-center px-4 py-8 animate-fade-in bg-background-subtle overflow-hidden"
          style={{
            minHeight: "calc(100dvh - 8rem)",
            paddingTop: "max(env(safe-area-inset-top, 0px) + 24px, 24px)",
          }}
        >
          {/* Decorative ambient blobs */}
          <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-primary/10 blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: "6s" }} />
          <div className="absolute bottom-1/4 -right-20 w-72 h-72 rounded-full bg-viral/10 blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: "8s", animationDelay: "1s" }} />

          <div className="relative w-full max-w-xl flex flex-col items-center gap-7">
            {/* Eyebrow + heading */}
            <div className="text-center space-y-3 animate-fade-in">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                  AI Поиск трендов
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
                Найди свой <span className="bg-gradient-to-r from-primary via-viral to-primary bg-clip-text text-transparent">тренд</span>
              </h1>
              <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
                Введите ключевое слово — соберём релевантные TikTok видео с детальной аналитикой
              </p>
            </div>

            {/* Hero search */}
            <div className="w-full animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <HeroSearch />
            </div>

            {/* Suggested chips */}
            <div className="w-full animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center justify-center gap-1.5 mb-3">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Популярные</span>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTED_KEYWORDS.map((kw, i) => (
                  <button
                    key={kw}
                    onClick={() => handleSearchDirect(kw)}
                    className="px-3.5 py-1.5 rounded-full bg-card border border-border text-[12.5px] font-medium text-foreground hover:bg-foreground hover:text-background hover:border-foreground hover:scale-105 transition-all shadow-soft animate-fade-in"
                    style={{ animationDelay: `${0.3 + i * 0.04}s` }}
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent queries */}
            {recentQueries && recentQueries.length > 0 && (
              <div className="w-full animate-fade-in" style={{ animationDelay: "0.4s" }}>
                <div className="flex items-center justify-center gap-1.5 mb-3">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Недавние</span>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {recentQueries.slice(0, 5).map((q, i) => (
                    <button
                      key={q.id}
                      onClick={() => handleSearchDirect(q.query_text)}
                      className="px-3.5 py-1.5 rounded-full bg-background-muted border border-border/60 text-[12.5px] font-medium text-muted-foreground hover:text-foreground hover:bg-card hover:border-border transition-all animate-fade-in"
                      style={{ animationDelay: `${0.5 + i * 0.04}s` }}
                    >
                      {q.query_text}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : isSearching && !searchResults ? (
        /* ════════════════ LOADING — ORBITAL LUX ════════════════ */
        <div
          className="relative flex flex-col items-center justify-center p-4 animate-fade-in bg-background-subtle overflow-hidden"
          style={{
            minHeight: "calc(100dvh - 8rem)",
            paddingTop: "max(env(safe-area-inset-top, 0px) + 16px, 16px)",
          }}
        >
          {/* Ambient blobs */}
          <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-primary/15 blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: "3s" }} />
          <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full bg-viral/15 blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: "4s" }} />

          <div className="relative w-full max-w-md flex flex-col items-center gap-7">
            {/* Orbital loader */}
            <div className="relative h-32 w-32 flex items-center justify-center">
              {/* Outer rotating ring */}
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary/30 animate-spin" style={{ animationDuration: "2s" }} />
              {/* Middle reverse ring */}
              <div className="absolute inset-3 rounded-full border-2 border-transparent border-b-viral border-l-viral/30 animate-spin" style={{ animationDuration: "1.5s", animationDirection: "reverse" }} />
              {/* Pulsing glow */}
              <div className="absolute inset-6 rounded-full bg-primary/20 blur-xl animate-pulse" />
              {/* Core */}
              <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-viral flex items-center justify-center shadow-glow-primary">
                <Sparkles className="h-7 w-7 text-primary-foreground animate-pulse" />
              </div>
            </div>

            {/* Status text */}
            <div className="text-center space-y-2 animate-fade-in">
              <p className="text-base md:text-lg font-bold text-foreground">
                Ищем «<span className="text-primary">{query}</span>»
              </p>
              <p className="text-sm text-muted-foreground">
                AI анализирует TikTok — обычно занимает 1–2 минуты
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0s" }} />
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.2s" }} />
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        </div>
      ) : (
        /* ════════════════ RESULTS ════════════════ */
        <>
          <div
            className="animate-fade-in bg-background-subtle min-h-full"
            style={{
              paddingTop: "max(env(safe-area-inset-top, 0px) + 16px, 16px)",
              paddingBottom: "6rem",
            }}
          >
            <div className="px-4 pb-3 md:p-6 lg:p-8 space-y-5 md:space-y-6">
              {/* Sticky search bar */}
              <div className="max-w-3xl mx-auto w-full space-y-3">
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                    <Sparkles className="h-2.5 w-2.5 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                      Результаты
                    </span>
                  </div>
                  {results.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Найдено <span className="font-bold text-foreground">{results.length}</span>{" "}
                      {results.length === 1 ? "видео" : "видео"} по запросу «<span className="text-foreground font-semibold">{query}</span>»
                    </p>
                  )}
                </div>
                <HeroSearch compact />
              </div>

              {/* No results */}
              {results.length === 0 && searchResults && !isSearching && (
                <div
                  className="flex-1 flex flex-col items-center justify-center gap-4 animate-fade-in"
                  style={{ minHeight: "calc(100dvh - 18rem)" }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-muted/30 blur-2xl" />
                    <div className="relative h-20 w-20 rounded-2xl bg-card border border-border flex items-center justify-center shadow-soft">
                      <SearchIcon className="h-9 w-9 text-muted-foreground/40" />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-lg font-bold text-foreground">Ничего не найдено</p>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      По запросу «{query}» нет видео. Попробуйте другое ключевое слово.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {SUGGESTED_KEYWORDS.slice(0, 4).map((kw) => (
                      <button
                        key={kw}
                        onClick={() => handleSearchDirect(kw)}
                        className="px-3.5 py-1.5 rounded-full bg-card border border-border text-[12.5px] font-medium hover:bg-foreground hover:text-background transition-all"
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Results grid */}
              {results.length > 0 && (
                <>
                  {/* Related keywords */}
                  {relatedKeywords.length > 0 && (
                    <div className="max-w-5xl mx-auto w-full">
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <TrendingUp className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Похожие запросы
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {relatedKeywords.map((kw, i) => (
                          <button
                            key={kw}
                            onClick={() => handleSearchDirect(kw)}
                            className="px-3.5 py-1.5 rounded-full bg-card border border-border text-[12.5px] font-medium text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary hover:scale-105 transition-all shadow-soft animate-fade-in"
                            style={{ animationDelay: `${i * 0.03}s` }}
                          >
                            {kw}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Video grid with staggered fade-in */}
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

                      return (
                        <div
                          key={video.id || i}
                          className="animate-fade-in"
                          style={{ animationDelay: `${Math.min(i * 0.03, 0.6)}s` }}
                        >
                          <VideoCard
                            video={cardData}
                            playingId={playingId}
                            onPlay={setPlayingId}
                            isFavorite={userFavorites.includes(video.id)}
                            onToggleFav={toggleFav}
                            onAnalyze={(v) => setAnalysisVideo(video)}
                            showTier={true}
                            showAuthor={true}
                            showAnalyzeButton={true}
                          />
                        </div>
                      );
                    })}
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
        </>
      )}
    </AppLayout>
  );
}
