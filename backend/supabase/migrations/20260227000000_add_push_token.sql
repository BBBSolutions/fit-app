-- Add push_token to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS push_token text;
