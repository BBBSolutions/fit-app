-- DANGER: This script will delete ALL data and tables in the public schema.
-- Run this in the Supabase Dashboard > SQL Editor to reset your remote database.

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Restore default permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- Usage:
-- 1. Copy and run this entire script in the Supabase SQL Editor.
-- 2. In your terminal, run: supabase db push
