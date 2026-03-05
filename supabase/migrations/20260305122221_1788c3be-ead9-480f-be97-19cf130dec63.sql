
CREATE TABLE public.recat_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  finished_at timestamp with time zone,
  status text NOT NULL DEFAULT 'running',
  total_processed integer NOT NULL DEFAULT 0,
  total_updated integer NOT NULL DEFAULT 0,
  total_unchanged integer NOT NULL DEFAULT 0,
  total_videos integer NOT NULL DEFAULT 0,
  current_offset integer NOT NULL DEFAULT 0,
  error_message text,
  triggered_by uuid
);

ALTER TABLE public.recat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage recat_logs"
  ON public.recat_logs
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
