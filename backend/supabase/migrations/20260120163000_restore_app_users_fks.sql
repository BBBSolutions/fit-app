-- Migration: Restore Foreign Keys to app_users
-- The previous migration dropped app_users specific constraints but did not recreate them after recreating the table.

-- 0. CLEANUP ORPHANED DATA
-- Since app_users was recreated, we must remove child records that point to non-existent users
-- to satisfy the Foreign Key constraints we are about to add.

-- Messages reference profiles(user_id) directly, so must be deleted before profiles
DELETE FROM public.messages 
WHERE sender_id NOT IN (SELECT id FROM public.app_users)
   OR receiver_id NOT IN (SELECT id FROM public.app_users);

DELETE FROM public.profiles 
WHERE user_id NOT IN (SELECT id FROM public.app_users);

DELETE FROM public.workouts 
WHERE user_id NOT IN (SELECT id FROM public.app_users);

DELETE FROM public.sessions 
WHERE user_id NOT IN (SELECT id FROM public.app_users);

DELETE FROM public.media 
WHERE user_id NOT IN (SELECT id FROM public.app_users);

DELETE FROM public.subscriptions 
WHERE user_id NOT IN (SELECT id FROM public.app_users);

DELETE FROM public.payments 
WHERE user_id NOT IN (SELECT id FROM public.app_users);

DELETE FROM public.trainer_clients 
WHERE trainer_id NOT IN (SELECT id FROM public.app_users) 
   OR client_id NOT IN (SELECT id FROM public.app_users);

DELETE FROM public.workout_assignments 
WHERE trainer_id NOT IN (SELECT id FROM public.app_users)
   OR client_id NOT IN (SELECT id FROM public.app_users);

DELETE FROM public.diet_logs 
WHERE user_id NOT IN (SELECT id FROM public.app_users);

DELETE FROM public.workout_logs 
WHERE user_id NOT IN (SELECT id FROM public.app_users);

DELETE FROM public.measurement_logs 
WHERE user_id NOT IN (SELECT id FROM public.app_users);

DELETE FROM public.content 
WHERE author_id NOT IN (SELECT id FROM public.app_users);


-- 1. PROFILES
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.app_users(id)
ON DELETE CASCADE;

-- 2. WORKOUTS
ALTER TABLE public.workouts
ADD CONSTRAINT workouts_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.app_users(id)
ON DELETE CASCADE;

-- 3. SESSIONS
ALTER TABLE public.sessions
ADD CONSTRAINT sessions_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.app_users(id)
ON DELETE CASCADE;

-- 4. MEDIA
ALTER TABLE public.media
ADD CONSTRAINT media_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.app_users(id)
ON DELETE CASCADE;

-- 5. SUBSCRIPTIONS
ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.app_users(id)
ON DELETE CASCADE;

-- 6. PAYMENTS
ALTER TABLE public.payments
ADD CONSTRAINT payments_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.app_users(id)
ON DELETE CASCADE;

-- 7. TRAINER_CLIENTS
ALTER TABLE public.trainer_clients
ADD CONSTRAINT trainer_clients_trainer_id_fkey
FOREIGN KEY (trainer_id)
REFERENCES public.app_users(id)
ON DELETE CASCADE;

ALTER TABLE public.trainer_clients
ADD CONSTRAINT trainer_clients_client_id_fkey
FOREIGN KEY (client_id)
REFERENCES public.app_users(id)
ON DELETE CASCADE;

-- 8. WORKOUT_ASSIGNMENTS
ALTER TABLE public.workout_assignments
ADD CONSTRAINT workout_assignments_trainer_id_fkey
FOREIGN KEY (trainer_id)
REFERENCES public.app_users(id)
ON DELETE CASCADE;

ALTER TABLE public.workout_assignments
ADD CONSTRAINT workout_assignments_client_id_fkey
FOREIGN KEY (client_id)
REFERENCES public.app_users(id)
ON DELETE CASCADE;

-- 9. DIET_LOGS
ALTER TABLE public.diet_logs
ADD CONSTRAINT diet_logs_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.app_users(id)
ON DELETE CASCADE;

-- 10. WORKOUT_LOGS
ALTER TABLE public.workout_logs
ADD CONSTRAINT workout_logs_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.app_users(id)
ON DELETE CASCADE;

-- 11. MEASUREMENT_LOGS
ALTER TABLE public.measurement_logs
ADD CONSTRAINT measurement_logs_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.app_users(id)
ON DELETE CASCADE;

-- 12. CONTENT (Administrative content)
ALTER TABLE public.content
ADD CONSTRAINT content_author_id_fkey
FOREIGN KEY (author_id)
REFERENCES public.app_users(id)
ON DELETE CASCADE;
