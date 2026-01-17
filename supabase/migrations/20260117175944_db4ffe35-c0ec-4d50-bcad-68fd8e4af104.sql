-- Add grade column to profiles table for student verification
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS grade text;

-- Add verified column to track if student has completed verification
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;