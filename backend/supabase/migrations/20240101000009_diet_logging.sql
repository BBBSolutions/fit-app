-- Migration for Diet Logging feature
-- Creates a table to store daily diet logs including calories, water, and meals.

CREATE TABLE IF NOT EXISTS public.diet_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
    date DATE NOT NULL, -- The date of the log (YYYY-MM-DD)
    daily_calories INTEGER DEFAULT 0,
    water_intake INTEGER DEFAULT 0,
    meals JSONB DEFAULT '[]'::jsonb, -- Array of meal objects
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date) -- One log per user per day
);

DROP TRIGGER IF EXISTS handle_updated_at ON public.diet_logs;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.diet_logs
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

ALTER TABLE public.diet_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own diet logs" ON public.diet_logs;
CREATE POLICY "Users can view own diet logs" ON public.diet_logs
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own diet logs" ON public.diet_logs;
CREATE POLICY "Users can insert own diet logs" ON public.diet_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own diet logs" ON public.diet_logs;
CREATE POLICY "Users can update own diet logs" ON public.diet_logs
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own diet logs" ON public.diet_logs;
CREATE POLICY "Users can delete own diet logs" ON public.diet_logs
    FOR DELETE USING (user_id = auth.uid());
