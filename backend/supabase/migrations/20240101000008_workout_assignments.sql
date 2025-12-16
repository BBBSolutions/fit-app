-- 1. Create Workout Assignments Table
CREATE TABLE IF NOT EXISTS public.workout_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    status TEXT DEFAULT 'assigned', -- assigned, in_progress, completed
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Trigger for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.workout_assignments
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- 3. RLS for workout_assignments
ALTER TABLE public.workout_assignments ENABLE ROW LEVEL SECURITY;

-- Trainers can manage their assignments
CREATE POLICY "Trainers can manage assignments" ON public.workout_assignments
    FOR ALL USING (trainer_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));

-- Clients can view their assignments
CREATE POLICY "Clients can view assignments" ON public.workout_assignments
    FOR SELECT USING (client_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));

-- Clients can update status of their assignments (e.g. mark complete)
CREATE POLICY "Clients can update assignments" ON public.workout_assignments
    FOR UPDATE USING (client_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));


-- 4. Update RLS on WORKOUTS table to allow clients to view assigned workouts
-- (Originally, users can only view their own workouts or public ones)

CREATE POLICY "Clients can view assigned private workouts" ON public.workouts
    FOR SELECT USING (
        id IN (
            SELECT workout_id 
            FROM public.workout_assignments 
            WHERE client_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text)
        )
    );
