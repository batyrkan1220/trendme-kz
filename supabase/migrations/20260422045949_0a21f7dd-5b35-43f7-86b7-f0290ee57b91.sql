-- Revoke column-level SELECT on admin_notes from regular users
REVOKE SELECT (admin_notes) ON public.profiles FROM authenticated;
REVOKE SELECT (admin_notes) ON public.profiles FROM anon;

-- Ensure admins retain full read access via existing role check
-- (Admins query through service role / has_role-based policies in admin functions)
-- Add an explicit admin SELECT policy so admins can read all profile data including admin_notes
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Grant column-level SELECT back on all non-sensitive columns to authenticated
GRANT SELECT (
  id, user_id, name, phone, niche, goal, platform, experience,
  onboarding_completed, is_banned, is_deleted,
  free_scripts_left, free_analyses_left,
  created_at, updated_at
) ON public.profiles TO authenticated;