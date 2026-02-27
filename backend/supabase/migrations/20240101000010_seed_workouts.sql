-- 1. Create a System User (to own public content)
-- Note: Supabase ID must be a valid UUID. Using a nil UUID for system.

-- Ensure the system user exists in auth.users first (required by FK)
INSERT INTO auth.users (id, email)
VALUES ('00000000-0000-0000-0000-000000000000', 'system@fitapp.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.app_users (id, email)
VALUES ('00000000-0000-0000-0000-000000000000', 'system@fitapp.com')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Dummy Public Workouts
INSERT INTO public.workouts (user_id, title, description, difficulty, duration, is_public, exercises)
VALUES
    ('00000000-0000-0000-0000-000000000000', 'Full Body HIIT', 'High intensity interval training to burn fat.', 'Intermediate', '30 min', TRUE, 
    '[{"name": "Burpees", "sets": "3", "reps": "15"}, {"name": "Mountain Climbers", "sets": "3", "reps": "20"}]'::jsonb),
    
    ('00000000-0000-0000-0000-000000000000', 'Upper Body Power', 'Focus on chest, shoulders, and triceps.', 'Advanced', '45 min', TRUE, 
    '[{"name": "Push Ups", "sets": "4", "reps": "12"}, {"name": "Dumbbell Press", "sets": "3", "reps": "10"}]'::jsonb),
    
    ('00000000-0000-0000-0000-000000000000', 'Morning Yoga Flow', 'Gentle stretching to wake up the body.', 'Beginner', '20 min', TRUE, 
    '[{"name": "Sun Salutation", "duration": "5 min"}, {"name": "Child Pose", "duration": "2 min"}]'::jsonb),

    ('00000000-0000-0000-0000-000000000000', 'Leg Day Starter', 'Basic leg exercises for beginners.', 'Beginner', '30 min', TRUE, 
    '[{"name": "Squats", "sets": "3", "reps": "12"}, {"name": "Lunges", "sets": "3", "reps": "10"}]'::jsonb);
