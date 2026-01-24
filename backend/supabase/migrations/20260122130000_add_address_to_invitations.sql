-- Add address to invitations
ALTER TABLE public.invitations
ADD COLUMN IF NOT EXISTS address TEXT;
