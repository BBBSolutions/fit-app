-- Add missing fields for Gym Owners
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gym_branch_name text,
ADD COLUMN IF NOT EXISTS members_count text,
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS email text;
