
CREATE TABLE public.api_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  action text NOT NULL,
  credits_used integer NOT NULL DEFAULT 1,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.api_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage api_usage_log"
  ON public.api_usage_log FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_api_usage_log_created_at ON public.api_usage_log (created_at DESC);
CREATE INDEX idx_api_usage_log_function ON public.api_usage_log (function_name, created_at DESC);
