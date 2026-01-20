-- Add Address column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
