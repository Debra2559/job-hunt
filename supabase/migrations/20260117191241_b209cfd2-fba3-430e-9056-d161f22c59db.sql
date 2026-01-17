-- Add policy for service role to read knowledge files for the chat function
-- This allows the edge function to read all knowledge files regardless of user

-- Also add a policy to allow reading storage objects with service role
CREATE POLICY "Service role can read all knowledge files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'knowledge');