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

/** Persistent play URL cache — survives page reloads on native mobile */
const PLAY_CACHE_KEY = "playUrlCache";
const PLAY_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours
const ERROR_CACHE_TTL = 5 * 60 * 1000; // 5 min for failed URLs

interface CachedEntry { url: string; ts: number }

// Load from localStorage on startup
const playUrlCache = new Map<string, string>();
const errorCache = new Map<string, number>(); // videoUrl → timestamp of failure

try {
  const stored = localStorage.getItem(PLAY_CACHE_KEY);
  if (stored) {
    const entries: Record<string, CachedEntry> = JSON.parse(stored);
    const now = Date.now();
    for (const [key, val] of Object.entries(entries)) {
      if (now - val.ts < PLAY_CACHE_TTL) {
        playUrlCache.set(key, val.url);
      }
    }
  }
} catch { /* ignore */ }

function persistCache() {
  try {
    const obj: Record<string, CachedEntry> = {};
    const now = Date.now();
    for (const [key, url] of playUrlCache.entries()) {
      obj[key] = { url, ts: now };
    }
    localStorage.setItem(PLAY_CACHE_KEY, JSON.stringify(obj));
  } catch { /* quota exceeded — ignore */ }
}

/** Global in-flight request tracker to prevent duplicate concurrent API calls */
const inFlightRequests = new Map<string, Promise<string | null>>();

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

/** Centralized function to fetch play URL with deduplication */
export async function fetchPlayUrlDeduped(videoUrl: string): Promise<string | null> {
  // Check memory cache first
  const cached = playUrlCache.get(videoUrl);
  if (cached) return cached;

  // Check error cache — skip if recently failed
  const failedAt = errorCache.get(videoUrl);
  if (failedAt && Date.now() - failedAt < ERROR_CACHE_TTL) return null;

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
        persistCache();
        return data.play_url;
      }
      // No play_url returned — mark as error
      errorCache.set(videoUrl, Date.now());
      return null;
    } catch {
      errorCache.set(videoUrl, Date.now());
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const preloadedUrlRef = useRef<string | null>(null);
  const isMobileFromHook = useIsMobile();
  const isMobile = isMobileOverride ?? isMobileFromHook;

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

            {/* Top bar — HOT/TOP pill (left) + favorite (right) */}
            <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-2.5 z-20 gap-2">
              {tier ? (() => {
                const TierIcon = tierConfig[tier].icon;
                const showVel = velViews >= 500 && tier === "strong";
                return (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 pl-1.5 pr-1.5 sm:pr-2 py-[3px] rounded-full text-[9px] sm:text-[10px] font-bold tracking-wide shadow-soft max-w-[calc(100%-40px)]",
                      tierConfig[tier].className,
                      tier === "strong" && "animate-viral-pulse",
                    )}
                  >
                    <TierIcon className={cn("h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0", tierConfig[tier].iconClassName)} strokeWidth={2.5} />
                    <span className="leading-none truncate">{tierConfig[tier].label}</span>
                    {showVel && (
                      <>
                        <span className="opacity-30 hidden sm:inline">·</span>
                        <span className="opacity-80 font-semibold tabular-nums hidden sm:inline">
                          {fmt(Math.round(velViews))}/ч
                        </span>
                      </>
                    )}
                  </span>
                );
              })() : <span />}

              <button
                type="button"
                onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFav(video.id); }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFav(video.id); }}
                className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-2xl ring-1 ring-white/25 flex items-center justify-center shadow-soft active:scale-90 transition-all hover:bg-white/25"
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
                <div className="flex items-center gap-1.5 text-[11px] opacity-90 mb-1">
                  {video.author_avatar_url ? (
                    <img
                      src={video.author_avatar_url}
                      alt=""
                      className="w-4 h-4 rounded-full bg-white/20 object-cover"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-white/30" />
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
            className="group/btn relative w-full flex items-center justify-center gap-1.5 py-3 rounded-[14px] text-[13px] font-bold tracking-wide bg-foreground text-background ring-1 ring-foreground/10 active:scale-[0.97] transition-all hover:bg-foreground/90 overflow-hidden"
            style={{ boxShadow: "0 6px 24px -6px rgba(0,0,0,0.5), 0 0 0 1px hsl(0 0% 100% / 0.04) inset" }}
          >
            <span
              className="pointer-events-none absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"
              style={{ background: "radial-gradient(120% 80% at 50% 0%, hsl(var(--viral) / 0.18), transparent 60%)" }}
            />
            <span
              className="pointer-events-none absolute -inset-y-1 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-0 group-hover/btn:translate-x-[400%] transition-transform duration-[900ms] ease-out"
            />
            <Sparkles className="relative h-4 w-4 text-viral transition-transform duration-300 group-hover/btn:rotate-12 group-hover/btn:scale-110" />
            <span className="relative">Анализ видео</span>
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
