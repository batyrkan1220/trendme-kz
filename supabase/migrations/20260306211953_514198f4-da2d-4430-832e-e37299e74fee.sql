
CREATE TABLE public.cover_refresh_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  total_videos integer NOT NULL DEFAULT 0,
  total_updated integer NOT NULL DEFAULT 0,
  total_failed integer NOT NULL DEFAULT 0,
  current_offset integer NOT NULL DEFAULT 0,
  error_message text,
  triggered_by uuid
);

ALTER TABLE public.cover_refresh_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage cover_refresh_logs"
  ON public.cover_refresh_logs FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
