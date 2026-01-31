-- Add contact and location details to branches table
ALTER TABLE public.branches
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
