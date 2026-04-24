import { useState, useRef, useCallback, useEffect, forwardRef, memo } from "react";
import {
  Eye, Heart, MessageCircle, Play, ExternalLink, X,
  Loader2, Maximize, Flag, Sparkles, Flame, TrendingUp, Star, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { FullscreenVideoPlayer } from "@/components/FullscreenVideoPlayer";
import { ReportContentDialog } from "@/components/ReportContentDialog";
import {
  fetchPlayUrlDeduped as _fetchPlayUrlDeduped,
  resolvePlayback,
  getCachedPlayUrl,
  setCachedPlayUrl,
  TIKTOK_EMBED_FALLBACK,
  INSTAGRAM_EMBED,
} from "@/lib/api/videoPlayback";
import { detectVideoPlatform } from "@/lib/api/videoAnalysis";

// Re-export so existing call sites `import { fetchPlayUrlDeduped } from "./VideoCard"` keep working.
export const fetchPlayUrlDeduped = _fetchPlayUrlDeduped;

/** Broken cover collector — batches broken video IDs and sends to cleanup function */
const brokenCoverIds = new Set<string>();
let brokenCoverTimer: ReturnType<typeof setTimeout> | null = null;

async function flushBrokenCovers() {
  if (brokenCoverIds.size === 0) return;
  const ids = Array.from(brokenCoverIds);
  brokenCoverIds.clear();
  brokenCoverTimer = null;

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  if (!projectId) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    fetch(`https://${projectId}.supabase.co/functions/v1/cleanup-broken-covers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ video_ids: ids }),
    }).catch(() => {});
  } catch {
    // silently fail
  }
}

function reportBrokenCover(videoId: string) {
  brokenCoverIds.add(videoId);
  if (brokenCoverTimer) clearTimeout(brokenCoverTimer);
  brokenCoverTimer = setTimeout(flushBrokenCovers, 5000); // 5s debounce
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

/** Convert TikTok origin cover URLs to JPEG variants for iOS WebView compatibility.
 *  Also strip expired signatures so CDN can still serve the image unsigned. */
function optimizeCoverUrl(url: string | null | undefined): string | null | undefined {
  if (!url) return url;

  // Check if signed URL has expired — strip signature params to try unsigned access
  if (url.includes("x-expires=")) {
    const match = url.match(/x-expires=(\d+)/);
    if (match) {
      const expiresAt = parseInt(match[1], 10);
      const nowSec = Math.floor(Date.now() / 1000);
      if (expiresAt < nowSec) {
        // URL expired — strip all signing params and try unsigned
        const cleaned = url
          .replace(/[&?]x-signature=[^&]*/g, "")
          .replace(/[&?]x-expires=[^&]*/g, "")
          .replace(/[&?]refresh_token=[^&]*/g, "")
          .replace(/[&?]s=[^&]*/g, "")
          .replace(/[&?]sc=[^&]*/g, "")
          .replace(/[&?]shcp=[^&]*/g, "")
          .replace(/[&?]shp=[^&]*/g, "")
          .replace(/[&?]t=[^&]*/g, "")
          .replace(/[&?]biz_tag=[^&]*/g, "")
          .replace(/[&?]dr=[^&]*/g, "")
          .replace(/[&?]idc=[^&]*/g, "")
          .replace(/[&?]ps=[^&]*/g, "")
          .replace(/\?$/, "");
        return cleaned;
      }
    }
    // Still valid signed URL — don't transform
    return url;
  }

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

/** Premium tier pills — icon + label, viral lime for HOT, glass for TOP/RISING */
const tierConfig: Record<TrendTier, { label: string; icon: typeof Flame; className: string; iconClassName: string }> = {
  strong: {
    label: "Горячий",
    icon: Flame,
    className: "bg-viral text-foreground",
    iconClassName: "fill-foreground/20",
  },
  mid: {
    label: "Набирает",
    icon: Star,
    className: "bg-white/90 text-foreground border border-border/60 backdrop-blur-md",
    iconClassName: "fill-amber-400 text-amber-500",
  },
  micro: {
    label: "Растущий",
    icon: TrendingUp,
    className: "bg-white/90 text-foreground border border-border/60 backdrop-blur-md",
    iconClassName: "text-emerald-500",
  },
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
  onScript?: (video: VideoCardData) => void;
  showTier?: boolean;
  showAuthor?: boolean;
  showAnalyzeButton?: boolean;
  showScriptButton?: boolean;
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
  onScript,
  showTier = true,
  showAuthor = true,
  showAnalyzeButton = true,
  showScriptButton = true,
  darkMode: _darkMode, // deprecated — kept for backward compatibility, ignored
  isMobileOverride,
}, ref) {
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [loadingPlay, setLoadingPlay] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(video.author_avatar_url ?? null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const preloadedUrlRef = useRef<string | null>(null);
  const isMobileFromHook = useIsMobile();
  const isMobile = isMobileOverride ?? isMobileFromHook;

  useEffect(() => {
    setAvatarSrc(video.author_avatar_url ?? null);
  }, [video.author_avatar_url]);

  // On mobile: open fullscreen overlay instead of in-card player
  // On mobile, open fullscreen immediately when play starts (don't wait for URL)
  useEffect(() => {
    if (!isMobile) return;
    if (!showFullscreen && playingId === video.id) {
      setShowFullscreen(true);
    }
  }, [isMobile, playingId, video.id, showFullscreen]);

  // PRELOAD DISABLED ENTIRELY to save credits
  // The previous hover preload was consuming ~1400 credits/week
  const handlePreload = useCallback(() => {
    // DISABLED — hover preload was consuming too many API credits
    // Users will load video on click only
  }, []);

  const handlePreloadCancel = useCallback(() => {
    // No-op since preload is disabled
  }, []);

  const handleCoverError = useCallback(() => {
    setCoverFailed(true);
    reportBrokenCover(video.id);
  }, [video.id]);

  const extractInstagramShortcode = (u: string): string | null => {
    const m = u.match(/instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i);
    return m ? m[1] : null;
  };

  const handlePlay = async () => {
    if (playingId === video.id) {
      onPlay(null);
      setPlayUrl(null);
      return;
    }
    onPlay(video.id);

    // 1) Cached direct URL — render immediately
    const cached = getCachedPlayUrl(video.url);
    if (cached) {
      setPlayUrl(cached);
      return;
    }

    // 2) Preloaded URL hint — promote to shared cache
    if (preloadedUrlRef.current) {
      setPlayUrl(preloadedUrlRef.current);
      setCachedPlayUrl(video.url, preloadedUrlRef.current);
      return;
    }

    // 3) Resolve through the unified playback layer.
    //    Always returns either a direct URL or an embed sentinel — never null.
    setLoadingPlay(true);
    try {
      const { value } = await resolvePlayback(video.url);
      setPlayUrl(value);
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

  // Live velocity: views / hours since published (instead of stale DB value)
  const velViews = (() => {
    const pub = video.published_at || video.createTime;
    if (!pub || !views) return 0;
    const pubMs = typeof pub === "number" ? (pub > 1e12 ? pub : pub * 1000) : new Date(pub).getTime();
    const hoursAlive = Math.max((Date.now() - pubMs) / 3600000, 1);
    return views / hoursAlive;
  })();
  const activeCover = optimizeCoverUrl(video.cover_url || video.cover);
  const caption = video.caption || video.desc || "";
  const videoId = video.platform_video_id || video.id;
  const timeAgo = getTimeAgo(video.published_at || video.createTime || null);

  return (
    <div
      ref={ref}
      className="group h-full rounded-[16px] sm:rounded-[20px] overflow-hidden transition-all duration-300 relative flex flex-col bg-card/80 backdrop-blur-xl border border-border/60 shadow-soft hover:shadow-card hover:-translate-y-0.5 hover:border-border"
      style={{ boxShadow: "0 1px 0 0 hsl(0 0% 100% / 0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.4)" }}
      onMouseEnter={handlePreload}
      onMouseLeave={handlePreloadCancel}
    >
      {/* Video area — 9/14 (dashboard ratio) */}
      <div className="relative aspect-[9/14] bg-muted overflow-hidden">
        {playingId === video.id && !showFullscreen ? (
          <>
            {loadingPlay ? (
              <div className="w-full h-full relative overflow-hidden animate-fade-in">
                {activeCover && !coverFailed ? (
                  <img src={activeCover} alt="" className="w-full h-full object-cover opacity-50 blur-xl scale-110" />
                ) : (
                  <div className="w-full h-full bg-muted/80" />
                )}
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  {/* Clean ring spinner */}
                  <div className="relative h-9 w-9">
                    <div className="absolute inset-0 rounded-full border-2 border-white/15" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin" />
                  </div>
                  <span className="text-white/80 text-[13px] font-medium tracking-tight">Загрузка</span>
                </div>
              </div>
            ) : playUrl === TIKTOK_EMBED_FALLBACK ? (
              <div className="w-full h-full bg-black overflow-hidden relative">
                <iframe
                  src={`https://www.tiktok.com/player/v1/${videoId}?&music_info=0&description=0&rel=0`}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope"
                  allowFullScreen
                  scrolling="no"
                />
              </div>
            ) : playUrl === INSTAGRAM_EMBED ? (
              (() => {
                const sc = extractInstagramShortcode(video.url) || video.platform_video_id;
                return sc ? (
                  <div className="w-full h-full bg-black overflow-hidden relative">
                    <iframe
                      src={`https://www.instagram.com/reel/${sc}/embed/`}
                      className="absolute inset-0 w-full h-full border-0"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      scrolling="no"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black">
                    <button
                      onClick={() => window.open(video.url, '_blank')}
                      className="px-4 py-2 rounded-full bg-white/10 text-white text-xs font-medium"
                    >
                      Открыть в Instagram
                    </button>
                  </div>
                );
              })()
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
                <p className="text-white/60 text-xs text-center px-4">Видео недоступно</p>
                <button
                  onClick={() => window.open(video.url, '_blank')}
                  className="px-4 py-2 rounded-full bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition-colors"
                >
                  Открыть в TikTok
                </button>
              </div>
            )}
            <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
              {playUrl && (
                <button
                  onClick={handleFullscreen}
                  className="bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
                  aria-label="Полный экран"
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
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  onClick={handlePlay}
                  onError={() => handleCoverError()}
                />
                {/* Soft top vignette for top-bar legibility */}
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/55 via-black/15 to-transparent pointer-events-none" />
                {/* Bottom vignette for caption */}
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
                {/* Lux neon play button — adaptive size, always visible, scales on hover */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <button
                    type="button"
                    onClick={handlePlay}
                    aria-label="Воспроизвести"
                    className="pointer-events-auto relative h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-white/15 backdrop-blur-2xl ring-1 ring-white/30 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-viral group-hover:ring-viral/50 active:scale-95"
                    style={{
                      WebkitTapHighlightColor: "transparent",
                      boxShadow: "0 8px 32px -8px rgba(0,0,0,0.6), 0 0 0 1px hsl(0 0% 100% / 0.1) inset",
                    }}
                  >
                    {/* Glow halo on hover */}
                    <span className="absolute inset-0 rounded-full bg-viral/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                    <Play className="h-4 w-4 sm:h-5 sm:w-5 text-white ml-0.5 transition-colors duration-300 group-hover:text-foreground" fill="currentColor" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center cursor-pointer bg-gradient-to-br from-muted to-muted/60 gap-3 p-4"
                onClick={handlePlay}
              >
                <div className="h-14 w-14 rounded-full bg-foreground/10 flex items-center justify-center">
                  <Play className="h-7 w-7 text-muted-foreground ml-0.5" />
                </div>
                {caption && (
                  <p className="text-[11px] text-muted-foreground text-center px-2 line-clamp-3 leading-relaxed">{caption}</p>
                )}
              </div>
            )}

            {/* Top bar — left: platform + tier (stacked), right: favorite */}
            <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-2 sm:p-2.5 z-20 gap-2 pointer-events-none">
              {/* Left column: platform badge on top, tier+velocity below */}
              <div className="flex flex-col items-start gap-1 min-w-0 max-w-[calc(100%-44px)] pointer-events-auto">
                {(() => {
                  const platform = detectVideoPlatform(video.url);
                  if (platform === "unknown") return null;
                  const isTikTok = platform === "tiktok";
                  return (
                    <span
                      className="inline-flex items-center gap-1 h-[20px] sm:h-[22px] px-1.5 sm:px-2 rounded-full bg-black/60 backdrop-blur-md ring-1 ring-white/15 text-white text-[9.5px] sm:text-[10.5px] font-semibold tracking-wide shadow-soft shrink-0"
                      aria-label={isTikTok ? "TikTok" : "Instagram Reels"}
                    >
                      {isTikTok ? (
                        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 sm:h-3 sm:w-3" fill="currentColor" aria-hidden>
                          <path d="M19.6 6.7a5.3 5.3 0 0 1-3.2-1.1 5.3 5.3 0 0 1-2-3.6h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V8.7a5.7 5.7 0 1 0 4.9 5.6V9.1a8.4 8.4 0 0 0 5.2 1.8V7.7a5.3 5.3 0 0 1 0-1z" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 sm:h-3 sm:w-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <rect x="3" y="3" width="18" height="18" rx="5" />
                          <circle cx="12" cy="12" r="4" />
                          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                        </svg>
                      )}
                      <span className="leading-none">{isTikTok ? "TikTok" : "Reels"}</span>
                    </span>
                  );
                })()}

                {tier && (() => {
                  const TierIcon = tierConfig[tier].icon;
                  const showVel = velViews >= 500 && tier === "strong";
                  return (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 h-[20px] sm:h-[22px] px-1.5 sm:px-2 rounded-full text-[9.5px] sm:text-[10.5px] font-bold tracking-wide shadow-soft max-w-full",
                        tierConfig[tier].className,
                        tier === "strong" && "animate-viral-pulse",
                      )}
                    >
                      <TierIcon className={cn("h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0", tierConfig[tier].iconClassName)} strokeWidth={2.5} />
                      <span className="leading-none truncate">{tierConfig[tier].label}</span>
                      {showVel && (
                        <>
                          <span className="opacity-40 leading-none">·</span>
                          <span className="opacity-95 font-semibold tabular-nums leading-none whitespace-nowrap">
                            {fmt(Math.round(velViews))}/ч
                          </span>
                        </>
                      )}
                    </span>
                  );
                })()}
              </div>

              {/* Right: favorite button */}
              <button
                type="button"
                onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFav(video.id); }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFav(video.id); }}
                className="pointer-events-auto w-8 h-8 rounded-full bg-white/15 backdrop-blur-2xl ring-1 ring-white/25 flex items-center justify-center shadow-soft active:scale-90 transition-all hover:bg-white/25 shrink-0"
                style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
                aria-label="Избранное"
              >
                <Heart
                  className={cn(
                    "h-4 w-4 transition-all",
                    isFavorite ? "text-rose-400 fill-rose-400 drop-shadow-[0_0_6px_rgba(251,113,133,0.6)]" : "text-white",
                  )}
                />
              </button>
            </div>

            {/* Bottom overlay — author + caption */}
            <div className="absolute bottom-0 left-0 right-0 p-2.5 z-10 text-white pointer-events-none">
              {(showAuthor && video.author_username) && (
                <div className="flex items-center gap-2 text-[11px] opacity-90 mb-1.5">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt=""
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                      className="w-5 h-5 rounded-full bg-white/20 object-cover ring-1 ring-white/20 shrink-0"
                      onError={() => {
                        if (avatarSrc !== `https://unavatar.io/instagram/${video.author_username}`) {
                          setAvatarSrc(`https://unavatar.io/instagram/${video.author_username}`);
                          return;
                        }
                        setAvatarSrc(null);
                      }}
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-white/30 ring-1 ring-white/15 shrink-0" />
                  )}
                  <span className="truncate font-medium">@{video.author_username}</span>
                </div>
              )}
              {caption && (
                <p className="text-[12px] font-semibold leading-tight line-clamp-2 drop-shadow-sm">
                  {caption}
                </p>
              )}
            </div>

            {/* Floating actions (Open + Report) */}
            <div className="absolute top-12 right-2 z-10 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(video.url, '_blank'); }}
                onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); window.open(video.url, '_blank'); }}
                className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-soft active:scale-95 transition-transform"
                style={{ WebkitTapHighlightColor: "transparent" }}
                aria-label="Открыть в TikTok"
              >
                <ExternalLink className="h-3.5 w-3.5 text-white" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowReport(true); }}
                onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setShowReport(true); }}
                className="w-7 h-7 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center shadow-soft active:scale-95 transition-transform"
                style={{ WebkitTapHighlightColor: "transparent" }}
                aria-label="Пожаловаться"
              >
                <Flag className="h-3 w-3 text-white/80" />
              </button>
            </div>

            {/* Duration */}
            {video.duration && video.duration > 0 && (
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 bg-black/55 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded font-medium z-10">
                {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, "0")}
              </div>
            )}
          </>
        )}
      </div>

      {/* Stats — two rows: views+likes on top, comments+time below */}
      <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-[11.5px] text-muted-foreground space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 shrink-0">
            <Eye className="h-3 w-3 shrink-0" />
            <span className="font-semibold text-foreground tabular-nums">{fmt(views)}</span>
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <Heart className="h-3 w-3 shrink-0 text-rose-500" />
            <span className="font-semibold text-foreground tabular-nums">{fmt(Number(video.likes))}</span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 shrink-0">
            <MessageCircle className="h-3 w-3 shrink-0" />
            <span className="font-semibold text-foreground tabular-nums">{fmt(Number(video.comments))}</span>
          </span>
          {timeAgo && (
            <span className="text-foreground font-semibold tabular-nums truncate text-[10.5px] sm:text-[11px]">
              {timeAgo}
            </span>
          )}
        </div>
      </div>

      {showAnalyzeButton && onAnalyze ? (
        <div className="px-2 sm:px-3 pb-2.5 sm:pb-3 mt-auto">
          <button
            onClick={(e) => { e.stopPropagation(); onAnalyze(video); }}
            className="group/btn relative w-full flex items-center justify-center gap-1.5 py-3 rounded-[14px] text-[13px] font-bold tracking-wide bg-viral text-viral-foreground ring-1 ring-foreground/10 transition-all duration-300 ease-out overflow-visible hover:brightness-110 hover:-translate-y-0.5 hover:ring-2 hover:ring-viral/60 active:scale-[0.96] active:translate-y-0 active:brightness-95 focus:outline-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-viral focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:brightness-110 focus-visible:-translate-y-0.5"
            style={{ boxShadow: "0 6px 24px -6px hsl(var(--viral) / 0.55), 0 0 0 1px hsl(0 0% 100% / 0.2) inset" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 0 0 4px hsl(var(--viral) / 0.18), 0 10px 28px -4px hsl(var(--viral) / 0.85), 0 0 36px hsl(var(--viral) / 0.55), 0 0 0 1px hsl(0 0% 100% / 0.3) inset";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0 6px 24px -6px hsl(var(--viral) / 0.55), 0 0 0 1px hsl(0 0% 100% / 0.2) inset";
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.boxShadow =
                "0 0 0 6px hsl(var(--viral) / 0.28), 0 4px 14px -2px hsl(var(--viral) / 0.7), 0 0 22px hsl(var(--viral) / 0.45), 0 0 0 1px hsl(0 0% 100% / 0.25) inset";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.boxShadow =
                "0 0 0 4px hsl(var(--viral) / 0.18), 0 10px 28px -4px hsl(var(--viral) / 0.85), 0 0 36px hsl(var(--viral) / 0.55), 0 0 0 1px hsl(0 0% 100% / 0.3) inset";
            }}
          >
            {/* Outer neon halo */}
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-1 rounded-[16px] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 blur-md -z-10"
              style={{ background: "radial-gradient(60% 80% at 50% 50%, hsl(var(--viral) / 0.55), transparent 70%)" }}
            />
            <span className="relative flex items-center justify-center gap-1.5 w-full overflow-hidden rounded-[14px]">
              <span
                className="pointer-events-none absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"
                style={{ background: "radial-gradient(120% 80% at 50% 0%, hsl(0 0% 100% / 0.35), transparent 60%)" }}
              />
              <span
                className="pointer-events-none absolute -inset-y-1 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent translate-x-0 group-hover/btn:translate-x-[400%] transition-transform duration-[900ms] ease-out"
              />
              <Sparkles className="relative h-4 w-4 text-foreground transition-transform duration-300 group-hover/btn:rotate-12 group-hover/btn:scale-125 group-active/btn:scale-100" />
              <span className="relative">Анализ видео</span>
            </span>
          </button>
        </div>
      ) : null}

      {/* Fullscreen video player overlay (mobile) */}
      {showFullscreen && isMobile && (
        <FullscreenVideoPlayer
          video={video}
          playUrl={playUrl}
          loading={loadingPlay}
          onClose={() => {
            setShowFullscreen(false);
            onPlay(null);
            setPlayUrl(null);
          }}
          isFavorite={isFavorite}
          onToggleFav={onToggleFav}
          onAnalyze={onAnalyze}
          onScript={onScript}
        />
      )}

      {/* Report dialog */}
      <ReportContentDialog
        open={showReport}
        onClose={() => setShowReport(false)}
        videoId={video.id}
        videoUrl={video.url}
        authorUsername={video.author_username}
      />
    </div>
  );
});

export const MemoVideoCard = memo(VideoCard);
