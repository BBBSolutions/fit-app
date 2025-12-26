-- 1. Ensure workout_assignments table exists (in case it was missed)
CREATE TABLE IF NOT EXISTS public.workout_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID REFERENCES public.app_users(id),
    client_id UUID REFERENCES public.app_users(id),
    workout_id UUID REFERENCES public.workouts(id),
    status TEXT DEFAULT 'assigned', -- assigned, completed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.workout_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for assignments
DROP POLICY IF EXISTS "Trainers can manage assignments" ON public.workout_assignments;
CREATE POLICY "Trainers can manage assignments" ON public.workout_assignments 
    USING (trainer_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));

DROP POLICY IF EXISTS "Clients can view their assignments" ON public.workout_assignments;
CREATE POLICY "Clients can view their assignments" ON public.workout_assignments 
    FOR SELECT USING (client_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));

DROP POLICY IF EXISTS "Clients can update their assignments status" ON public.workout_assignments;
CREATE POLICY "Clients can update their assignments status" ON public.workout_assignments 
    FOR UPDATE USING (client_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));

-- 2. Ensure workout_logs table exists
CREATE TABLE IF NOT EXISTS public.workout_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.app_users(id),
    workout_assignment_id UUID REFERENCES public.workout_assignments(id) ON DELETE CASCADE,
    exercise_id TEXT, -- Can be UUID or string for custom
    set_number INTEGER,
    weight NUMERIC,
    reps NUMERIC,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

-- Policies for logs
DROP POLICY IF EXISTS "Users can manage their own logs" ON public.workout_logs;
CREATE POLICY "Users can manage their own logs" ON public.workout_logs 
    USING (user_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));

-- 3. Add exercise_name and created_at columns (THE FIX)
ALTER TABLE public.workout_logs 
ADD COLUMN IF NOT EXISTS exercise_name TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Backfill exercise_name from key join with exercises table
-- Only updates logs where exercise_name is NULL and exercise_id matches a known exercise UUID
UPDATE public.workout_logs
SET exercise_name = public.exercises.name
FROM public.exercises
WHERE public.workout_logs.exercise_id::text = public.exercises.id::text
AND public.workout_logs.exercise_name IS NULL;

-- 5. Create Metadata/Index for performance
CREATE INDEX IF NOT EXISTS idx_workout_logs_exercise_name ON public.workout_logs(exercise_name);
CREATE INDEX IF NOT EXISTS idx_workout_logs_exercise_id ON public.workout_logs(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON public.workout_logs(user_id, created_at DESC);
