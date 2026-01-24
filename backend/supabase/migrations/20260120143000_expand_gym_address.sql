-- Add expanded address fields for Gym Owners (stored in profiles for MVP)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gym_street text,
ADD COLUMN IF NOT EXISTS gym_city text,
ADD COLUMN IF NOT EXISTS gym_country text,
ADD COLUMN IF NOT EXISTS gym_pincode text;
