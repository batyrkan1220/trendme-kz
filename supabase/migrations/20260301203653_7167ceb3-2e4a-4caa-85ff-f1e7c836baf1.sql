
-- Helper function for ownership checks
CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id = auth.uid()
$$;

-- Videos table (public TikTok data, writable only by service role)
CREATE TABLE public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL DEFAULT 'tiktok',
  platform_video_id text UNIQUE NOT NULL,
  url text NOT NULL,
  caption text,
  cover_url text,
  author_username text,
  author_display_name text,
  author_avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  views bigint DEFAULT 0,
  likes bigint DEFAULT 0,
  comments bigint DEFAULT 0,
  shares bigint DEFAULT 0,
  duration_sec integer,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  source_query_id uuid,
  velocity_views double precision DEFAULT 0,
  velocity_likes double precision DEFAULT 0,
  velocity_comments double precision DEFAULT 0,
  trend_score double precision DEFAULT 0
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read videos"
ON public.videos FOR SELECT TO authenticated
USING (true);

-- No INSERT/UPDATE/DELETE policies for authenticated users
-- Edge functions use service_role key to write

-- Search queries
CREATE TABLE public.search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  query_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_run_at timestamptz NOT NULL DEFAULT now(),
  total_results_saved integer DEFAULT 0
);

ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own search queries"
ON public.search_queries FOR ALL TO authenticated
USING (public.is_owner(user_id))
WITH CHECK (public.is_owner(user_id));

-- Favorites
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own favorites"
ON public.favorites FOR ALL TO authenticated
USING (public.is_owner(user_id))
WITH CHECK (public.is_owner(user_id));

-- Tracked accounts
CREATE TABLE public.accounts_tracked (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  profile_url text NOT NULL,
  username text NOT NULL,
  avatar_url text,
  followers bigint DEFAULT 0,
  following bigint DEFAULT 0,
  total_likes bigint DEFAULT 0,
  total_videos bigint DEFAULT 0,
  verified boolean DEFAULT false,
  bio text,
  bio_link text,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, username)
);

ALTER TABLE public.accounts_tracked ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tracked accounts"
ON public.accounts_tracked FOR ALL TO authenticated
USING (public.is_owner(user_id))
WITH CHECK (public.is_owner(user_id));

-- Video analysis
CREATE TABLE public.video_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_url text NOT NULL,
  platform_video_id text,
  summary_json jsonb,
  transcript_text text,
  comments_json jsonb,
  analyzed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.video_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own video analyses"
ON public.video_analysis FOR ALL TO authenticated
USING (public.is_owner(user_id))
WITH CHECK (public.is_owner(user_id));

-- Activity log (Journal)
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('search_run', 'video_analysis', 'account_analysis')),
  payload_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own activity logs"
ON public.activity_log FOR ALL TO authenticated
USING (public.is_owner(user_id))
WITH CHECK (public.is_owner(user_id));

-- Index for trend sorting
CREATE INDEX idx_videos_trend_score ON public.videos (trend_score DESC);
CREATE INDEX idx_videos_fetched_at ON public.videos (fetched_at DESC);
CREATE INDEX idx_search_queries_user ON public.search_queries (user_id, created_at DESC);
CREATE INDEX idx_favorites_user ON public.favorites (user_id, created_at DESC);
CREATE INDEX idx_activity_log_user ON public.activity_log (user_id, created_at DESC);
CREATE INDEX idx_accounts_tracked_user ON public.accounts_tracked (user_id, created_at DESC);
