
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS usage_limits jsonb DEFAULT NULL;

COMMENT ON COLUMN public.plans.usage_limits IS 'Per-subscription-period usage limits per action. NULL = unlimited. Example: {"search": 10, "video_analysis": 5}';
