-- Fix saved_scripts RLS: restrict to authenticated users only
DROP POLICY IF EXISTS "Users manage own scripts" ON public.saved_scripts;

CREATE POLICY "Users manage own scripts"
  ON public.saved_scripts
  FOR ALL
  TO authenticated
  USING (is_owner(user_id))
  WITH CHECK (is_owner(user_id));