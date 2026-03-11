
-- Content reports table for flagging objectionable content
CREATE TABLE public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id text NOT NULL,
  video_url text NOT NULL,
  author_username text,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON public.content_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own reports" ON public.content_reports
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reports" ON public.content_reports
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports" ON public.content_reports
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Blocked users table
CREATE TABLE public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  blocked_username text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, blocked_username)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own blocks" ON public.blocked_users
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- EULA acceptance tracking
CREATE TABLE public.eula_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  version text NOT NULL DEFAULT '1.0'
);

ALTER TABLE public.eula_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own acceptance" ON public.eula_acceptances
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own acceptance" ON public.eula_acceptances
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
