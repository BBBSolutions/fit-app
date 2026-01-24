-- Add assigned_trainer_id to leads
ALTER TABLE public.leads
ADD COLUMN assigned_trainer_id UUID REFERENCES public.profiles(user_id);
