/**
 * Unified Video Analysis API layer.
 *
 * Single source of truth for analyzing TikTok and Instagram videos.
 * - Always calls the same edge function action (`socialkit / analyze_video`)
 * - Detects platform from URL (TikTok vs Instagram Reels)
 * - Normalizes the response shape so UI never has to branch on platform
 *
 * If you need to analyze a video from anywhere in the app — use `analyzeVideo()`.
 * Do NOT call `supabase.functions.invoke("socialkit", ...)` for analysis directly.
 */
import { supabase } from "@/integrations/supabase/client";

export type AnalysisLanguage = "ru" | "kk";
export type VideoPlatform = "tiktok" | "instagram" | "unknown";

export interface AnalyzeVideoInput {
  /** Public video URL (TikTok or Instagram Reel/Post) */
  url: string;
  /** Platform-specific stable id (TikTok aweme_id / Instagram shortcode). Used as fallback. */
  platform_video_id?: string | null;
  author_username?: string | null;
  caption?: string | null;
  language: AnalysisLanguage;
}

export interface NormalizedAnalysis {
  /** Parsed AI summary object (topic, hook_phrase, structure, virality_score, ...) */
  summary: any | null;
  /** Plain transcript text (may be empty for Instagram) */
  transcript: string;
  /** Raw stats blob from provider (views/likes/comments/duration/...) */
  stats: any | null;
  /** Detected platform */
  platform: VideoPlatform;
  /** Raw response — escape hatch for debugging */
  raw: any;
}

/** Detect platform purely from URL — used to keep call sites consistent. */
export function detectVideoPlatform(url: string | null | undefined): VideoPlatform {
  if (!url) return "unknown";
  if (/instagram\.com\/(?:reel|reels|p|tv)\/[A-Za-z0-9_-]+/i.test(url)) return "instagram";
  if (/tiktok\.com\//i.test(url)) return "tiktok";
  return "unknown";
}

/** Safely parse a value that may already be an object or a JSON string. */
function safeParse(value: unknown): any {
  if (value == null) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

/** Normalize transcript field (sometimes returned as JSON-encoded string). */
function normalizeTranscript(raw: unknown): string {
  if (!raw) return "";
  if (typeof raw !== "string") {
    try { return JSON.stringify(raw); } catch { return ""; }
  }
  const text = raw;
  if (text.startsWith("{") || text.startsWith("[")) {
    const parsed = safeParse(text);
    if (parsed) {
      return (
        parsed.transcript ||
        parsed.text ||
        parsed?.data?.transcript ||
        text
      );
    }
  }
  return text;
}

/**
 * Analyze a video. Always hits the same server action regardless of platform.
 * Throws on failure — caller is responsible for surfacing errors (toast/state).
 */
export async function analyzeVideo(
  input: AnalyzeVideoInput,
): Promise<NormalizedAnalysis> {
  if (!input?.url) {
    throw new Error("video url is required");
  }

  const platform = detectVideoPlatform(input.url);

  const { data, error } = await supabase.functions.invoke("socialkit", {
    body: {
      action: "analyze_video",
      video_url: input.url,
      platform_video_id: input.platform_video_id ?? "",
      author_username: input.author_username ?? "",
      caption: input.caption ?? "",
      language: input.language,
    },
  });

  if (error) throw error;
  if (!data) throw new Error("empty analysis response");

  return {
    summary: safeParse((data as any).summary_json),
    transcript: normalizeTranscript((data as any).transcript_text),
    stats: (data as any).stats ?? (data as any).comments_json ?? null,
    platform,
    raw: data,
  };
}
