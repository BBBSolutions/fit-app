-- Add assigned_trainer_id to leads
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS assigned_trainer_id UUID REFERENCES public.profiles(user_id);
