
CREATE TABLE public.cleanup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'server',
  checked integer NOT NULL DEFAULT 0,
  broken integer NOT NULL DEFAULT 0,
  deleted integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cleanup_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage cleanup_logs" ON public.cleanup_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access" ON public.cleanup_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
