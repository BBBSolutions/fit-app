-- Ensure workout_assignments table exists with correct schema

CREATE TABLE IF NOT EXISTS public.workout_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'assigned', -- Simple text status: 'assigned', 'completed'
    notes TEXT,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure RLS
ALTER TABLE public.workout_assignments ENABLE ROW LEVEL SECURITY;

-- Policies (Re-create to be safe)
DROP POLICY IF EXISTS "Users can view own assignments" ON public.workout_assignments;
CREATE POLICY "Users can view own assignments" ON public.workout_assignments
    FOR SELECT USING (client_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text) OR trainer_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));

DROP POLICY IF EXISTS "Trainers can manage assignments" ON public.workout_assignments;
CREATE POLICY "Trainers can manage assignments" ON public.workout_assignments
    FOR ALL USING (trainer_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));

-- Allow self-assignment (Important for Custom Workouts)
DROP POLICY IF EXISTS "Users can assign to themselves" ON public.workout_assignments;
CREATE POLICY "Users can assign to themselves" ON public.workout_assignments
    FOR INSERT WITH CHECK (client_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text) AND trainer_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));
