
CREATE TABLE public.trend_niche_cursors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  niche text NOT NULL UNIQUE,
  cursor integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Service-role only (edge function uses adminClient)
ALTER TABLE public.trend_niche_cursors ENABLE ROW LEVEL SECURITY;

-- Admins can read for debugging
CREATE POLICY "Admins can manage niche cursors"
  ON public.trend_niche_cursors FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
