
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. User roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. RLS on user_roles: admins can manage, users can read their own
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 5. Trend settings table (niche keywords, thresholds, etc.)
CREATE TABLE public.trend_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.trend_settings ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read settings
CREATE POLICY "Authenticated can read trend_settings"
  ON public.trend_settings FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can manage trend_settings"
  ON public.trend_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Trend refresh logs table
CREATE TABLE public.trend_refresh_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode text NOT NULL DEFAULT 'full',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  total_saved integer DEFAULT 0,
  general_saved integer DEFAULT 0,
  niche_stats jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'running',
  error_message text,
  triggered_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.trend_refresh_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage refresh logs"
  ON public.trend_refresh_logs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role inserts logs from edge function (no RLS bypass needed, uses service role)
