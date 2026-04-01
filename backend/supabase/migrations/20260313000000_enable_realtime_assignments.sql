-- Enable Supabase Realtime on the workout_assignments table
-- This is required for the member app to receive live updates
-- when a trainer assigns a new workout.

ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_assignments;
