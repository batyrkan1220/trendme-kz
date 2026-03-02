
-- Add niche column to videos table
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS niche text DEFAULT NULL;

-- Add index for fast filtering
CREATE INDEX IF NOT EXISTS idx_videos_niche ON public.videos (niche);
