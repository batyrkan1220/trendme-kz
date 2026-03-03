import { AppLayout } from "@/components/layout/AppLayout";
import { TrendingUp, Eye, Heart, MessageCircle, Star, RefreshCw, Share2, Clock, Flame, Play, ExternalLink, Music, X, Rocket, ChevronDown, Zap, Trophy, Target } from "lucide-react";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NICHES = [
  { key: "all", label: "Все категории", emoji: "🔥" },
  { key: "animals", label: "Животные", emoji: "🐶" },
  { key: "art", label: "Искусство / Дизайн", emoji: "🎨" },
  { key: "auto", label: "Авто", emoji: "🚗" },
  { key: "beauty", label: "Beauty (Бьюти)", emoji: "💄" },
  { key: "books", label: "Книги / Саморазвитие", emoji: "📚" },
  { key: "business", label: "Бизнес и деньги", emoji: "💼" },
  { key: "cinema", label: "Кино / Сериалы", emoji: "🎬" },
  { key: "comedy", label: "Юмор / Комедия", emoji: "😂" },
  { key: "dance", label: "Танцы", emoji: "💃" },
  { key: "diy", label: "Дом / Ремонт / DIY", emoji: "🛠" },
  { key: "education", label: "Образование", emoji: "🎓" },
  { key: "entertainment", label: "Развлечения", emoji: "🎥" },
  { key: "family", label: "Семья и дети", emoji: "👶" },
  { key: "fashion", label: "Мода и стиль", emoji: "👗" },
  { key: "fitness", label: "Фитнес и здоровье", emoji: "🏋️" },
  { key: "food", label: "Еда / Рецепты", emoji: "🍔" },
  { key: "gaming", label: "Игры / Gaming", emoji: "🎮" },
  { key: "lifestyle", label: "Блоги / Лайфстайл", emoji: "📱" },
  { key: "marketing", label: "Маркетинг / Реклама", emoji: "📈" },
  { key: "medicine", label: "Медицина / Здоровье", emoji: "🩺" },
  { key: "music", label: "Музыка", emoji: "🎶" },
  { key: "news", label: "Новости / Общество", emoji: "🏛" },
  { key: "podcast", label: "Интервью / Подкасты", emoji: "🎤" },
  { key: "psychology", label: "Психология и отношения", emoji: "🧠" },
  { key: "realestate", label: "Недвижимость", emoji: "🏠" },
  { key: "religion", label: "Религия и мотивация", emoji: "🕌" },
  { key: "shopping", label: "Покупки / Обзоры товаров", emoji: "🧳" },
  { key: "sports", label: "Спорт", emoji: "⚽" },
  { key: "tech", label: "Технологии / IT / AI", emoji: "💻" },
  { key: "travel", label: "Путешествия", emoji: "✈️" },
] as const;
import { VideoAnalysisDialog } from "@/components/VideoAnalysisDialog";
import { useAuth } from "@/hooks/useAuth";
import { useTokens } from "@/hooks/useTokens";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lock } from "lucide-react";
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

const tierConfig: Record<TrendTier, { label: string; icon: any; className: string; order: number }> = {
  strong: { label: "Strong Trend", icon: Trophy, className: "bg-amber-500/90 text-white", order: 0 },
  mid: { label: "Mid Trend", icon: Zap, className: "bg-primary/80 text-white", order: 1 },
  micro: { label: "Micro Trend", icon: Target, className: "bg-accent/80 text-white", order: 2 },
};

const PAGE_SIZE = 30;

export default function Trends() {
  const [period, setPeriod] = useState<3 | 7 | 30 | 0>(7);
  const [refreshing, setRefreshing] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [analysisVideo, setAnalysisVideo] = useState<any>(null);
  const [niche, setNiche] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { user } = useAuth();
  const { balance } = useTokens();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const FREE_LIMIT = 5;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const totalBatches = 7;
      for (let batch = 0; batch < totalBatches; batch++) {
        toast.loading(`Обновление ниш ${batch * 4 + 1}-${Math.min((batch + 1) * 4, 28)}...`, { id: "refresh" });
        const { error } = await supabase.functions.invoke("refresh-trends", { body: { mass: true, batch } });
        if (error) console.error(`Batch ${batch} error:`, error);
      }
      toast.success("Тренды обновлены! Все 30 категорий загружены", { id: "refresh" });
      queryClient.invalidateQueries({ queryKey: ["trends"] });
    } catch (e: any) {
      toast.error("Ошибка обновления: " + (e.message || "Попробуйте позже"), { id: "refresh" });
    } finally {
      setRefreshing(false);
    }
  };

  const { data: allVideos = [], isLoading } = useQuery({
    queryKey: ["trends", period, niche],
    queryFn: async () => {
      const selectFields = "id,platform_video_id,url,caption,cover_url,author_username,author_avatar_url,views,likes,comments,shares,trend_score,velocity_views,published_at,region,niche,categories";
      const PAGE = 1000;
      let all: any[] = [];
      let from = 0;

      while (true) {
        let q = supabase.from("videos").select(selectFields);
        if (period > 0) {
          const since = new Date();
          since.setDate(since.getDate() - period);
          q = q.gte("published_at", since.toISOString());
        }
        if (niche !== "all") {
          q = q.contains("categories", [niche]);
        }
        const { data } = await q.order("trend_score", { ascending: false }).range(from, from + PAGE - 1);
        if (!data || data.length === 0) break;
        all = all.concat(data);
        if (data.length < PAGE) break;
        from += PAGE;
      }

      return all;
    },
    staleTime: 60_000,
  });

  // Sort: Strong > Mid > Micro, then by trend_score within tier
  const sortedVideos = useMemo(() => {
    return [...allVideos].sort((a: any, b: any) => {
      const tierA = getTier(Number(a.views));
      const tierB = getTier(Number(b.views));
      const orderA = tierA ? tierConfig[tierA].order : 3;
      const orderB = tierB ? tierConfig[tierB].order : 3;
      if (orderA !== orderB) return orderA - orderB;
      return (b.trend_score || 0) - (a.trend_score || 0);
    });
  }, [allVideos]);

  const videos = useMemo(() => {
    return sortedVideos.slice(0, visibleCount);
  }, [sortedVideos, visibleCount]);

  const hasMore = visibleCount < sortedVideos.length;
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => c + PAGE_SIZE);
        }
      },
      { threshold: 0.1 }
    );
    const el = loaderRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, visibleCount]);

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
    }
    queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
  }, [user, userFavorites, queryClient]);

  // Tier stats
  const tierCounts = useMemo(() => {
    const counts = { strong: 0, mid: 0, micro: 0 };
    for (const v of allVideos) {
      const t = getTier(Number((v as any).views));
      if (t) counts[t]++;
    }
    return counts;
  }, [allVideos]);

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 animate-fade-in">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Тренды 🔥</h1>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-sm font-semibold border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{refreshing ? "Обновление..." : "Обновление 7 дней"}</span>
            </button>
          </div>

          {/* Period tabs */}
          <div className="flex bg-card rounded-xl p-1 border border-border/50 card-shadow overflow-x-auto w-fit">
            {([3, 7, 30, 0] as const).map((p) => (
              <button
                key={p}
                onClick={() => { setPeriod(p); setVisibleCount(PAGE_SIZE); }}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
                  period === p
                    ? "gradient-hero text-primary-foreground glow-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p === 0 ? "Все" : `${p}д`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                niche !== "all"
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-card text-muted-foreground border-border/50 hover:text-foreground hover:bg-muted/50"
              }`}>
                <span>{NICHES.find(n => n.key === niche)?.emoji} {NICHES.find(n => n.key === niche)?.label || "Ниша"}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-80 overflow-y-auto w-56">
              {NICHES.map((n) => (
                <DropdownMenuItem
                  key={n.key}
                  onClick={() => { setNiche(n.key); setVisibleCount(PAGE_SIZE); }}
                  className={`cursor-pointer ${niche === n.key ? "bg-primary/10 text-primary" : ""}`}
                >
                  <span className="mr-2">{n.emoji}</span> {n.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Tier stats badges */}
          {allVideos.length > 0 && (
            <div className="flex items-center gap-1.5 ml-2">
              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 font-semibold">
                <Trophy className="h-3 w-3" /> {tierCounts.strong}
              </span>
              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                <Zap className="h-3 w-3" /> {tierCounts.mid}
              </span>
              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary/70 font-semibold">
                <Target className="h-3 w-3" /> {tierCounts.micro}
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                = {allVideos.length}
              </span>
            </div>
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
          <>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
            {videos.map((video: any, i: number) => {
              const timeAgo = getTimeAgo(video.published_at);
              const views = Number(video.views) || 0;
              const tier = getTier(views);
              const velViews = video.velocity_views || 0;

              return (
                <div
                  key={video.id}
                  className="group bg-card rounded-2xl border border-border/40 overflow-hidden hover:shadow-lg transition-shadow duration-200 relative flex flex-col"
                >
                  {/* Video area */}
                  <div className="relative aspect-[9/14] bg-black overflow-hidden rounded-2xl m-2">
                    {playingId === video.id ? (
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
                          aria-label="Закрыть видео"
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
                            onClick={() => setPlayingId(video.id)}
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center cursor-pointer bg-muted"
                            onClick={() => setPlayingId(video.id)}
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

                        {/* Tier badge */}
                        {tier && (
                          <div className="absolute top-12 left-2.5 z-10 flex flex-col gap-1.5 pointer-events-none">
                            <div className={`flex items-center gap-1 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg ${tierConfig[tier].className}`}>
                              {(() => {
                                const Icon = tierConfig[tier].icon;
                                return <Icon className="h-3.5 w-3.5" />;
                              })()}
                              <span className="text-[10px] font-bold">{tierConfig[tier].label}</span>
                            </div>
                            {velViews > 10 && (
                              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md rounded-full px-2 py-0.5">
                                <TrendingUp className="h-3 w-3 text-white" />
                                <span className="text-[9px] font-bold text-white">+{fmt(Math.round(velViews))}/ч</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Open in TikTok button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); window.open(video.url, '_blank'); }}
                          className="absolute top-12 right-2.5 z-10 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-foreground" />
                        </button>

                        {/* Play button center */}
                        <div
                          className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
                          onClick={() => setPlayingId(video.id)}
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

          {hasMore && (
            <div ref={loaderRef} className="flex justify-center py-8">
              <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}
          </>
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
