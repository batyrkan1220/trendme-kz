
-- Restore EXECUTE permissions on security-definer helper functions used by RLS policies
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon, service_role, public;
GRANT EXECUTE ON FUNCTION public.is_owner(uuid) TO authenticated, anon, service_role, public;
