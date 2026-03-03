
-- Add tokens_included column to plans
ALTER TABLE public.plans ADD COLUMN tokens_included integer NOT NULL DEFAULT 0;

-- Set default token amounts for existing plans
UPDATE public.plans SET tokens_included = 50 WHERE price_rub = 0;
UPDATE public.plans SET tokens_included = 200 WHERE price_rub > 0 AND price_rub <= 500;
UPDATE public.plans SET tokens_included = 500 WHERE price_rub > 500;
