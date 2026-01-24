-- Add type column to plans table
ALTER TABLE public.plans
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Membership';
