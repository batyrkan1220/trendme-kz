
CREATE TABLE public.saved_scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Без названия',
  content TEXT NOT NULL,
  source_video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own scripts"
  ON public.saved_scripts
  FOR ALL
  USING (is_owner(user_id))
  WITH CHECK (is_owner(user_id));
