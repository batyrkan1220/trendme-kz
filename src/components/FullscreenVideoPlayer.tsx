import { useRef, useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X, Eye, Heart, MessageCircle, Share2,
  Flame, Rocket, Zap, TrendingUp, Loader2, ExternalLink,
  Play, RotateCcw
} from "lucide-react";

interface VideoInfo {
  id: string;
  url: string;
  platform_video_id?: string;
  cover_url?: string;
  caption?: string;
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

interface FullscreenVideoPlayerProps {
  video: VideoInfo;
  playUrl: string | null;
  loading: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFav: (id: string) => void;
  onAnalyze?: (video: VideoInfo) => void;
}

const fmt = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
};

type TrendTier = "strong" | "mid" | "micro";
const getTier = (views: number): TrendTier | null => {
  if (views >= 80_000) return "strong";
  if (views >= 15_000) return "mid";
  if (views >= 3_000) return "micro";
  return null;
};

const tierConfig: Record<TrendTier, { label: string; icon: any; bg: string }> = {
  strong: { label: "🔥 Взлетает", icon: Rocket, bg: "bg-gradient-to-r from-red-500 to-orange-500 text-white" },
  mid: { label: "⚡ В тренде", icon: Zap, bg: "bg-gradient-to-r from-amber-500 to-yellow-400 text-black" },
  micro: { label: "📈 Набирает", icon: TrendingUp, bg: "bg-gradient-to-r from-emerald-500 to-green-400 text-white" },
};

export function FullscreenVideoPlayer({
  video,
  playUrl,
  loading,
  onClose,
  isFavorite,
  onToggleFav,
  onAnalyze,
}: FullscreenVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const views = Number(video.views) || 0;
  const tier = getTier(views);
  const videoId = video.platform_video_id || video.id;

  const velViews = (() => {
    const pub = video.published_at || video.createTime;
    if (!pub || !views) return 0;
    const pubMs = typeof pub === "number" ? (pub > 1e12 ? pub : pub * 1000) : new Date(pub).getTime();
    const hoursAlive = Math.max((Date.now() - pubMs) / 3600000, 1);
    return views / hoursAlive;
  })();

  // Paused state & ended state for tap-to-pause TikTok style
  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const pauseIconTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Swipe down to close
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const touchStartRef = useRef<{ y: number; x: number; time: number } | null>(null);
  const isSwiping = useRef(false);
  const closingViaHistoryRef = useRef(false);

  const closeOverlay = useCallback(() => {
    if (closingViaHistoryRef.current) return;
    if (window.history.state?.__videoOverlay) {
      closingViaHistoryRef.current = true;
      window.history.back();
      return;
    }
    onClose();
  }, [onClose]);

  // Tap to pause/play (TikTok style)
  const handleVideoTap = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;

    if (ended) {
      // Replay
      vid.currentTime = 0;
      vid.play();
      setEnded(false);
      setPaused(false);
      return;
    }

    if (vid.paused) {
      vid.play();
      setPaused(false);
    } else {
      vid.pause();
      setPaused(true);
    }

    // Flash pause/play icon
    setShowPauseIcon(true);
    if (pauseIconTimer.current) clearTimeout(pauseIconTimer.current);
    pauseIconTimer.current = setTimeout(() => setShowPauseIcon(false), 600);
  }, [ended]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    touchStartRef.current = { y: e.touches[0].clientY, x: e.touches[0].clientX, time: Date.now() };
    isSwiping.current = false;
    setDragging(true);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (!touchStartRef.current) return;
    const dy = e.touches[0].clientY - touchStartRef.current.y;
    const dx = Math.abs(e.touches[0].clientX - touchStartRef.current.x);
    if (dy > 10 || dx > 10) isSwiping.current = true;
    if (dy > 0) setDragY(dy);
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const start = touchStartRef.current;
    if (start) {
      const velocity = dragY / (Date.now() - start.time);
      if (dragY > 120 || velocity > 0.5) {
        closeOverlay();
      } else if (!isSwiping.current && dragY < 5) {
        // It was a tap, not a swipe
        handleVideoTap();
      }
    }
    setDragY(0);
    setDragging(false);
    touchStartRef.current = null;
  }, [dragY, closeOverlay, handleVideoTap]);

  // Auto-play when URL is ready & loop
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !playUrl || playUrl === "tiktok_embed_fallback") return;

    const onEnded = () => {
      setEnded(true);
      setPaused(true);
    };

    vid.addEventListener("ended", onEnded);

    // Try auto-play
    vid.play().catch(() => {});

    return () => {
      vid.removeEventListener("ended", onEnded);
    };
  }, [playUrl]);

  // Push history marker so back gesture closes overlay first
  useEffect(() => {
    window.history.pushState({ ...(window.history.state || {}), __videoOverlay: true, __videoId: video.id }, "");

    const onPopState = () => {
      onClose();
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      closingViaHistoryRef.current = false;
    };
  }, [video.id, onClose]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Handle escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeOverlay(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeOverlay]);

  const opacity = Math.max(1 - dragY / 300, 0.3);

  const content = (
    <div
      className="fixed inset-0 z-[9999] bg-black flex flex-col"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        transform: dragY > 0 ? `translateY(${dragY}px) scale(${1 - dragY / 1500})` : undefined,
        opacity,
        transition: dragging ? "none" : "transform 0.3s ease, opacity 0.3s ease",
        borderRadius: dragY > 20 ? `${Math.min(dragY / 4, 24)}px` : undefined,
        overflow: "hidden",
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pt-2"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); closeOverlay(); }}
          className="h-9 w-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
        >
          <X className="h-5 w-5 text-white/90" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); window.open(video.url, '_blank'); }}
          className="h-9 w-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
        >
          <ExternalLink className="h-4 w-4 text-white/90" />
        </button>
      </div>

      {/* Video area — full screen, no controls */}
      <div className="absolute inset-0 flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            {video.cover_url && (
              <img src={video.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm" />
            )}
            <div className="relative z-10 h-14 w-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
            <span className="relative z-10 text-white/50 text-xs animate-pulse">Загрузка...</span>
          </div>
        ) : playUrl === "tiktok_embed_fallback" ? (
          <iframe
            src={`https://www.tiktok.com/player/v1/${videoId}?&music_info=0&description=0&rel=0`}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope"
            allowFullScreen
            scrolling="no"
          />
        ) : playUrl ? (
          <>
            <video
              ref={videoRef}
              src={playUrl}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              preload="auto"
              loop={false}
            />
            {/* Tap pause/play indicator */}
            {showPauseIcon && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                <div className="h-20 w-20 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center animate-fade-in">
                  {ended ? (
                    <RotateCcw className="h-10 w-10 text-white" />
                  ) : paused ? (
                    <Play className="h-10 w-10 text-white ml-1" />
                  ) : (
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-8 bg-white rounded-sm" />
                      <div className="w-2.5 h-8 bg-white rounded-sm" />
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Ended — replay overlay */}
            {ended && !showPauseIcon && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                <div className="h-20 w-20 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <RotateCcw className="h-10 w-10 text-white" />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <p className="text-white/50 text-xs">Видео недоступно</p>
            <button
              onClick={() => window.open(video.url, '_blank')}
              className="px-4 py-2 rounded-full bg-white/10 text-white text-xs font-medium"
            >
              Открыть в TikTok
            </button>
          </div>
        )}
      </div>

      {/* Bottom overlay — video info */}
      <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      >
        <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-20 px-4 pb-3">
          {/* Right side — action buttons */}
          <div className="absolute right-3 bottom-16 flex flex-col items-center gap-5 pointer-events-auto"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFav(video.id); }}
              className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
            >
              <Heart className={`h-7 w-7 ${isFavorite ? "text-red-500 fill-red-500" : "text-white"}`} />
              <span className="text-white/70 text-[10px] font-medium">{fmt(Number(video.likes))}</span>
            </button>
            <div className="flex flex-col items-center gap-1">
              <MessageCircle className="h-6 w-6 text-white" />
              <span className="text-white/70 text-[10px] font-medium">{fmt(Number(video.comments))}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Share2 className="h-6 w-6 text-white" />
              <span className="text-white/70 text-[10px] font-medium">{fmt(Number(video.shares || 0))}</span>
            </div>
          </div>

          {/* Left side — text info */}
          <div className="pr-16 pointer-events-auto"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* Tier badge */}
            {tier && (
              <div className="flex items-center gap-2 mb-2">
                <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${tierConfig[tier].bg}`}>
                  {(() => { const Icon = tierConfig[tier].icon; return <Icon className="h-3.5 w-3.5" />; })()}
                  {tierConfig[tier].label}
                </div>
                {velViews >= 500 && (
                  <div className="flex items-center gap-1 rounded-full px-2 py-1 bg-white/10 backdrop-blur-sm border border-white/15">
                    <Flame className="h-3 w-3 text-orange-400" />
                    <span className="text-[10px] font-bold text-white">+{fmt(Math.round(velViews))}/ч</span>
                  </div>
                )}
              </div>
            )}

            {/* Username */}
            {video.author_username && (
              <div className="flex items-center gap-2 mb-1.5">
                {video.author_avatar_url && (
                  <img src={video.author_avatar_url} alt="" className="h-8 w-8 rounded-full border border-white/20 object-cover" />
                )}
                <span className="text-white font-bold text-sm">@{video.author_username}</span>
              </div>
            )}

            {/* Views */}
            <div className="flex items-center gap-1 mb-1.5">
              <Eye className="h-3.5 w-3.5 text-white/60" />
              <span className="text-white/80 text-xs font-semibold">{fmt(views)} просмотров</span>
            </div>

            {/* Caption */}
            {video.caption && (
              <p className="text-white/70 text-xs leading-relaxed line-clamp-2">
                {video.caption}
              </p>
            )}

            {/* Analyze button */}
            {onAnalyze && (
              <button
                onClick={(e) => { e.stopPropagation(); onAnalyze(video); onClose(); }}
                className="mt-3 w-full py-2.5 rounded-[14px] text-sm font-bold tracking-wide bg-neon text-neon-foreground active:scale-[0.97] transition-transform"
                style={{ boxShadow: "0 4px 20px hsl(72 100% 50% / 0.25)" }}
              >
                Анализировать видео
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
