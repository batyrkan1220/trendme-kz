import { useState, useRef, useCallback, useEffect, forwardRef, memo } from "react";
import {
  Eye, Heart, MessageCircle, Share2, Play, ExternalLink, Music, X,
  Trophy, Zap, Target, TrendingUp, Loader2, Maximize, Flame, Rocket
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

/** Global in-memory cache for play URLs to avoid redundant API calls */
const playUrlCache = new Map<string, string>();

/** Global in-flight request tracker to prevent duplicate concurrent API calls */
const inFlightRequests = new Map<string, Promise<string | null>>();

/** Centralized function to fetch play URL with deduplication */
async function fetchPlayUrlDeduped(videoUrl: string): Promise<string | null> {
  // Check cache first
  const cached = playUrlCache.get(videoUrl);
  if (cached) return cached;

  // Check if request is already in progress
  const existing = inFlightRequests.get(videoUrl);
  if (existing) return existing;

  // Create new request
  const promise = (async (): Promise<string | null> => {
    try {
      const { data } = await supabase.functions.invoke("socialkit", {
        body: { action: "get_play_url", video_url: videoUrl },
      });
      if (data?.play_url) {
        playUrlCache.set(videoUrl, data.play_url);
        return data.play_url;
      }
      return null;
    } catch {
      return null;
    } finally {
      inFlightRequests.delete(videoUrl);
    }
  })();

  inFlightRequests.set(videoUrl, promise);
  return promise;
}

const fmt = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
};

const getTimeAgo = (published_at: string | number | null) => {
  if (!published_at) return "";
  let ms: number;
  if (typeof published_at === "number") {
    ms = published_at > 1e12 ? published_at : published_at * 1000;
  } else {
    ms = new Date(published_at).getTime();
  }
  const h = Math.floor((Date.now() - ms) / 3600000);
  if (h < 1) return "только что";
  if (h < 24) return `${h}ч назад`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}д назад`;
  return `${Math.floor(d / 30)} мес. назад`;
};

/** Convert TikTok origin cover URLs to JPEG variants for iOS WebView compatibility */
function optimizeCoverUrl(url: string | null | undefined): string | null | undefined {
  if (!url) return url;
  // Don't transform signed CDN URLs — changing the path invalidates the signature
  if (url.includes("x-signature=") || url.includes("x-expires=")) return url;
  // Convert origin WEBP to cropped JPEG for iOS compatibility
  if (url.includes("tplv-tiktokx-origin.image")) {
    return url.replace(
      /tplv-tiktokx-origin\.image/,
      "tplv-tiktokx-cropcenter-q:300:400:q72.jpeg"
    );
  }
  // Convert any remaining .webp TikTok URLs to .jpeg where possible
  if (url.includes(".webp") && (url.includes("tiktokcdn") || url.includes("tiktok"))) {
    return url.replace(/\.webp/, ".jpeg");
  }
  return url;
}

type TrendTier = "strong" | "mid" | "micro";

const getTier = (views: number): TrendTier | null => {
  if (views >= 80_000) return "strong";
  if (views >= 15_000) return "mid";
  if (views >= 3_000) return "micro";
  return null;
};

const tierConfig: Record<TrendTier, { label: string; icon: any; className: string; glow?: string }> = {
  strong: { label: "🔥 Взлетает", icon: Rocket, className: "bg-gradient-to-r from-red-500 to-orange-500 text-white", glow: "0 0 12px rgba(239,68,68,0.6), 0 0 24px rgba(249,115,22,0.3)" },
  mid: { label: "⚡ В тренде", icon: Zap, className: "bg-gradient-to-r from-amber-500 to-yellow-400 text-black", glow: "0 0 10px rgba(245,158,11,0.5)" },
  micro: { label: "📈 Набирает", icon: TrendingUp, className: "bg-gradient-to-r from-emerald-500 to-green-400 text-white", glow: "0 0 8px rgba(16,185,129,0.4)" },
};

export interface VideoCardData {
  id: string;
  platform_video_id?: string;
  url: string;
  cover_url?: string;
  cover?: string;
  caption?: string;
  desc?: string;
  author_username?: string;
  author_avatar_url?: string;
  views: number;
  likes: number;
  comments: number;
  shares?: number;
  velocity_views?: number;
  published_at?: string | null;
  createTime?: number;
  duration?: number;
}

interface VideoCardProps {
  video: VideoCardData;
  playingId: string | null;
  onPlay: (id: string | null) => void;
  isFavorite: boolean;
  onToggleFav: (id: string) => void;
  onAnalyze?: (video: VideoCardData) => void;
  showTier?: boolean;
  showAuthor?: boolean;
  showAnalyzeButton?: boolean;
  darkMode?: boolean;
  isMobileOverride?: boolean;
}

export const VideoCard = forwardRef<HTMLDivElement, VideoCardProps>(function VideoCard({
  video,
  playingId,
  onPlay,
  isFavorite,
  onToggleFav,
  onAnalyze,
  showTier = true,
  showAuthor = true,
  showAnalyzeButton = true,
  darkMode = false,
  isMobileOverride,
}, ref) {
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [loadingPlay, setLoadingPlay] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const preloadedUrlRef = useRef<string | null>(null);
  const isMobileFromHook = useIsMobile();
  const isMobile = isMobileOverride ?? isMobileFromHook;

  // Auto-fullscreen on mobile when video is ready
  useEffect(() => {
    if (!isMobile || !playUrl || !videoRef.current) return;
    const el = videoRef.current;
    const goFull = () => {
      try {
        if (el.requestFullscreen) el.requestFullscreen();
        else if ((el as any).webkitEnterFullscreen) (el as any).webkitEnterFullscreen();
      } catch {}
    };
    el.addEventListener("loadeddata", goFull, { once: true });

    const onFsChange = () => {
      if (!document.fullscreenElement) {
        onPlay(null);
        setPlayUrl(null);
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);

    return () => {
      el.removeEventListener("loadeddata", goFull);
      document.removeEventListener("fullscreenchange", onFsChange);
    };
  }, [isMobile, playUrl, onPlay]);

  // Preload play URL on hover (desktop only — disabled on mobile to save credits)
  const preloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePreload = useCallback(() => {
    // DISABLED on mobile — no hover, only wastes credits on scroll
    if (isMobile) return;
    if (playUrlCache.has(video.url) || preloadedUrlRef.current) return;
    if (preloadTimer.current) return;

    // Desktop only: 600ms delay to ensure intentional hover
    preloadTimer.current = setTimeout(async () => {
      preloadTimer.current = null;
      if (playUrlCache.has(video.url) || preloadedUrlRef.current) return;
      const url = await fetchPlayUrlDeduped(video.url);
      if (url) {
        preloadedUrlRef.current = url;
      }
    }, 600);
  }, [isMobile, video.url]);

  const handlePreloadCancel = useCallback(() => {
    if (preloadTimer.current) {
      clearTimeout(preloadTimer.current);
      preloadTimer.current = null;
    }
  }, []);

  // Cover refresh disabled on client — handled by background maintenance only
  const handleCoverError = useCallback(() => {
    setCoverFailed(true);
  }, []);

  const handlePlay = async () => {
    if (playingId === video.id) {
      onPlay(null);
      setPlayUrl(null);
      return;
    }
    onPlay(video.id);

    // Check global cache first
    const cached = playUrlCache.get(video.url);
    if (cached) {
      setPlayUrl(cached);
      return;
    }

    // Use preloaded URL if available
    if (preloadedUrlRef.current) {
      setPlayUrl(preloadedUrlRef.current);
      playUrlCache.set(video.url, preloadedUrlRef.current);
      return;
    }

    setLoadingPlay(true);
    try {
      // Use centralized deduped fetch
      const url = await fetchPlayUrlDeduped(video.url);
      if (!url) {
        console.warn("Play URL unavailable, using TikTok embed fallback");
        setPlayUrl("tiktok_embed_fallback");
      } else {
        setPlayUrl(url);
      }
    } catch (e) {
      console.warn("Play URL fetch error, using TikTok embed fallback:", e);
      setPlayUrl("tiktok_embed_fallback");
    } finally {
      setLoadingPlay(false);
    }
  };

  const handleFullscreen = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
    else if ((el as any).webkitEnterFullscreen) (el as any).webkitEnterFullscreen();
  };

  const views = Number(video.views) || 0;
  const tier = showTier ? getTier(views) : null;
  const velViews = video.velocity_views || 0;
  const activeCover = optimizeCoverUrl(video.cover_url || video.cover);
  const caption = video.caption || video.desc || "";
  const videoId = video.platform_video_id || video.id;
  const timeAgo = getTimeAgo(video.published_at || video.createTime || null);

  return (
    <div ref={ref} className={`group rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-200 relative flex flex-col ${darkMode ? "bg-[#1a1a1a] border border-white/10" : "bg-card border border-border/40"}`} onMouseEnter={handlePreload} onMouseLeave={handlePreloadCancel} onTouchStart={handlePreload}>
      {/* Video area */}
      <div className="relative aspect-[9/14] bg-black overflow-hidden rounded-xl m-1.5">
        {playingId === video.id ? (
          <>
            {loadingPlay ? (
              <div className="w-full h-full relative overflow-hidden">
                {/* Keep cover image as background */}
                {activeCover && !coverFailed ? (
                  <img src={activeCover} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted/80" />
                )}
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
                {/* Animated rings */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full border-2 border-white/15 animate-ping" style={{ animationDuration: '2s' }} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-2 border-white/20 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
                </div>
                {/* Center loader */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/20 backdrop-blur-md flex items-center justify-center border border-primary/30 shadow-lg shadow-primary/20">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  </div>
                  <span className="text-[11px] text-white/80 font-medium tracking-wide animate-pulse">Загрузка...</span>
                </div>
              </div>
            ) : playUrl === "tiktok_embed_fallback" ? (
              <div className="w-full h-full bg-black overflow-hidden relative">
                <iframe
                  src={`https://www.tiktok.com/player/v1/${videoId}?&music_info=0&description=0&rel=0`}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope"
                  allowFullScreen
                  scrolling="no"
                />
              </div>
            ) : playUrl ? (
              <video
                ref={videoRef}
                src={playUrl}
                className="w-full h-full object-contain bg-black"
                controls
                autoPlay
                playsInline
                preload="auto"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-black gap-3">
                <p className="text-white/50 text-xs text-center px-4">Видео қолжетімсіз</p>
                <button
                  onClick={() => window.open(video.url, '_blank')}
                  className="px-4 py-2 rounded-full bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition-colors"
                >
                  TikTok-та ашу
                </button>
              </div>
            )}
            <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
              {playUrl && (
                <button
                  onClick={handleFullscreen}
                  className="bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
                  aria-label="Толық экран"
                >
                  <Maximize className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => { onPlay(null); setPlayUrl(null); }}
                className="bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
                aria-label="Закрыть видео"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <>
            {activeCover && !coverFailed ? (
              <div className="relative w-full h-full cursor-pointer">
                <img
                  src={activeCover}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                  onClick={handlePlay}
                  onError={() => handleCoverError()}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative">
                    {/* Outer glow ring */}
                    <div className="absolute -inset-2 rounded-full bg-white/10 group-hover:bg-white/20 blur-md transition-all duration-300" />
                    {/* Main play button */}
                    <div 
                      className="relative h-14 w-14 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/20 group-hover:bg-white group-hover:border-white/80 group-hover:scale-110 transition-all duration-300 pointer-events-auto cursor-pointer"
                      onClick={handlePlay}
                    >
                      <Play className="h-6 w-6 text-white group-hover:text-foreground ml-0.5 transition-colors duration-300" fill="currentColor" fillOpacity={0.3} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center cursor-pointer bg-gradient-to-b from-muted/60 to-muted gap-3 p-4"
                onClick={handlePlay}
              >
                <div className="h-14 w-14 rounded-full bg-black/15 flex items-center justify-center border border-white/10">
                  <Play className="h-7 w-7 text-muted-foreground/60 ml-0.5" />
                </div>
                {caption && (
                  <p className="text-[11px] text-muted-foreground text-center px-2 line-clamp-3 leading-relaxed">{caption}</p>
                )}
              </div>
            )}

            {/* TikTok header bar - OUTSIDE of cover click area */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-1.5 z-20">
              <div className={`flex items-center gap-1 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-sm ${darkMode ? "bg-neon/90" : "bg-white/90"}`}>
                <Music className={`h-2.5 w-2.5 ${darkMode ? "text-black" : "text-foreground"}`} />
                <span className={`text-[9px] font-bold ${darkMode ? "text-black" : "text-foreground"}`}>Tik-Tok</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("[VideoCard] Heart touchend fired for:", video.id);
                    onToggleFav(video.id);
                  }}
                  onClick={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    console.log("[VideoCard] Heart click fired for:", video.id);
                    onToggleFav(video.id);
                  }}
                  className={`w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center shadow-md active:scale-95 transition-transform border border-white/20 ${darkMode ? "bg-black/60" : "bg-black/60"}`}
                  style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
                >
                  <Heart
                    className={`h-4 w-4 transition-all ${
                      isFavorite
                        ? darkMode ? "text-neon fill-neon" : "text-primary fill-primary"
                        : "text-white"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Tier badge */}
            {tier && (
              <div className="absolute top-10 left-1.5 z-10 flex flex-col gap-1.5 pointer-events-none">
                <div
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 shadow-lg ${tierConfig[tier].className}`}
                  style={{ boxShadow: tierConfig[tier].glow, animation: tier === "strong" ? "pulse 2s ease-in-out infinite" : undefined }}
                >
                  {(() => {
                    const Icon = tierConfig[tier].icon;
                    return <Icon className="h-3.5 w-3.5" />;
                  })()}
                  <span className="text-[10px] font-extrabold tracking-wide">{tierConfig[tier].label}</span>
                </div>
                {velViews > 10 && (
                  <div
                    className="flex items-center gap-1 rounded-full px-2.5 py-1"
                    style={{
                      background: tier === "strong" ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.15)",
                      backdropFilter: "blur(12px)",
                      border: tier === "strong" ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    <Flame className={`h-3.5 w-3.5 ${tier === "strong" ? "text-orange-400" : "text-white"}`} />
                    <span className={`text-[10px] font-bold ${tier === "strong" ? "text-orange-300" : "text-white"}`}>+{fmt(Math.round(velViews))}/ч</span>
                  </div>
                )}
              </div>
            )}

            {/* Open in TikTok */}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(video.url, '_blank'); }}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); window.open(video.url, '_blank'); }}
              className="absolute top-11 right-1.5 z-10 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center shadow-md active:scale-95 transition-transform border border-white/20"
              style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
            >
              <ExternalLink className="h-4 w-4 text-white" />
            </button>

            {/* Duration badge */}
            {video.duration && video.duration > 0 && (
              <div className="absolute bottom-2.5 left-2.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, "0")}
              </div>
            )}

            {/* Bottom gradient — subtle */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
          </>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 px-3 py-1.5">
        <span className="flex items-center gap-1">
          <Eye className={`h-3.5 w-3.5 shrink-0 ${darkMode ? "text-white/50" : "text-muted-foreground"}`} />
          <span className={`text-[11px] font-bold truncate ${darkMode ? "text-white" : "text-foreground"}`}>{fmt(views)}</span>
        </span>
        <span className="flex items-center gap-1">
          <Heart className={`h-3.5 w-3.5 shrink-0 ${darkMode ? "text-white/50" : "text-muted-foreground"}`} />
          <span className={`text-[11px] font-bold truncate ${darkMode ? "text-white" : "text-foreground"}`}>{fmt(Number(video.likes))}</span>
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className={`h-3.5 w-3.5 shrink-0 ${darkMode ? "text-white/50" : "text-muted-foreground"}`} />
          <span className={`text-[11px] font-bold truncate ${darkMode ? "text-white" : "text-foreground"}`}>{fmt(Number(video.comments))}</span>
        </span>
        <span className="flex items-center gap-1">
          <Share2 className={`h-3.5 w-3.5 shrink-0 ${darkMode ? "text-white/50" : "text-muted-foreground"}`} />
          <span className={`text-[11px] font-bold truncate ${darkMode ? "text-white" : "text-foreground"}`}>{fmt(Number(video.shares || 0))}</span>
        </span>
      </div>

      {/* Caption — fixed height */}
      <div className="px-3 pt-1.5 pb-0.5 h-[2.75rem]">
        <p className={`text-xs line-clamp-2 leading-relaxed ${darkMode ? "text-white" : "text-foreground/80"}`}>
          {caption || "Без описания"}
        </p>
      </div>

      {/* Time ago — always show */}
      <div className="px-3 pb-2">
        <span className={`text-[11px] ${darkMode ? "text-white/60" : "text-muted-foreground"}`}>{timeAgo || " "}</span>
      </div>

      {/* Analyze button */}
      {showAnalyzeButton && onAnalyze && (
        <div className="px-3 pb-3 mt-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAnalyze(video);
            }}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity ${darkMode ? "bg-neon text-black" : "bg-primary text-primary-foreground"}`}
          >
            Анализ видео
          </button>
        </div>
      )}
    </div>
  );
});

export const MemoVideoCard = memo(VideoCard);
