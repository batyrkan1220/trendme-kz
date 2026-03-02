
-- Plans table
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_rub integer NOT NULL DEFAULT 0,
  duration_days integer NOT NULL DEFAULT 30,
  max_requests integer NOT NULL DEFAULT 100,
  max_tracked_accounts integer NOT NULL DEFAULT 5,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read active plans
CREATE POLICY "Authenticated can read plans"
ON public.plans FOR SELECT TO authenticated
USING (true);

-- Admins can manage plans
CREATE POLICY "Admins can manage plans"
ON public.plans FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- User subscriptions table
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  assigned_by uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read own subscriptions
CREATE POLICY "Users can read own subscriptions"
ON public.user_subscriptions FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage subscriptions"
ON public.user_subscriptions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default plans
INSERT INTO public.plans (name, price_rub, duration_days, max_requests, max_tracked_accounts, features, sort_order) VALUES
('Старт', 0, 30, 100, 5, '["100 запросов/мес", "5 отслеживаемых авторов", "Базовый анализ"]'::jsonb, 1),
('Про', 2990, 30, 5000, 50, '["5 000 запросов/мес", "50 отслеживаемых авторов", "Полный анализ", "Экспорт данных"]'::jsonb, 2),
('Бизнес', 9990, 30, -1, -1, '["Безлимитные запросы", "Безлимитные авторы", "API доступ", "Приоритетная поддержка"]'::jsonb, 3);
