-- 1. Workout Logs Table
CREATE TABLE IF NOT EXISTS public.workout_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
    workout_assignment_id UUID REFERENCES public.workout_assignments(id) ON DELETE CASCADE,
    exercise_id INT NOT NULL, -- ID from the JSON exercise array
    exercise_name TEXT NOT NULL,
    set_number INT NOT NULL,
    weight TEXT,
    reps TEXT,
    notes TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS for workout_logs
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs" ON public.workout_logs
    FOR SELECT USING (user_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Users can insert own logs" ON public.workout_logs
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Users can update own logs" ON public.workout_logs
    FOR UPDATE USING (user_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Users can delete own logs" ON public.workout_logs
    FOR DELETE USING (user_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));
