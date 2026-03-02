-- Block all write operations on videos table for authenticated users
-- Only service_role (used by edge functions) can write to this table

CREATE POLICY "No direct inserts on videos"
ON public.videos
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "No direct updates on videos"
ON public.videos
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "No direct deletes on videos"
ON public.videos
FOR DELETE
TO authenticated
USING (false);