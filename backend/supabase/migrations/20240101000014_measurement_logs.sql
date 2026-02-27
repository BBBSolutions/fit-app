-- Create measurement_logs table which was missing but referenced in later migrations
-- Timestamp is set to run before 2026 files

CREATE TABLE IF NOT EXISTS public.measurement_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Weight & Body Composition
    weight NUMERIC,
    body_fat_percentage NUMERIC,
    muscle_mass_percentage NUMERIC,
    water_percentage NUMERIC,
    bone_mass NUMERIC,
    visceral_fat NUMERIC,
    bmr NUMERIC,
    metabolic_age INTEGER,
    
    -- Circumference Measurements (cm/in)
    waist NUMERIC,
    hip NUMERIC,
    chest NUMERIC,
    arms NUMERIC,
    thighs NUMERIC,
    neck NUMERIC,
    shoulders NUMERIC,
    calves NUMERIC,
    
    notes TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.measurement_logs;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.measurement_logs
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- RLS
ALTER TABLE public.measurement_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own measurements" ON public.measurement_logs;
CREATE POLICY "Users can view own measurements" ON public.measurement_logs
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own measurements" ON public.measurement_logs;
CREATE POLICY "Users can insert own measurements" ON public.measurement_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own measurements" ON public.measurement_logs;
CREATE POLICY "Users can update own measurements" ON public.measurement_logs
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own measurements" ON public.measurement_logs;
CREATE POLICY "Users can delete own measurements" ON public.measurement_logs
    FOR DELETE USING (user_id = auth.uid());
