-- Add status tracking for feedback management
ALTER TABLE public.feedbacks 
ADD COLUMN status text NOT NULL DEFAULT 'pending',
ADD COLUMN admin_notes text,
ADD COLUMN resolved_at timestamp with time zone,
ADD COLUMN resolved_by uuid;

-- Add index for status queries
CREATE INDEX idx_feedbacks_status ON public.feedbacks(status);

-- Update RLS policy to allow admins to update feedbacks
CREATE POLICY "Admins can update feedback status"
ON public.feedbacks
FOR UPDATE
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));