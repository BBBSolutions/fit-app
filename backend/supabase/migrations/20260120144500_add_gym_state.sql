-- Add gym_state column for expanded address
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gym_state text;
