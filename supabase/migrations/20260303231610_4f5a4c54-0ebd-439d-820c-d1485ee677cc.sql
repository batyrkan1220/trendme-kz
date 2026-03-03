
-- 2) Create unique constraint/index on (platform, platform_video_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'videos_platform_platform_video_id_uq'
  ) THEN
    CREATE UNIQUE INDEX videos_platform_platform_video_id_uq
      ON public.videos (platform, platform_video_id);
  END IF;
END $$;
