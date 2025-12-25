-- 1. Create Measurement Logs Table
CREATE TABLE IF NOT EXISTS public.measurement_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL, -- 'weight', 'waist', 'hip', 'chest', 'arms', 'thighs', etc.
    value NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.measurement_logs ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Users can view own measurements" ON public.measurement_logs;
CREATE POLICY "Users can view own measurements" ON public.measurement_logs FOR SELECT USING (user_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));

DROP POLICY IF EXISTS "Users can insert own measurements" ON public.measurement_logs;
CREATE POLICY "Users can insert own measurements" ON public.measurement_logs FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));

DROP POLICY IF EXISTS "Users can delete own measurements" ON public.measurement_logs;
CREATE POLICY "Users can delete own measurements" ON public.measurement_logs FOR DELETE USING (user_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));
