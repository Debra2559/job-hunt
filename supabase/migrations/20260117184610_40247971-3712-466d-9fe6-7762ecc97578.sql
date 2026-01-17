-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics;

-- Create a more restrictive policy - users can only insert their own analytics
CREATE POLICY "Users can insert their own analytics"
ON public.analytics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);