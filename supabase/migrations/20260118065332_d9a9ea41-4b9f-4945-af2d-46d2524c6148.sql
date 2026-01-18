-- Fix the overly permissive INSERT policy - only service role should insert
DROP POLICY IF EXISTS "Service role can insert knowledge usage" ON public.knowledge_usage;

-- Service role bypass RLS by default, so no explicit insert policy needed for service role
-- The table will only accept inserts from service role (edge functions)