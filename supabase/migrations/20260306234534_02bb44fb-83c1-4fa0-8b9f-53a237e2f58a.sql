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
  -- Extract name and phone from user metadata
  _name := NEW.raw_user_meta_data->>'name';
  _phone := NEW.raw_user_meta_data->>'phone';

  -- Create profile with name and phone
  INSERT INTO public.profiles (user_id, name, phone) VALUES (NEW.id, _name, _phone);
  
  -- Give welcome tokens
  INSERT INTO public.user_tokens (user_id, balance, total_earned)
    VALUES (NEW.id, 50, 50);
  INSERT INTO public.token_transactions (user_id, amount, action_type, description)
    VALUES (NEW.id, 50, 'bonus', 'Приветственные токены');

  -- Auto-assign free plan (cheapest active plan with price_rub = 0)
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