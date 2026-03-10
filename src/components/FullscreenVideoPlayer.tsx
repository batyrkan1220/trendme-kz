import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X, Eye, Heart, MessageCircle, Share2,
  Flame, Rocket, Zap, TrendingUp, Loader2, ExternalLink
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

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Handle back button / escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const content = (
    <div
      className="fixed inset-0 z-[9999] bg-black flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pt-2"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
      >
        <button
          onClick={onClose}
          className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
        >
          <X className="h-5 w-5 text-white/90" />
        </button>
        <button
          onClick={() => window.open(video.url, '_blank')}
          className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
        >
          <ExternalLink className="h-4 w-4 text-white/90" />
        </button>
      </div>

      {/* Video area */}
      <div className="flex-1 flex items-center justify-center relative">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
            <span className="text-white/50 text-xs animate-pulse">Загрузка...</span>
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
          <video
            ref={videoRef}
            src={playUrl}
            className="w-full h-full object-contain"
            controls
            autoPlay
            playsInline
            preload="auto"
          />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <p className="text-white/50 text-xs">Видео қолжетімсіз</p>
            <button
              onClick={() => window.open(video.url, '_blank')}
              className="px-4 py-2 rounded-full bg-white/10 text-white text-xs font-medium"
            >
              TikTok-та ашу
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
          >
            <button
              onClick={() => onToggleFav(video.id)}
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
          <div className="pr-16 pointer-events-auto">
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
              <span className="text-white/80 text-xs font-semibold">{fmt(views)} қаралым</span>
            </div>

            {/* Caption */}
            {video.caption && (
              <p className="text-white/70 text-xs leading-relaxed line-clamp-3">
                {video.caption}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
