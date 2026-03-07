import { useState, useRef, useCallback, useEffect, forwardRef } from "react";
import {
  Eye, Heart, MessageCircle, Share2, Play, ExternalLink, Music, X,
  Trophy, Zap, Target, TrendingUp, Loader2, Maximize
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

/** Global in-memory cache for play URLs to avoid redundant API calls */
const playUrlCache = new Map<string, string>();

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

const tierConfig: Record<TrendTier, { label: string; icon: any; className: string }> = {
  strong: { label: "Взлетает", icon: Trophy, className: "bg-amber-500/90 text-white" },
  mid: { label: "В тренде", icon: Zap, className: "bg-primary/80 text-white" },
  micro: { label: "Набирает", icon: Target, className: "bg-accent/80 text-white" },
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
}, ref) {
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [loadingPlay, setLoadingPlay] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const preloadedUrlRef = useRef<string | null>(null);
  const isMobile = useIsMobile();

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

  // Preload play URL on desktop hover (debounced 600ms to avoid wasted calls)
  const preloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePreload = useCallback(() => {
    if (isMobile) return; // no preload on mobile — save credits
    if (playUrlCache.has(video.url) || preloadedUrlRef.current) return;
    if (preloadTimer.current) return; // already scheduled

    preloadTimer.current = setTimeout(async () => {
      preloadTimer.current = null;
      if (playUrlCache.has(video.url) || preloadedUrlRef.current) return;
      try {
        const { data } = await supabase.functions.invoke("socialkit", {
          body: { action: "get_play_url", video_url: video.url },
        });
        if (data?.play_url) {
          preloadedUrlRef.current = data.play_url;
          playUrlCache.set(video.url, data.play_url);
        }
      } catch {}
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
      const { data, error } = await supabase.functions.invoke("socialkit", {
        body: { action: "get_play_url", video_url: video.url },
      });
      if (error || !data?.play_url) {
        console.error("Failed to get play URL:", error || data?.error);
        setPlayUrl(null);
      } else {
        setPlayUrl(data.play_url);
        playUrlCache.set(video.url, data.play_url);
      }
    } catch (e) {
      console.error("Play URL fetch error:", e);
      setPlayUrl(null);
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
    <div className={`group rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-200 relative flex flex-col ${darkMode ? "bg-[#1a1a1a] border border-white/10" : "bg-card border border-border/40"}`} onMouseEnter={handlePreload} onMouseLeave={handlePreloadCancel} onTouchStart={handlePreload}>
      {/* Video area */}
      <div className="relative aspect-[9/14] bg-black overflow-hidden rounded-2xl m-2">
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
            ) : playUrl ? (
              <video
                ref={videoRef}
                src={playUrl}
                className="w-full h-full object-contain bg-black"
                controls
                autoPlay
                playsInline
              />
            ) : (
              <iframe
                src={`https://www.tiktok.com/player/v1/${videoId}?music_info=1&description=0&muted=0&play_button=1&volume_control=1`}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
              />
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
              <div className="relative w-full h-full cursor-pointer" onClick={handlePlay}>
                <img
                  src={activeCover}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                  onError={() => handleCoverError()}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Outer glow ring */}
                    <div className="absolute -inset-2 rounded-full bg-white/10 group-hover:bg-white/20 blur-md transition-all duration-300" />
                    {/* Main play button */}
                    <div className="relative h-14 w-14 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/20 group-hover:bg-white group-hover:border-white/80 group-hover:scale-110 transition-all duration-300">
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

            {/* TikTok header bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-2.5 z-10 pointer-events-none">
              <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm">
                <Music className="h-3 w-3 text-foreground" />
                <span className="text-[11px] font-bold text-foreground">Tik-Tok</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleFav(video.id); }}
                  className="pointer-events-auto w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                >
                  <Heart
                    className={`h-4 w-4 transition-all ${
                      isFavorite ? "text-primary fill-primary" : "text-primary"
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

            {/* Open in TikTok */}
            <button
              onClick={(e) => { e.stopPropagation(); window.open(video.url, '_blank'); }}
              className="absolute top-12 right-2.5 z-10 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
            >
              <ExternalLink className="h-3.5 w-3.5 text-foreground" />
            </button>

            {/* Duration badge */}
            {video.duration && video.duration > 0 && (
              <div className="absolute bottom-2.5 left-2.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, "0")}
              </div>
            )}

            {/* Bottom gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-around px-2 py-2 border-b border-border/30">
        <span className="flex flex-col items-center gap-0.5">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="text-[11px] font-bold text-foreground">{fmt(views)}</span>
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
      {showAuthor && video.author_username && (
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
      )}

      {/* Caption */}
      <div className="px-3 pt-1.5 pb-1">
        <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">
          {caption || "Без описания"}
        </p>
      </div>

      {/* Time ago */}
      {timeAgo && (
        <div className="px-3 pb-2">
          <span className="text-[11px] text-muted-foreground">{timeAgo}</span>
        </div>
      )}

      {/* Analyze button */}
      {showAnalyzeButton && onAnalyze && (
        <div className="px-3 pb-3 mt-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAnalyze(video);
            }}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Анализ видео
          </button>
        </div>
      )}
    </div>
  );
});
