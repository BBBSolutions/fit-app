-- Migration: Switch from Firebase Auth to Supabase Auth
-- This migration updates the app_users table to use Supabase's built-in auth.users

-- Step 1: Add phone column for phone-based authentication
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS phone TEXT;

-- Step 2: Backup existing data (optional, for safety)
-- CREATE TABLE app_users_firebase_backup AS SELECT * FROM public.app_users;

-- Step 3: Drop the old firebase_uid column and constraint
ALTER TABLE public.app_users DROP COLUMN IF EXISTS firebase_uid CASCADE;

-- Step 4: Modify the id column to directly reference auth.users
-- NOTE: This will clear existing users AND all related data! (Clean break migration)
-- Using CASCADE to drop all foreign key constraints

-- First, drop all dependent foreign key constraints explicitly to be safe
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey CASCADE;
ALTER TABLE public.workouts DROP CONSTRAINT IF EXISTS workouts_user_id_fkey CASCADE;
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey CASCADE;
ALTER TABLE public.media DROP CONSTRAINT IF EXISTS media_user_id_fkey CASCADE;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey CASCADE;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey CASCADE;
ALTER TABLE public.trainer_clients DROP CONSTRAINT IF EXISTS trainer_clients_trainer_id_fkey CASCADE;
ALTER TABLE public.trainer_clients DROP CONSTRAINT IF EXISTS trainer_clients_client_id_fkey CASCADE;
ALTER TABLE public.workout_assignments DROP CONSTRAINT IF EXISTS workout_assignments_trainer_id_fkey CASCADE;
ALTER TABLE public.workout_assignments DROP CONSTRAINT IF EXISTS workout_assignments_client_id_fkey CASCADE;
ALTER TABLE public.diet_logs DROP CONSTRAINT IF EXISTS diet_logs_user_id_fkey CASCADE;
ALTER TABLE public.workout_logs DROP CONSTRAINT IF EXISTS workout_logs_user_id_fkey CASCADE;
ALTER TABLE public.measurement_logs DROP CONSTRAINT IF EXISTS measurement_logs_user_id_fkey CASCADE;
ALTER TABLE public.content DROP CONSTRAINT IF EXISTS content_author_id_fkey CASCADE;

-- Now drop the app_users table
DROP TABLE IF EXISTS public.app_users CASCADE;

-- Recreate app_users with direct reference to auth.users
CREATE TABLE public.app_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Update RLS policies
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Users can view their own identity (using Supabase auth.uid())
DROP POLICY IF EXISTS "Users can view their own identity" ON public.app_users;
CREATE POLICY "Users can view their own identity" ON public.app_users
    FOR SELECT USING (auth.uid() = id);

-- Users can insert their own record
DROP POLICY IF EXISTS "Users can insert own record" ON public.app_users;
CREATE POLICY "Users can insert own record" ON public.app_users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own record
DROP POLICY IF EXISTS "Users can update own record" ON public.app_users;
CREATE POLICY "Users can update own record" ON public.app_users
    FOR UPDATE USING (auth.uid() = id);

-- Step 6: Update profiles table RLS policies to use auth.uid()
-- Since profiles.user_id references app_users.id, and app_users.id now = auth.uid(), simplify:

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Step 7: Update other tables that reference app_users
-- workouts, sessions, media, subscriptions, payments, etc.
-- Their RLS policies should also be updated to use auth.uid()

-- Workouts
DROP POLICY IF EXISTS "Users can view own workouts" ON public.workouts;
CREATE POLICY "Users can view own workouts" ON public.workouts
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own workouts" ON public.workouts;
CREATE POLICY "Users can create own workouts" ON public.workouts
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own workouts" ON public.workouts;
CREATE POLICY "Users can update own workouts" ON public.workouts
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own workouts" ON public.workouts;
CREATE POLICY "Users can delete own workouts" ON public.workouts
    FOR DELETE USING (user_id = auth.uid());

-- Sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
CREATE POLICY "Users can view own sessions" ON public.sessions
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own sessions" ON public.sessions;
CREATE POLICY "Users can create own sessions" ON public.sessions
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;
CREATE POLICY "Users can update own sessions" ON public.sessions
    FOR UPDATE USING (user_id = auth.uid());

-- Media
DROP POLICY IF EXISTS "Users can view own media" ON public.media;
CREATE POLICY "Users can view own media" ON public.media
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own media" ON public.media;
CREATE POLICY "Users can insert own media" ON public.media
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own media" ON public.media;
CREATE POLICY "Users can delete own media" ON public.media
    FOR DELETE USING (user_id = auth.uid());

-- Subscriptions
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (user_id = auth.uid());

-- Payments
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (user_id = auth.uid());

-- Create trigger to auto-create app_users entry on Supabase signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.app_users (id, email, phone)
    VALUES (NEW.id, NEW.email, NEW.phone);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
