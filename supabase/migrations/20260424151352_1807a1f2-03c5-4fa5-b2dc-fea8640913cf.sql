-- Explicit deny-all to satisfy linter; service role bypasses RLS regardless.
CREATE POLICY "search_cache_no_public_access"
  ON public.search_cache
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);