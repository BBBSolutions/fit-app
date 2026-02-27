-- Add lost_reason to leads
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS lost_reason TEXT;

-- Create lead_logs table
CREATE TABLE IF NOT EXISTS public.lead_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    type TEXT DEFAULT 'Note', -- Call, Meeting, Note
    created_by UUID REFERENCES auth.users(id), -- Or profiles(user_id) if available and suitable
    created_at TIMESTAMPTZ DEFAULT NOW(),
    gym_code TEXT -- For tenancy
);

ALTER TABLE public.lead_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage lead logs" ON public.lead_logs;
CREATE POLICY "Admins can manage lead logs" ON public.lead_logs
    FOR ALL USING (auth.role() = 'authenticated');
