/**
 * Unified input shape for video-centric dialogs.
 *
 * Both `VideoAnalysisDialog` and `ScriptOnlyDialog` accept the SAME object
 * regardless of where it comes from (Trends, Search, Library, AccountAnalysis).
 *
 * Rule: any call site must be able to pass a `VideoCardData`-like object
 * without casting. Optional fields stay optional; only `id` and `url` are
 * strictly required to open a dialog.
 */
export interface DialogVideoInput {
  /** Internal DB id (videos.id) */
  id: string;
  /** Public video URL (TikTok / Instagram) */
  url: string;

  /** Platform-specific stable id (TikTok aweme_id / Instagram shortcode). */
  platform_video_id?: string | null;

  cover_url?: string | null;
  caption?: string | null;

  author_username?: string | null;
  author_avatar_url?: string | null;
  author_display_name?: string | null;

  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;

  published_at?: string | null;

  /** Duration in seconds. Some sources expose `duration`, others `duration_sec`. */
  duration?: number | null;
  duration_sec?: number | null;
}

/** Standard prop contract shared by every video dialog in the app. */
export interface VideoDialogProps {
  video: DialogVideoInput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
