-- 1. Add platform column to search_queries
ALTER TABLE public.search_queries
  ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT 'all'
    CHECK (platform IN ('all','tiktok','instagram'));

-- 2. Create search_cache table
CREATE TABLE IF NOT EXISTS public.search_cache (
  cache_key text PRIMARY KEY,
  videos jsonb NOT NULL,
  related_keywords text[] NOT NULL DEFAULT '{}',
  warnings text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_cache_created_at
  ON public.search_cache (created_at);

-- RLS — system-only table (only edge functions via service role write/read)
ALTER TABLE public.search_cache ENABLE ROW LEVEL SECURITY;

-- No public policies → effectively locked to service role.