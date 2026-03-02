import { AppLayout } from "@/components/layout/AppLayout";
import {
  Search as SearchIcon, Clock, Eye, Heart, MessageCircle, Loader2, Sparkles,
  Play, X, ExternalLink, Music, Share2, TrendingUp, Flame, Rocket
} from "lucide-react";
import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
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
      if (error) throw error;
      return data.videos || [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-queries"] });
      queryClient.invalidateQueries({ queryKey: ["recent-queries"] });
    },
    onError: (err: Error) => {
      toast.error("Не удалось выполнить поиск: " + err.message);
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

  const handleSearch = () => {
    if (!query.trim()) return;
    doSearch(query.trim());
  };

  const results = searchResults || [];

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 flex gap-6 animate-fade-in">
        <div className="flex-1 space-y-6 min-w-0">
          <h1 className="text-2xl font-bold text-foreground">Поиск 🔍</h1>

          <div className="flex gap-3">
            <Input
              placeholder="Введите ключевое слово..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 h-12 bg-card border-border rounded-xl card-shadow"
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="h-12 gradient-hero text-primary-foreground border-0 px-7 glow-primary hover:opacity-90 transition-opacity rounded-xl font-semibold"
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


          {results.length > 0 ? (
            <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{results.length}</span> видео найдено
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                            className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            onClick={() => setPlayingId(video.id || video.platform_video_id)}
                          >
                            <div className="w-14 h-14 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center">
                              <Play className="h-7 w-7 text-white fill-white ml-0.5" />
                            </div>
                          </div>

                          {/* Bottom stats bar */}
                          <div className="absolute bottom-0 left-0 right-0 p-2.5 z-10 pointer-events-none">
                            <div className="flex items-center justify-center gap-2">
                              <div className="flex flex-col items-center bg-white/20 backdrop-blur-md rounded-xl px-3 py-1.5">
                                <Eye className="h-4 w-4 text-white mb-0.5" />
                                <span className="text-white text-[11px] font-bold">{fmt(Number(video.views))}</span>
                              </div>
                              <div className="flex flex-col items-center bg-white/20 backdrop-blur-md rounded-xl px-3 py-1.5">
                                <Heart className="h-4 w-4 text-white mb-0.5" />
                                <span className="text-white text-[11px] font-bold">{fmt(Number(video.likes))}</span>
                              </div>
                              <div className="flex flex-col items-center bg-white/20 backdrop-blur-md rounded-xl px-3 py-1.5">
                                <MessageCircle className="h-4 w-4 text-white mb-0.5" />
                                <span className="text-white text-[11px] font-bold">{fmt(Number(video.comments))}</span>
                              </div>
                              <div className="flex flex-col items-center bg-white/20 backdrop-blur-md rounded-xl px-3 py-1.5">
                                <Share2 className="h-4 w-4 text-white mb-0.5" />
                                <span className="text-white text-[11px] font-bold">{fmt(Number(video.shares || 0))}</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
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
          ) : isSearching ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="w-20 h-20 rounded-2xl gradient-hero flex items-center justify-center glow-primary">
                <Sparkles className="h-8 w-8 text-primary-foreground animate-pulse" />
              </div>
              <p className="text-muted-foreground font-medium text-center">
                Ищем видео по вашему запросу...
              </p>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <p className="text-muted-foreground font-medium">
                Введите запрос для поиска видео в TikTok
              </p>
            </div>
          )}
        </div>

        <div className="w-72 shrink-0 hidden xl:block">
          <div className="bg-card rounded-2xl p-5 border border-border/50 sticky top-6 card-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg gradient-card flex items-center justify-center">
                <Clock className="h-3.5 w-3.5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Последние запросы</h3>
            </div>
            {recentQueries && recentQueries.length > 0 ? (
              <div className="space-y-1">
                {recentQueries.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => {
                      setQuery(q.query_text);
                      doSearch(q.query_text);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors truncate"
                  >
                    {q.query_text}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs text-center py-6">Нет запросов</p>
            )}
          </div>
        </div>
      </div>
      <VideoAnalysisDialog
        video={analysisVideo}
        open={!!analysisVideo}
        onOpenChange={(open) => { if (!open) setAnalysisVideo(null); }}
      />
    </AppLayout>
  );
}
