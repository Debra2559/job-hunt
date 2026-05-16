-- 1. Remove overly permissive storage policy on the private 'knowledge' bucket
DROP POLICY IF EXISTS "Service role can read all knowledge files" ON storage.objects;

-- 2. Lock down user_roles: only super_admins may insert/update/delete roles
-- Add restrictive policies that block non-super-admins from privilege escalation
CREATE POLICY "Only super admins can insert roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Only super admins can update roles"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Only super admins can delete roles"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));