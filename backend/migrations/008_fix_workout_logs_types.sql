-- Fix type mismatch errors by ensuring ID columns are flexible (TEXT)
-- This resolves "invalid input syntax for type integer" when valid UUIDs are passed.

-- 1. Drop Foreign Key Constraint (prevents type change)
ALTER TABLE public.workout_logs DROP CONSTRAINT IF EXISTS workout_logs_workout_assignment_id_fkey;

-- 2. Alter workout_assignment_id to TEXT (was likely INTEGER or mismatch)
ALTER TABLE public.workout_logs 
ALTER COLUMN workout_assignment_id TYPE TEXT;

-- 2. Alter exercise_id to TEXT (to support both UUIDs and Integers/Legacy)
ALTER TABLE public.workout_logs 
ALTER COLUMN exercise_id TYPE TEXT;

-- 3. Ensure exercise_name exists (redundant safety)
ALTER TABLE public.workout_logs 
ADD COLUMN IF NOT EXISTS exercise_name TEXT;

-- 4. Ensure created_at exists
ALTER TABLE public.workout_logs 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
