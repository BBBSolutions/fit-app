-- Add address to leads
ALTER TABLE public.leads
ADD COLUMN address TEXT;
