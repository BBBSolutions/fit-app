-- Migration: Fix RLS for logs and sessions (Progress Tracking)
-- 1. Updates policies to use auth.uid() instead of firebase_uid
-- 2. Adds policies for Trainers to view their clients' data

-- --- HELPER POLICY FUNCTION ---
-- (Optional, but makes policies cleaner. For now using EXISTS)

-- 1. WORKOUT LOGS
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own logs" ON public.workout_logs;
CREATE POLICY "Users can view own logs" ON public.workout_logs
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own logs" ON public.workout_logs;
CREATE POLICY "Users can insert own logs" ON public.workout_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own logs" ON public.workout_logs;
CREATE POLICY "Users can update own logs" ON public.workout_logs
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own logs" ON public.workout_logs;
CREATE POLICY "Users can delete own logs" ON public.workout_logs
    FOR DELETE USING (user_id = auth.uid());

-- Trainer Access
DROP POLICY IF EXISTS "Trainers can view client logs" ON public.workout_logs;
CREATE POLICY "Trainers can view client logs" ON public.workout_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.trainer_clients tc
            WHERE tc.client_id = public.workout_logs.user_id
            AND tc.trainer_id = auth.uid()
        )
    );

-- 2. DIET LOGS
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

-- Trainer Access
DROP POLICY IF EXISTS "Trainers can view client diet logs" ON public.diet_logs;
CREATE POLICY "Trainers can view client diet logs" ON public.diet_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.trainer_clients tc
            WHERE tc.client_id = public.diet_logs.user_id
            AND tc.trainer_id = auth.uid()
        )
    );

-- 3. MEASUREMENT LOGS
-- Assuming table exists (referenced in foreign keys)
ALTER TABLE public.measurement_logs ENABLE ROW LEVEL SECURITY;

-- Re-defining policies to be safe (DROP IF EXISTS handles pre-existence)
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

-- Trainer Access
DROP POLICY IF EXISTS "Trainers can view client measurements" ON public.measurement_logs;
CREATE POLICY "Trainers can view client measurements" ON public.measurement_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.trainer_clients tc
            WHERE tc.client_id = public.measurement_logs.user_id
            AND tc.trainer_id = auth.uid()
        )
    );

-- 4. SESSIONS
-- Existing policies only allow users to view their own. Add Trainer access.
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers can view client sessions" ON public.sessions;
CREATE POLICY "Trainers can view client sessions" ON public.sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.trainer_clients tc
            WHERE tc.client_id = public.sessions.user_id
            AND tc.trainer_id = auth.uid()
        )
    );
