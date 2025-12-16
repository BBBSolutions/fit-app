-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "moddatetime";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. APP USERS (Mapping Firebase UID to internal UUID)
CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid TEXT UNIQUE NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own identity" ON public.app_users
    FOR SELECT USING (auth.uid()::text = firebase_uid);

-- 2. PROFILES
CREATE TYPE public.gender_enum AS ENUM ('Male', 'Female', 'Other');
CREATE TYPE public.fitness_level_enum AS ENUM ('Beginner', 'Intermediate', 'Advanced');
CREATE TYPE public.plan_type_enum AS ENUM ('Free', 'AI', 'AI Premium');

CREATE TABLE IF NOT EXISTS public.profiles (
    user_id UUID PRIMARY KEY REFERENCES public.app_users(id) ON DELETE CASCADE,
    name TEXT,
    avatar_url TEXT,
    age INTEGER,
    gender public.gender_enum,
    height TEXT, -- stored as text to allow formatting like '175 cm' or parsed later
    weight TEXT,
    fitness_level public.fitness_level_enum,
    experience_duration TEXT,
    goal TEXT,
    body_measurements JSONB DEFAULT '{}'::jsonb, -- waist, hip, chest, etc.
    preferences JSONB DEFAULT '{}'::jsonb, -- injuries, medical_conditions, equipment, etc.
    plan_type public.plan_type_enum DEFAULT 'Free',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (user_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (user_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));


-- 3. WORKOUTS
CREATE TABLE IF NOT EXISTS public.workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    difficulty public.fitness_level_enum,
    duration TEXT,
    calories TEXT,
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of objects: { name, sets, reps, instructions, etc. }
    metadata JSONB DEFAULT '{}'::jsonb, -- week, day, tags
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.workouts
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workouts" ON public.workouts
    FOR SELECT USING (user_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Users can view public workouts" ON public.workouts
    FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can create own workouts" ON public.workouts
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Users can update own workouts" ON public.workouts
    FOR UPDATE USING (user_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Users can delete own workouts" ON public.workouts
    FOR DELETE USING (user_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));


-- 4. WORKOUT SESSIONS
CREATE TYPE public.session_status_enum AS ENUM ('started', 'completed', 'abandoned');

CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
    status public.session_status_enum DEFAULT 'started',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    logs JSONB DEFAULT '{}'::jsonb, -- Records of sets/reps actually done
    metrics JSONB DEFAULT '{}'::jsonb, -- total_calories, avg_heart_rate, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.sessions
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON public.sessions
    FOR SELECT USING (user_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Users can create own sessions" ON public.sessions
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Users can update own sessions" ON public.sessions
    FOR UPDATE USING (user_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));


-- 5. MEDIA
CREATE TABLE IF NOT EXISTS public.media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
    bucket_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    type TEXT, -- mime type
    size_bytes BIGINT,
    metadata JSONB DEFAULT '{}'::jsonb, -- width, height, duration
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own media" ON public.media
    FOR SELECT USING (user_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Users can insert own media" ON public.media
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Users can delete own media" ON public.media
    FOR DELETE USING (user_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));


-- 6. PAYMENTS & SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT, -- active, canceling, canceled, past_due
    current_period_end TIMESTAMPTZ,
    plan_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (user_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT,
    amount INTEGER,
    currency TEXT,
    status TEXT, -- succeeded, pending, failed
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (user_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));
