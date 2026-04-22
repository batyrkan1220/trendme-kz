
ALTER TABLE public.payment_orders
  ADD COLUMN IF NOT EXISTS purchase_type text,
  ADD COLUMN IF NOT EXISTS previous_plan_id uuid,
  ADD COLUMN IF NOT EXISTS previous_plan_name text,
  ADD COLUMN IF NOT EXISTS remaining_days_carried integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS computed_expires_at timestamptz;
