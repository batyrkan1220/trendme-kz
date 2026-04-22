
ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS amount_paid integer,
  ADD COLUMN IF NOT EXISTS bonus_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS previous_plan_name text,
  ADD COLUMN IF NOT EXISTS remaining_days_carried integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_provider text,
  ADD COLUMN IF NOT EXISTS order_id text;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_created
  ON public.user_subscriptions (user_id, created_at DESC);
