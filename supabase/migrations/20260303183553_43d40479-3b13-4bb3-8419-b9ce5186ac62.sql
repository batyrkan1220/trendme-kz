CREATE OR REPLACE FUNCTION public.spend_tokens(_user_id uuid, _action_key text, _description text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _cost integer;
  _current_balance integer;
BEGIN
  SELECT cost INTO _cost FROM public.token_pricing WHERE action_key = _action_key;
  IF _cost IS NULL THEN RETURN false; END IF;

  SELECT balance INTO _current_balance FROM public.user_tokens WHERE user_id = _user_id FOR UPDATE;
  IF _current_balance IS NULL OR _current_balance < _cost THEN RETURN false; END IF;

  UPDATE public.user_tokens
    SET balance = balance - _cost, total_spent = total_spent + _cost, updated_at = now()
    WHERE user_id = _user_id;

  INSERT INTO public.token_transactions (user_id, amount, action_type, description)
    VALUES (_user_id, -_cost, _action_key, COALESCE(_description, _action_key));

  RETURN true;
END;
$function$;