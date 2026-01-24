-- Add plan_id to invitations table
ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL;
