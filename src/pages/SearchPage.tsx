import { AppLayout } from "@/components/layout/AppLayout";
import { trackSearchEvent, trackAddToFavorites } from "@/components/TrackingPixels";
import {
  Search as SearchIcon, Clock, Loader2, Sparkles,
} from "lucide-react";
import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { VideoCard, VideoCardData } from "@/components/VideoCard";
import { VideoAnalysisDialog } from "@/components/VideoAnalysisDialog";

const fmt = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [analysisVideo, setAnalysisVideo] = useState<any>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { checkAndLog, getRemaining, isFreeTrial } = useSubscription();

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
    queryClient.invalidateQueries({ queryKey: ["favorites-count"] });
  }, [user, userFavorites, queryClient]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    const ok = await checkAndLog("search", `Поиск: ${query.trim()}`);
    if (!ok) return;
    doSearch(query.trim());
  };

  const handleSearchDirect = async (q: string) => {
    if (!q.trim()) return;
    const ok = await checkAndLog("search", `Поиск: ${q.trim()}`);
    if (!ok) return;
    doSearch(q.trim());
  };

  const results = [...(searchResults?.videos || [])].sort((a: any, b: any) => (Number(b.views) || 0) - (Number(a.views) || 0));
  const relatedKeywords: string[] = searchResults?.relatedKeywords || [];

  return (
    <AppLayout>
      {!searchResults && !isSearching ? (
        /* Centered empty state */
        <div className="min-h-[calc(100dvh-5rem)] md:min-h-[calc(100dvh-1rem)] flex flex-col items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg flex flex-col items-center gap-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground text-center">Поиск 🔍</h1>
            <p className="text-muted-foreground text-sm text-center">Введите запрос для поиска видео в TikTok</p>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Input
                placeholder="Введите ключевое слово..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 h-12 bg-card border-border rounded-xl card-shadow text-base"
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                className="h-12 gradient-hero text-primary-foreground border-0 px-7 glow-primary hover:opacity-90 transition-opacity rounded-xl font-semibold text-sm"
              >
                <SearchIcon className="h-4 w-4 mr-2" />Искать
              </Button>
            </div>

            {recentQueries && recentQueries.length > 0 && (
              <div className="w-full mt-2">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Недавние запросы</span>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {recentQueries.slice(0, 5).map((q) => (
                    <button
                      key={q.id}
                      onClick={() => {
                        setQuery(q.query_text);
                        handleSearchDirect(q.query_text);
                      }}
                      className="px-4 py-2 rounded-xl bg-card border border-border/50 text-sm font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-colors card-shadow"
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
        /* Centered loading */
        <div className="min-h-[calc(100dvh-5rem)] md:min-h-[calc(100dvh-1rem)] flex flex-col items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg flex flex-col items-center gap-5">
            <div className="w-20 h-20 rounded-2xl gradient-hero flex items-center justify-center glow-primary animate-scale-in">
              <Sparkles className="h-9 w-9 text-primary-foreground animate-pulse" />
            </div>
            <p className="text-muted-foreground font-medium text-center text-sm md:text-base animate-fade-in">
              Ищем видео по вашему запросу... Это займёт 1–2 минуты
            </p>
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        </div>
      ) : (
      <>
      <div
        className="flex flex-col animate-fade-in"
        style={{ minHeight: "calc(100dvh - 5rem)", paddingTop: "max(env(safe-area-inset-top, 0px) + 16px, 24px)" }}
      >
        <div className={`px-4 pt-2 pb-3 md:p-6 lg:p-8 flex flex-col xl:flex-row gap-4 md:gap-6 flex-1 ${results.length === 0 ? 'justify-center' : ''}`}>
          <div className={`flex-1 space-y-4 md:space-y-6 min-w-0 flex flex-col ${results.length === 0 ? 'items-center justify-center' : ''}`}>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground text-center">Поиск 🔍</h1>

            <div className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto w-full">
              <Input
                placeholder="Введите ключевое слово..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 h-11 md:h-12 bg-card border-border rounded-xl card-shadow text-base"
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                className="h-11 md:h-12 gradient-hero text-primary-foreground border-0 px-5 md:px-7 glow-primary hover:opacity-90 transition-opacity rounded-xl font-semibold text-sm"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <SearchIcon className="h-4 w-4 mr-2" />
                    Искать
                  </>
                )}
              </Button>
            </div>

          {results.length === 0 && searchResults && !isSearching && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 animate-fade-in" style={{ minHeight: "calc(100dvh - 14rem)" }}>
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
                <SearchIcon className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <p className="text-lg font-semibold text-foreground">Ничего не найдено</p>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                По запросу «{query}» не найдено видео. Попробуйте изменить запрос.
              </p>
            </div>
          )}

          {results.length > 0 && (
            <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{results.length}</span> видео найдено
            </div>

            {relatedKeywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {relatedKeywords.map((kw) => (
                  <button
                    key={kw}
                    onClick={() => {
                      setQuery(kw);
                      doSearch(kw);
                    }}
                    className="px-4 py-2 rounded-xl bg-card border border-border/50 text-sm font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-colors card-shadow"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
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
                  <VideoCard
                    key={video.id || i}
                    video={cardData}
                    playingId={playingId}
                    onPlay={setPlayingId}
                    isFavorite={userFavorites.includes(video.id)}
                    onToggleFav={toggleFav}
                    onAnalyze={(v) => setAnalysisVideo(video)}
                    showTier={true}
                    showAuthor={true}
                    showAnalyzeButton={true}
                    darkMode
                  />
                );
              })}
            </div>

            {/* Recent queries - only shown when results exist */}
            <div className="w-full xl:w-72 shrink-0 mt-4">
              <div className="bg-card rounded-2xl p-4 md:p-5 border border-border/50 card-shadow">
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <div className="h-7 w-7 rounded-lg gradient-card flex items-center justify-center">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground">Последние запросы</h3>
                </div>
                {recentQueries && recentQueries.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {recentQueries.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => {
                          setQuery(q.query_text);
                          doSearch(q.query_text);
                        }}
                        className="text-left px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors truncate border border-border/30"
                      >
                        {q.query_text}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs text-center py-4">Нет запросов</p>
                )}
              </div>
            </div>
            </>
          )}
          </div>
        </div>
      </div>
      <VideoAnalysisDialog
        video={analysisVideo}
        open={!!analysisVideo}
        onOpenChange={(open) => { if (!open) setAnalysisVideo(null); }}
      />
      </>
      )}
    </AppLayout>
  );
}
