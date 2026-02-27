-- Add address to leads
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS address TEXT;
