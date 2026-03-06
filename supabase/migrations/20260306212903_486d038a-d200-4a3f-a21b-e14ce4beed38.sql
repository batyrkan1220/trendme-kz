
-- Create public bucket for video covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('video-covers', 'video-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read (public bucket)
CREATE POLICY "Public read video covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'video-covers');

-- Allow service role / backend to insert/update/delete
CREATE POLICY "Backend manage video covers"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'video-covers')
  WITH CHECK (bucket_id = 'video-covers');
