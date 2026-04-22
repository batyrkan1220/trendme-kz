-- Refund tracking fields on payment_orders
ALTER TABLE public.payment_orders
  ADD COLUMN IF NOT EXISTS refund_status text,
  ADD COLUMN IF NOT EXISTS refund_id text,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
  ADD COLUMN IF NOT EXISTS refund_amount integer,
  ADD COLUMN IF NOT EXISTS refund_reason text,
  ADD COLUMN IF NOT EXISTS refund_initiated_by uuid,
  ADD COLUMN IF NOT EXISTS refund_initiated_at timestamptz,
  ADD COLUMN IF NOT EXISTS refund_failure_description text;

-- Constrain refund_status to known values (allow NULL = no refund)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_orders_refund_status_check'
  ) THEN
    ALTER TABLE public.payment_orders
      ADD CONSTRAINT payment_orders_refund_status_check
      CHECK (refund_status IS NULL OR refund_status IN ('initiated','processing','success','failed'));
  END IF;
END$$;

-- Index for filtering refunds in admin panel
CREATE INDEX IF NOT EXISTS idx_payment_orders_refund_status
  ON public.payment_orders (refund_status)
  WHERE refund_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_orders_refunded_at
  ON public.payment_orders (refunded_at DESC)
  WHERE refunded_at IS NOT NULL;