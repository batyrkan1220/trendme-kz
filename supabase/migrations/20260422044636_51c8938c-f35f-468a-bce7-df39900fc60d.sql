-- Remove the broad admin SELECT policy on profiles.
-- Admin reads of profile data are performed by the `admin-users` Edge Function
-- using the service role, after verifying the caller's admin role server-side.
-- Keeping this policy created an unnecessary exposure path for sensitive
-- columns (phone, admin_notes, is_banned, is_deleted) directly via PostgREST
-- if an admin role assignment were ever compromised.

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

-- Owner-scoped policies remain in place:
--   * "Users can read own profile"  (SELECT, auth.uid() = user_id)
--   * "Users can insert own profile"
--   * "Users can update own profile"
-- No INSERT/UPDATE/DELETE admin policies existed; admin mutations also go
-- through the Edge Function with the service role, so behavior is unchanged.