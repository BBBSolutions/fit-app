-- Add gym_code to leads, content, and plans to support multi-tenancy

-- LEADS
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS gym_code TEXT;

-- CONTENT
ALTER TABLE public.content 
ADD COLUMN IF NOT EXISTS gym_code TEXT;

-- PLANS
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS gym_code TEXT;

-- Update Policies to restrict access by gym_code (Optional but recommended)
-- For now, the application logic (Edge Functions) will handle the filtering by gym_code.
-- RLs can be updated later for stricter security.
