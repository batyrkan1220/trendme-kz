-- Explicit deny policies for non-admins on user_roles.
-- The existing "Admins can manage all roles" ALL policy stays; PostgreSQL RLS
-- evaluates policies as OR for the same command, so we add RESTRICTIVE policies
-- to ensure non-admins are explicitly blocked from INSERT/UPDATE/DELETE.

-- Block INSERT for anyone who is not an admin
CREATE POLICY "Only admins can insert user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Block UPDATE for anyone who is not an admin
CREATE POLICY "Only admins can update user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Block DELETE for anyone who is not an admin
CREATE POLICY "Only admins can delete user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Also block anon role entirely from any write to user_roles
CREATE POLICY "Anon cannot write user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);