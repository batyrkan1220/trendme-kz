import { AppLayout } from "@/components/layout/AppLayout";
import { TrendingUp, Eye, Heart, MessageCircle, Star, RefreshCw, Share2, Clock, Flame, Play, ExternalLink, Music, X, Rocket, ChevronDown } from "lucide-react";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NICHES = [
  { key: "all", label: "Все ниши", emoji: "🔥", keywords: [] },
  { key: "finance", label: "Финансы и Инвестиции", emoji: "💰", keywords: ["финанс", "инвест", "крипто", "биткоин", "деньг", "заработ", "доход", "трейд", "акци", "finance", "invest", "crypto", "money", "trading"] },
  { key: "marketing", label: "Маркетинг и SMM", emoji: "📱", keywords: ["маркетинг", "smm", "реклам", "продвиж", "таргет", "контент", "бренд", "marketing", "brand", "target", "воронк"] },
  { key: "business", label: "Бизнес и Продажи", emoji: "💼", keywords: ["бизнес", "продаж", "предприним", "стартап", "business", "startup", "магазин", "товар", "оптов"] },
  { key: "psychology", label: "Психология отношений", emoji: "❤️", keywords: ["психолог", "отношен", "любов", "пар", "свидан", "брак", "развод", "чувств", "эмоци", "relationship"] },
  { key: "therapy", label: "Терапия и мышление", emoji: "🧠", keywords: ["терапи", "мышлен", "медитац", "осознан", "саморазвит", "мотивац", "therapy", "mindset", "motivation"] },
  { key: "education", label: "Образование и языки", emoji: "🇬🇧", keywords: ["образован", "учеб", "урок", "английск", "язык", "школ", "универ", "курс", "education", "english", "learn"] },
  { key: "mama", label: "Мама-блоги и материнство", emoji: "🍼", keywords: ["мам", "ребенок", "дет", "малыш", "беременн", "родител", "воспитан", "baby", "mom", "mother", "parenting"] },
  { key: "beauty", label: "Бьюти и косметология", emoji: "💄", keywords: ["бьюти", "косметик", "макияж", "уход", "кожа", "крем", "beauty", "makeup", "skincare", "маникюр", "волос"] },
  { key: "fitness", label: "Фитнес и Спорт", emoji: "💪", keywords: ["фитнес", "спорт", "тренировк", "зал", "похуде", "диет", "fitness", "sport", "workout", "gym", "йог"] },
  { key: "fashion", label: "Мода и Стиль", emoji: "👠", keywords: ["мода", "стиль", "одежд", "образ", "тренд", "outfit", "fashion", "style", "look", "бренд", "шопинг"] },
  { key: "law", label: "Юристы и Налоги", emoji: "⚖️", keywords: ["юрист", "налог", "закон", "прав", "суд", "штраф", "lawyer", "tax", "legal", "документ"] },
  { key: "realestate", label: "Недвижимость", emoji: "🏠", keywords: ["недвижимост", "квартир", "дом", "ипотек", "аренд", "жиль", "ремонт", "стройк", "realestate", "apartment"] },
  { key: "esoteric", label: "Эзотерика и Таро", emoji: "🔮", keywords: ["эзотерик", "таро", "гороскоп", "астролог", "карт", "знак зодиак", "магия", "энерги", "tarot", "astrology"] },
  { key: "food", label: "Еда и Рецепты", emoji: "🍳", keywords: ["еда", "рецепт", "готов", "кухн", "блюд", "вкусн", "food", "recipe", "cooking", "торт", "выпечк"] },
  { key: "home", label: "Дом, Уют и Ремонт", emoji: "🪴", keywords: ["дом", "уют", "ремонт", "интерьер", "декор", "мебел", "уборк", "home", "interior", "design", "организац"] },
  { key: "travel", label: "Путешествия", emoji: "✈️", keywords: ["путешеств", "travel", "туризм", "отдых", "отпуск", "страна", "город", "поездк", "виз"] },
  { key: "lifestyle", label: "Лайфстайл", emoji: "🎬", keywords: ["лайфстайл", "lifestyle", "жизн", "влог", "vlog", "день", "рутин", "routine", "мотивац"] },
  { key: "animals", label: "Животные", emoji: "🐾", keywords: ["животн", "кот", "собак", "питомец", "pet", "cat", "dog", "щенок", "котенок", "animal"] },
  { key: "gaming", label: "Игры и Гик-культура", emoji: "🎮", keywords: ["игр", "game", "gaming", "геймер", "ps5", "xbox", "steam", "компьютер", "аниме", "anime", "комикс"] },
  { key: "music", label: "Музыка, Кино и Арт", emoji: "🎸", keywords: ["музык", "кино", "фильм", "песн", "music", "movie", "film", "арт", "art", "творчеств", "рисов"] },
  
  { key: "career", label: "Карьера и Фриланс", emoji: "💻", keywords: ["карьер", "фриланс", "работ", "вакансии", "резюме", "career", "freelance", "remote", "удаленн"] },
  { key: "auto", label: "Авто и Мото", emoji: "🚗", keywords: ["авто", "машин", "мото", "car", "auto", "тачк", "водител", "дтп", "гараж"] },
  { key: "diy", label: "Рукоделие и DIY", emoji: "🧶", keywords: ["рукодел", "diy", "своими рукам", "handmade", "craft", "вяза", "шить", "поделк"] },
  { key: "kids", label: "Дети и Воспитание", emoji: "👶", keywords: ["дет", "воспитан", "ребенок", "малыш", "школ", "kids", "children", "развит"] },
  { key: "ai_news", label: "Новости нейросетей", emoji: "🤖", keywords: ["нейросет", "ии", "ai", "chatgpt", "gpt", "искусственн интеллект", "neural", "машинн обучен"] },
  { key: "ai_art", label: "AI Art и Генерации", emoji: "🪐", keywords: ["ai art", "генерац", "midjourney", "stable diffusion", "dall-e", "нейросет рису", "сгенериров"] },
  { key: "ai_avatar", label: "AI Аватары", emoji: "🗣️", keywords: ["ai аватар", "цифров аватар", "deepfake", "виртуальн", "avatar", "digital human"] },
  { key: "humor", label: "Юмор и Скетчи", emoji: "😂", keywords: ["юмор", "смешн", "скетч", "прикол", "шутк", "comedy", "funny", "мем", "humor", "ржач"] },
] as const;
import { VideoAnalysisDialog } from "@/components/VideoAnalysisDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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

const PAGE_SIZE = 30;

export default function Trends() {
  const [period, setPeriod] = useState<1 | 3 | 7 | 30 | 0>(7);
  // removed region tab state
  const [refreshing, setRefreshing] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [analysisVideo, setAnalysisVideo] = useState<any>(null);
  const [niche, setNiche] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Run 7 batches sequentially (4 niches each) with more queries per niche
      const totalBatches = 7;
      for (let batch = 0; batch < totalBatches; batch++) {
        toast.loading(`Обновление ниш ${batch * 4 + 1}-${Math.min((batch + 1) * 4, 28)}...`, { id: "refresh" });
        const { error } = await supabase.functions.invoke("refresh-trends", { body: { mass: true, batch } });
        if (error) console.error(`Batch ${batch} error:`, error);
      }
      toast.success("Тренды обновлены! Все 28 ниш загружены", { id: "refresh" });
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
      const selectFields = "id,platform_video_id,url,caption,cover_url,author_username,author_avatar_url,views,likes,comments,shares,trend_score,velocity_views,published_at,region,niche";

      let q = supabase.from("videos").select(selectFields);
      if (period > 0) {
        const since = new Date();
        since.setDate(since.getDate() - period);
        q = q.gte("published_at", since.toISOString());
      }
      if (niche !== "all") {
        q = q.eq("niche", niche);
      }
      const { data } = await q.order("trend_score", { ascending: false }).limit(1000);
      return data || [];
    },
    staleTime: 60_000,
  });

  const videos = useMemo(() => {
    return allVideos.slice(0, visibleCount);
  }, [allVideos, visibleCount]);

  const hasMore = visibleCount < allVideos.length;
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


  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold text-foreground">Тренды 🔥</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Обновление..." : "Обновить"}
            </button>
          <div className="flex bg-card rounded-xl p-1 border border-border/50 card-shadow">
            {([1, 3, 7, 30, 0] as const).map((p) => (
              <button
                key={p}
                onClick={() => { setPeriod(p); setVisibleCount(PAGE_SIZE); }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  period === p
                    ? "gradient-hero text-primary-foreground glow-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p === 0 ? "Все" : p === 1 ? "24ч" : `${p}д`}
              </button>
            ))}
          </div>
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

          {allVideos.length > 0 && (
            <span className="self-center text-xs text-muted-foreground ml-2">
              {allVideos.length} видео
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {videos.map((video: any, i: number) => {
              const timeAgo = getTimeAgo(video.published_at);
              const score = video.trend_score || 0;
              const velViews = video.velocity_views || 0;
              const isRocket = score > 500;
              const isFire = score > 100;

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

                        {/* Open in TikTok button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); window.open(video.url, '_blank'); }}
                          className="absolute top-12 right-2.5 z-10 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-foreground" />
                        </button>

                        {/* Play button center */}
                        <div
                          className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          onClick={() => setPlayingId(video.id)}
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
