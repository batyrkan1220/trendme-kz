
-- Add categories array column to videos
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}';

-- Populate categories from existing duplicates: collect all niches per original video
UPDATE public.videos v
SET categories = sub.all_cats
FROM (
  SELECT 
    split_part(platform_video_id, '_', 1) as orig_id,
    array_agg(DISTINCT niche) as all_cats
  FROM public.videos
  WHERE niche IS NOT NULL
  GROUP BY split_part(platform_video_id, '_', 1)
) sub
WHERE split_part(v.platform_video_id, '_', 1) = sub.orig_id
  AND v.platform_video_id NOT LIKE '%\_%';

-- Also set categories for videos that have no duplicates (just their own niche)
UPDATE public.videos
SET categories = ARRAY[niche]
WHERE categories = '{}' AND niche IS NOT NULL AND platform_video_id NOT LIKE '%\_%';

-- Delete all duplicate rows
DELETE FROM public.videos WHERE platform_video_id LIKE '%\_%';
