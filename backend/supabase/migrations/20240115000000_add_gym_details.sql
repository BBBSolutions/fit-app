-- Add Gym Owner specific columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gym_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branch_name TEXT;
-- Store extra details like member count in metadata if needed, or add columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gym_metadata JSONB DEFAULT '{}'::jsonb;
