
-- Function: deactivate expired paid subs and assign Trial plan, log to activity_log
CREATE OR REPLACE FUNCTION public.auto_downgrade_expired_subscriptions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _trial_plan_id uuid;
  _expired_record RECORD;
  _downgraded_count integer := 0;
  _expired_plan_name text;
BEGIN
  -- Find Trial (free) plan
  SELECT id INTO _trial_plan_id
  FROM public.plans
  WHERE is_active = true AND price_rub = 0
  ORDER BY sort_order
  LIMIT 1;

  IF _trial_plan_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No trial plan found');
  END IF;

  -- Iterate over active but expired subscriptions
  FOR _expired_record IN
    SELECT us.id, us.user_id, us.plan_id, us.expires_at, p.name AS plan_name, p.price_rub
    FROM public.user_subscriptions us
    JOIN public.plans p ON p.id = us.plan_id
    WHERE us.is_active = true
      AND us.expires_at < now()
      AND us.plan_id <> _trial_plan_id
  LOOP
    -- Deactivate the expired subscription
    UPDATE public.user_subscriptions
       SET is_active = false
     WHERE id = _expired_record.id;

    -- Skip if user already has another active sub (e.g. paid renewal)
    IF EXISTS (
      SELECT 1 FROM public.user_subscriptions
      WHERE user_id = _expired_record.user_id
        AND is_active = true
        AND expires_at > now()
    ) THEN
      CONTINUE;
    END IF;

    -- Assign Trial plan for 365 days
    INSERT INTO public.user_subscriptions (user_id, plan_id, expires_at, note)
    VALUES (
      _expired_record.user_id,
      _trial_plan_id,
      now() + interval '365 days',
      'Auto-downgrade after ' || _expired_record.plan_name || ' expired'
    );

    -- Log the event
    INSERT INTO public.activity_log (user_id, type, payload_json)
    VALUES (
      _expired_record.user_id,
      'subscription_expired',
      jsonb_build_object(
        'event_code', 'AUTO_DOWNGRADE',
        'expired_plan', _expired_record.plan_name,
        'expired_plan_id', _expired_record.plan_id,
        'expired_at', _expired_record.expires_at,
        'new_plan_id', _trial_plan_id,
        'occurred_at', now()
      )
    );

    _downgraded_count := _downgraded_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'downgraded', _downgraded_count,
    'ran_at', now()
  );
END;
$$;

-- Allow service role to call it
GRANT EXECUTE ON FUNCTION public.auto_downgrade_expired_subscriptions() TO service_role;
