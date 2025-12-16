-- Migration to add Trainer-specific fields to the profiles table

DO $$
BEGIN
    -- 1. Ensure basic fields exist (shared with Member)
    -- 'full_name' is often created by triggers, but let's ensure it exists.
    -- If 'name' exists instead, we might want to standardize, but for now let's just add full_name if missing.
    IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF;

    -- 'age'
    IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='age') THEN
        ALTER TABLE public.profiles ADD COLUMN age TEXT; -- Keeping as TEXT to match flexible input, or INTEGER if strict
    END IF;

    -- 'gender'
    IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='gender') THEN
        ALTER TABLE public.profiles ADD COLUMN gender TEXT;
    END IF;
    
    -- 'phone_number' (might be in auth.users, but good to have in profile for display/logic)
    IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone_number') THEN
        ALTER TABLE public.profiles ADD COLUMN phone_number TEXT;
    END IF;

    -- 2. Add Trainer-Specific Fields
    
    -- 'years_of_experience'
    IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='years_of_experience') THEN
        ALTER TABLE public.profiles ADD COLUMN years_of_experience TEXT;
    END IF;

    -- 'primary_specialization'
    IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='primary_specialization') THEN
        ALTER TABLE public.profiles ADD COLUMN primary_specialization TEXT;
    END IF;

    -- 'secondary_skills' (Array of text)
    IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='secondary_skills') THEN
        ALTER TABLE public.profiles ADD COLUMN secondary_skills TEXT[];
    END IF;

    -- 'certification_type'
    IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='certification_type') THEN
        ALTER TABLE public.profiles ADD COLUMN certification_type TEXT;
    END IF;

    -- 'certification_notes'
    IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='certification_notes') THEN
        ALTER TABLE public.profiles ADD COLUMN certification_notes TEXT;
    END IF;

    -- 'coaching_method'
    IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='coaching_method') THEN
        ALTER TABLE public.profiles ADD COLUMN coaching_method TEXT;
    END IF;

    -- 'client_type'
    IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='client_type') THEN
        ALTER TABLE public.profiles ADD COLUMN client_type TEXT;
    END IF;

    -- 'max_clients'
    IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='max_clients') THEN
        ALTER TABLE public.profiles ADD COLUMN max_clients TEXT; -- or INTEGER
    END IF;

    -- 'bio'
    IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='bio') THEN
        ALTER TABLE public.profiles ADD COLUMN bio TEXT;
    END IF;

    -- 'role' (admin, trainer, member) - useful for RLS and UI logic
    IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'member';
    END IF;

END $$;
