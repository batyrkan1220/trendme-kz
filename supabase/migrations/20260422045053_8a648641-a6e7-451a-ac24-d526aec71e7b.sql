-- Replace the permissive UPDATE policy on profiles with one that explicitly
-- forbids users from modifying privileged/operational columns.
-- Sensitive columns (is_banned, is_deleted, free_scripts_left, free_analyses_left,
-- admin_notes) can only be changed by service-role / admin paths that bypass RLS.

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND is_banned          = (SELECT p.is_banned          FROM public.profiles p WHERE p.user_id = auth.uid())
  AND is_deleted         = (SELECT p.is_deleted         FROM public.profiles p WHERE p.user_id = auth.uid())
  AND free_scripts_left  = (SELECT p.free_scripts_left  FROM public.profiles p WHERE p.user_id = auth.uid())
  AND free_analyses_left = (SELECT p.free_analyses_left FROM public.profiles p WHERE p.user_id = auth.uid())
  AND admin_notes IS NOT DISTINCT FROM (SELECT p.admin_notes FROM public.profiles p WHERE p.user_id = auth.uid())
);