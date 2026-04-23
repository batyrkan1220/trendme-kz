-- 1. Wipe all existing video-related data (full reset per user request)
DELETE FROM public.favorites;
DELETE FROM public.search_queries;
DELETE FROM public.videos;

-- 2. Drop legacy niche columns from videos
ALTER TABLE public.videos DROP COLUMN IF EXISTS niche;
ALTER TABLE public.videos DROP COLUMN IF EXISTS sub_niche;
ALTER TABLE public.videos DROP COLUMN IF EXISTS categories;

-- 3. Add Instagram-trends columns
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS source text DEFAULT 'trends';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS viral_score numeric DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS is_broken boolean DEFAULT false;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS shortcode text;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS view_count bigint DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS like_count bigint DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS comment_count bigint DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS posted_at timestamptz;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS profile_pic_url text;

-- 4. Index for trend queries
CREATE INDEX IF NOT EXISTS idx_videos_trends ON public.videos (platform, source, viral_score DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_videos_shortcode ON public.videos (shortcode) WHERE shortcode IS NOT NULL;

-- 5. user_cache table for username -> user_id resolution
CREATE TABLE IF NOT EXISTS public.user_cache (
  username text PRIMARY KEY,
  user_id text NOT NULL,
  resolved_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user_cache"
  ON public.user_cache
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access user_cache"
  ON public.user_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);