-- Add tags column to feedbacks table for categorization
ALTER TABLE public.feedbacks 
ADD COLUMN tags text[] DEFAULT '{}'::text[];