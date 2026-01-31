-- Add metadata column to owners table for branding and other settings
ALTER TABLE public.owners 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
