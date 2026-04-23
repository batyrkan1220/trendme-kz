/**
 * Unified Video Playback API layer.
 *
 * Single source of truth for resolving a playable URL for any video card / player
 * across the app (Trends, Search, Library, Account Analysis, FullscreenPlayer,
 * VideoAnalysisDialog, etc.).
 *
 * Responsibilities:
 *  - Detect platform from URL (TikTok / Instagram)
 *  - Memory + localStorage cache for resolved direct play URLs (2h TTL)
 *  - Negative cache for failed lookups (5 min TTL) to avoid hammering provider
 *  - In-flight request dedup so concurrent cards don't trigger duplicate API calls
 *  - Deterministic embed fallback (`tiktok_embed_fallback` / `instagram_embed`)
 *    that downstream <video>/<iframe> renderers already understand.
 *
 * If you need to play a video from anywhere — call `resolvePlayback()`.
 * Do NOT call `supabase.functions.invoke("socialkit", { action: "get_play_url" })`
 * directly from components.
 */
import { supabase } from "@/integrations/supabase/client";
import { detectVideoPlatform, type VideoPlatform } from "./videoAnalysis";

// ─────────────────────────────────────────────────────────────────────────────
// Cache
// ─────────────────────────────────────────────────────────────────────────────

const PLAY_CACHE_KEY = "playUrlCache";
const PLAY_CACHE_TTL = 2 * 60 * 60 * 1000; // 2h
const ERROR_CACHE_TTL = 5 * 60 * 1000; // 5 min

interface CachedEntry {
  url: string;
  ts: number;
}

const playUrlCache = new Map<string, string>();
const errorCache = new Map<string, number>();
const inFlightRequests = new Map<string, Promise<string | null>>();

// Hydrate from localStorage on module load
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
} catch {
  /* ignore */
}

function persistCache() {
  try {
    const obj: Record<string, CachedEntry> = {};
    const now = Date.now();
    for (const [key, url] of playUrlCache.entries()) {
      obj[key] = { url, ts: now };
    }
    localStorage.setItem(PLAY_CACHE_KEY, JSON.stringify(obj));
  } catch {
    /* quota exceeded — ignore */
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Embed sentinels (consumed by <FullscreenVideoPlayer> & <VideoCard>)
// ─────────────────────────────────────────────────────────────────────────────

export const TIKTOK_EMBED_FALLBACK = "tiktok_embed_fallback" as const;
export const INSTAGRAM_EMBED = "instagram_embed" as const;

export type EmbedSentinel = typeof TIKTOK_EMBED_FALLBACK | typeof INSTAGRAM_EMBED;
export type PlayValue = string | EmbedSentinel | null;

export function isEmbedSentinel(value: PlayValue): value is EmbedSentinel {
  return value === TIKTOK_EMBED_FALLBACK || value === INSTAGRAM_EMBED;
}

/** Pick the right embed sentinel for a given URL when direct fetch failed. */
function embedFallbackFor(url: string): EmbedSentinel {
  return detectVideoPlatform(url) === "instagram"
    ? INSTAGRAM_EMBED
    : TIKTOK_EMBED_FALLBACK;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/** Synchronous cache check — returns a direct URL if we already have one. */
export function getCachedPlayUrl(videoUrl: string): string | null {
  return playUrlCache.get(videoUrl) ?? null;
}

/** Manually seed the cache (e.g. after a preload). */
export function setCachedPlayUrl(videoUrl: string, playUrl: string): void {
  playUrlCache.set(videoUrl, playUrl);
  persistCache();
}

/**
 * Resolve a direct play URL for the given video URL.
 *
 * - Returns the cached value if available
 * - Skips network if we recently failed (negative cache)
 * - Dedupes concurrent in-flight requests for the same URL
 * - Returns `null` if provider returned no playable URL
 *
 * Most call-sites should prefer {@link resolvePlayback} which adds embed-fallback
 * semantics. Use this raw helper only when you specifically want to know whether
 * a direct stream URL exists (e.g. for `<video>` vs `<iframe>` decisions).
 */
export async function fetchPlayUrlDeduped(
  videoUrl: string,
): Promise<string | null> {
  const cached = playUrlCache.get(videoUrl);
  if (cached) return cached;

  const failedAt = errorCache.get(videoUrl);
  if (failedAt && Date.now() - failedAt < ERROR_CACHE_TTL) return null;

  const existing = inFlightRequests.get(videoUrl);
  if (existing) return existing;

  const promise = (async (): Promise<string | null> => {
    try {
      const { data } = await supabase.functions.invoke("socialkit", {
        body: { action: "get_play_url", video_url: videoUrl },
      });
      const playUrl = (data as any)?.play_url;
      if (playUrl) {
        playUrlCache.set(videoUrl, playUrl);
        persistCache();
        return playUrl;
      }
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

export interface ResolvedPlayback {
  /**
   * Either a direct streamable URL, or an embed sentinel
   * (`tiktok_embed_fallback` / `instagram_embed`) that the renderer should
   * translate into an `<iframe>`. Never `null` — when nothing works we still
   * return an embed sentinel so the UI degrades gracefully.
   */
  value: string | EmbedSentinel;
  /** True when `value` is a direct media URL (use `<video>`). */
  isDirect: boolean;
  /** True when `value` is an embed sentinel (use `<iframe>`). */
  isEmbed: boolean;
  platform: VideoPlatform;
  /** True when the result was served from cache (no network call). */
  fromCache: boolean;
}

/**
 * High-level helper used by every play surface in the app.
 *
 * Always resolves to *something* the renderer can show:
 *  1. cached direct URL → return it
 *  2. fresh direct URL from provider → cache & return it
 *  3. provider failed/empty → return platform embed sentinel
 *
 * Components should pass the result straight to `<VideoCard>` /
 * `<FullscreenVideoPlayer>` which already know how to render both forms.
 */
export async function resolvePlayback(
  videoUrl: string,
): Promise<ResolvedPlayback> {
  const platform = detectVideoPlatform(videoUrl);

  const cached = playUrlCache.get(videoUrl);
  if (cached) {
    return { value: cached, isDirect: true, isEmbed: false, platform, fromCache: true };
  }

  try {
    const direct = await fetchPlayUrlDeduped(videoUrl);
    if (direct) {
      return { value: direct, isDirect: true, isEmbed: false, platform, fromCache: false };
    }
  } catch {
    /* fall through to embed */
  }

  const fallback = embedFallbackFor(videoUrl);
  return { value: fallback, isDirect: false, isEmbed: true, platform, fromCache: false };
}
