-- Deactivate all but the most recent active subscription per user
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
  FROM public.user_subscriptions
  WHERE is_active = true
)
UPDATE public.user_subscriptions
SET is_active = false
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);