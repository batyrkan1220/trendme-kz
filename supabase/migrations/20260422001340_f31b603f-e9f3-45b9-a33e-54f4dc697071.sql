-- 1. Add free credit columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS free_analyses_left integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS free_scripts_left  integer NOT NULL DEFAULT 3;

-- 2. Backfill existing users so they also get 3+3 trial credits (one-time)
UPDATE public.profiles
   SET free_analyses_left = 3,
       free_scripts_left  = 3
 WHERE free_analyses_left IS NULL OR free_scripts_left IS NULL;

-- 3. Update handle_new_user to seed 3+3 credits for new signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _free_plan_id uuid;
  _name text;
  _phone text;
BEGIN
  _name := NEW.raw_user_meta_data->>'name';
  _phone := NEW.raw_user_meta_data->>'phone';

  INSERT INTO public.profiles (user_id, name, phone, free_analyses_left, free_scripts_left)
    VALUES (NEW.id, _name, _phone, 3, 3);

  INSERT INTO public.user_tokens (user_id, balance, total_earned)
    VALUES (NEW.id, 50, 50);
  INSERT INTO public.token_transactions (user_id, amount, action_type, description)
    VALUES (NEW.id, 50, 'bonus', 'Приветственные токены');

  SELECT id INTO _free_plan_id FROM public.plans
    WHERE is_active = true AND price_rub = 0
    ORDER BY sort_order LIMIT 1;

  IF _free_plan_id IS NOT NULL THEN
    INSERT INTO public.user_subscriptions (user_id, plan_id, expires_at)
      VALUES (NEW.id, _free_plan_id, now() + interval '365 days');
  END IF;

  RETURN NEW;
END;
$function$;

-- 4. Atomic credit consumption RPC (prevents race conditions / client tampering)
CREATE OR REPLACE FUNCTION public.consume_free_credit(_kind text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _remaining integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF _kind NOT IN ('analysis', 'script') THEN
    RAISE EXCEPTION 'invalid kind';
  END IF;

  IF _kind = 'analysis' THEN
    UPDATE public.profiles
       SET free_analyses_left = free_analyses_left - 1,
           updated_at = now()
     WHERE user_id = _uid AND free_analyses_left > 0
     RETURNING free_analyses_left INTO _remaining;
  ELSE
    UPDATE public.profiles
       SET free_scripts_left = free_scripts_left - 1,
           updated_at = now()
     WHERE user_id = _uid AND free_scripts_left > 0
     RETURNING free_scripts_left INTO _remaining;
  END IF;

  IF _remaining IS NULL THEN
    RETURN -1; -- no credits left
  END IF;

  RETURN _remaining;
END;
$$;

-- 5. Admin policy: admins can read all profiles (for admin dashboard)
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));