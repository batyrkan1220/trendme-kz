import { AppLayout } from "@/components/layout/AppLayout";
import {
  Search as SearchIcon, Clock, Eye, Heart, MessageCircle, Loader2, Sparkles,
  Play, X, ExternalLink, Music, Share2, TrendingUp, Flame, Rocket
} from "lucide-react";
import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTokens } from "@/hooks/useTokens";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { VideoAnalysisDialog } from "@/components/VideoAnalysisDialog";

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

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [analysisVideo, setAnalysisVideo] = useState<any>(null);
  const { user } = useAuth();
  const { spend, getCost } = useTokens();
  const queryClient = useQueryClient();

  const { data: recentQueries } = useQuery({
    queryKey: ["search-queries", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("search_queries")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: searchResults, isPending: isSearching, mutate: doSearch } = useMutation({
    mutationFn: async (q: string) => {
      const { data, error } = await supabase.functions.invoke("socialkit", {
        body: { action: "search", query: q, limit: 100 },
      });
      if (error) {
        // Check if data contains a more specific error from the function
        if (data?.error) throw new Error(data.error);
        throw error;
      }
      return { videos: data.videos || [], relatedKeywords: data.relatedKeywords || [] };
    },
    onSuccess: () => {
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
    }
    queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
    queryClient.invalidateQueries({ queryKey: ["favorites-count"] });
  }, [user, userFavorites, queryClient]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    const ok = await spend("search", `Поиск: ${query.trim()}`);
    if (!ok) return;
    doSearch(query.trim());
  };

  const handleSearchDirect = async (q: string) => {
    if (!q.trim()) return;
    const ok = await spend("search", `Поиск: ${q.trim()}`);
    if (!ok) return;
    doSearch(q.trim());
  };

  const results = searchResults?.videos || [];
  const relatedKeywords: string[] = searchResults?.relatedKeywords || [];

  return (
    <AppLayout>
      {!searchResults && !isSearching ? (
        /* Centered empty state */
        <div className="min-h-[calc(100dvh-5rem)] md:min-h-[calc(100dvh-1rem)] flex flex-col items-center justify-center md:justify-start md:pt-12 p-4 animate-fade-in">
          <div className="w-full max-w-lg flex flex-col items-center gap-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground text-center">Поиск 🔍</h1>
            <p className="text-muted-foreground text-sm text-center">Введите запрос для поиска видео в TikTok</p>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Input
                placeholder="Введите ключевое слово..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 h-12 bg-card border-border rounded-xl card-shadow text-sm"
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
                  {recentQueries.slice(0, 8).map((q) => (
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
      <div className="p-3 md:p-6 lg:p-8 flex flex-col xl:flex-row gap-4 md:gap-6 animate-fade-in">
        <div className="flex-1 space-y-4 md:space-y-6 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Поиск 🔍</h1>

          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Введите ключевое слово..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 h-11 md:h-12 bg-card border-border rounded-xl card-shadow text-sm"
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
            <div className="flex flex-col items-center justify-center py-16 gap-4 animate-fade-in">
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
                const timeAgo = getTimeAgo(video.published_at);
                const score = video.trend_score || 0;
                const velViews = video.velocity_views || 0;
                const isRocket = score > 500;
                const isFire = score > 100;

                return (
                  <div
                    key={video.id || i}
                    className="group bg-card rounded-2xl border border-border/40 overflow-hidden hover:shadow-lg transition-shadow duration-200 relative flex flex-col"
                    style={{ animationDelay: `${i * 0.03}s` }}
                  >
                    {/* Video area */}
                    <div className="relative aspect-[9/14] bg-black overflow-hidden rounded-2xl m-2">
                      {playingId === (video.id || video.platform_video_id) ? (
                        <>
                          <iframe
                            src={`https://www.tiktok.com/player/v1/${video.platform_video_id}?music_info=1&description=0&muted=0&play_button=1&volume_control=1`}
                            className="w-full h-full border-0"
                            allow="autoplay; encrypted-media; fullscreen"
                            allowFullScreen
                          />
                          <button
                            onClick={() => setPlayingId(null)}
                            className="absolute top-2 right-2 z-20 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          {video.cover_url ? (
                            <img
                              src={video.cover_url}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover cursor-pointer"
                              onClick={() => setPlayingId(video.id || video.platform_video_id)}
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center cursor-pointer bg-muted"
                              onClick={() => setPlayingId(video.id || video.platform_video_id)}
                            >
                              <Play className="h-12 w-12 text-muted-foreground/30" />
                            </div>
                          )}

                          {/* TikTok header bar */}
                          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-2.5 z-10 pointer-events-none">
                            <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm">
                              <Music className="h-3 w-3 text-foreground" />
                              <span className="text-[11px] font-bold text-foreground">Tik-Tok</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleFav(video.id); }}
                                className="pointer-events-auto w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                              >
                                <Heart
                                  className={`h-4 w-4 transition-all ${
                                    userFavorites.includes(video.id)
                                      ? "text-primary fill-primary"
                                      : "text-primary"
                                  }`}
                                />
                              </button>
                            </div>
                          </div>

                          {/* Trend indicators */}
                          {isFire && (
                            <div className="absolute top-12 left-2.5 z-10 flex flex-col gap-1.5 pointer-events-none">
                              {isRocket ? (
                                <div className="flex items-center gap-1 bg-orange-500/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg animate-[pulse_1.5s_ease-in-out_infinite]">
                                  <Rocket className="h-3.5 w-3.5 text-white" />
                                  <span className="text-[10px] font-bold text-white">Взлетает!</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 bg-red-500/80 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg">
                                  <Flame className="h-3.5 w-3.5 text-white" />
                                  <span className="text-[10px] font-bold text-white">В тренде</span>
                                </div>
                              )}
                              {velViews > 10 && (
                                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md rounded-full px-2 py-0.5">
                                  <TrendingUp className="h-3 w-3 text-white" />
                                  <span className="text-[9px] font-bold text-white">+{fmt(Math.round(velViews))}/ч</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Open in TikTok */}
                          <button
                            onClick={(e) => { e.stopPropagation(); window.open(video.url, '_blank'); }}
                            className="absolute top-12 right-2.5 z-10 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-foreground" />
                          </button>

                          {/* Play button center */}
                          <div
                            className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
                            onClick={() => setPlayingId(video.id || video.platform_video_id)}
                          >
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center">
                              <Play className="h-6 w-6 md:h-7 md:w-7 text-white fill-white ml-0.5" />
                            </div>
                          </div>

                          {/* Bottom gradient */}
                          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        </>
                      )}
                    </div>

                  {/* Stats bar */}
                  <div className="flex items-center justify-around px-2 py-2 border-b border-border/30">
                    <span className="flex flex-col items-center gap-0.5">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[11px] font-bold text-foreground">{fmt(Number(video.views))}</span>
                    </span>
                    <span className="flex flex-col items-center gap-0.5">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[11px] font-bold text-foreground">{fmt(Number(video.likes))}</span>
                    </span>
                    <span className="flex flex-col items-center gap-0.5">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[11px] font-bold text-foreground">{fmt(Number(video.comments))}</span>
                    </span>
                    <span className="flex flex-col items-center gap-0.5">
                      <Share2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[11px] font-bold text-foreground">{fmt(Number(video.shares || 0))}</span>
                    </span>
                  </div>

                    {/* Author row */}
                    <div className="px-3 pt-3 flex items-center gap-2">
                      {video.author_avatar_url ? (
                        <img
                          src={video.author_avatar_url}
                          alt=""
                          loading="lazy"
                          className="w-8 h-8 rounded-full object-cover border-2 border-border/50 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
                      )}
                      <span className="text-sm font-semibold text-foreground truncate">
                        @{video.author_username}
                      </span>
                    </div>

                    {/* Caption */}
                    <div className="px-3 pt-1.5 pb-1">
                      <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">
                        {video.caption || "Без описания"}
                      </p>
                    </div>

                    {/* Time ago */}
                    {timeAgo && (
                      <div className="px-3 pb-2">
                        <span className="text-[11px] text-muted-foreground">{timeAgo}</span>
                      </div>
                    )}

                    {/* Analyze button */}
                    <div className="px-3 pb-3 mt-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAnalysisVideo(video);
                        }}
                        className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                      >
                        Анализ видео
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            </>
          )}
        </div>

        {/* Recent queries - shown as horizontal chips on mobile, sidebar on xl */}
        <div className="w-full xl:w-72 shrink-0">
          <div className="bg-card rounded-2xl p-4 md:p-5 border border-border/50 xl:sticky xl:top-6 card-shadow">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <div className="h-7 w-7 rounded-lg gradient-card flex items-center justify-center">
                <Clock className="h-3.5 w-3.5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Последние запросы</h3>
            </div>
            {recentQueries && recentQueries.length > 0 ? (
              <div className="flex xl:flex-col flex-wrap gap-1.5">
                {recentQueries.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => {
                      setQuery(q.query_text);
                      doSearch(q.query_text);
                    }}
                    className="text-left px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors truncate xl:w-full border border-border/30 xl:border-0"
                  >
                    {q.query_text}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs text-center py-4 xl:py-6">Нет запросов</p>
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
