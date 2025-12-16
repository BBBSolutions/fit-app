-- Migration to add 'email' column to profiles table
-- This fixes the error where updating profile fails because 'email' is missing.

DO $$
BEGIN
    IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
END $$;
