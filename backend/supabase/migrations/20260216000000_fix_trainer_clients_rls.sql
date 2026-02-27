-- Migration: Fix RLS policies for trainer_clients and workout_assignments
-- Replaces deprecated 'firebase_uid' logic with direct 'auth.uid()' checks

-- 1. FIX TRAINER_CLIENTS POLICIES
ALTER TABLE public.trainer_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers can view their clients" ON public.trainer_clients;
CREATE POLICY "Trainers can view their clients" ON public.trainer_clients
    FOR SELECT USING (trainer_id = auth.uid());

DROP POLICY IF EXISTS "Trainers can add clients" ON public.trainer_clients;
CREATE POLICY "Trainers can add clients" ON public.trainer_clients
    FOR INSERT WITH CHECK (trainer_id = auth.uid());

DROP POLICY IF EXISTS "Trainers can update their clients" ON public.trainer_clients;
CREATE POLICY "Trainers can update their clients" ON public.trainer_clients
    FOR UPDATE USING (trainer_id = auth.uid());

DROP POLICY IF EXISTS "Clients can view their trainer" ON public.trainer_clients;
CREATE POLICY "Clients can view their trainer" ON public.trainer_clients
    FOR SELECT USING (client_id = auth.uid());

-- 2. FIX WORKOUT_ASSIGNMENTS POLICIES
ALTER TABLE public.workout_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers can manage assignments" ON public.workout_assignments;
CREATE POLICY "Trainers can manage assignments" ON public.workout_assignments
    FOR ALL USING (trainer_id = auth.uid());

DROP POLICY IF EXISTS "Clients can view assignments" ON public.workout_assignments;
CREATE POLICY "Clients can view assignments" ON public.workout_assignments
    FOR SELECT USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can update assignments" ON public.workout_assignments;
CREATE POLICY "Clients can update assignments" ON public.workout_assignments
    FOR UPDATE USING (client_id = auth.uid());

-- 3. FIX WORKOUTS POLICY (Clients viewing assigned workouts)
-- Previous policy used nested subquery with firebase_uid
DROP POLICY IF EXISTS "Clients can view assigned private workouts" ON public.workouts;
CREATE POLICY "Clients can view assigned private workouts" ON public.workouts
    FOR SELECT USING (
        id IN (
            SELECT workout_id 
            FROM public.workout_assignments 
            WHERE client_id = auth.uid()
        )
    );
