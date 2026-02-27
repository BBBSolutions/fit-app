-- FORCE REAPPLY MIGRATIONS
-- This script clears the migration history so 'supabase db push' will apply all files again.
-- Run this in Supabase Dashboard > SQL Editor.

TRUNCATE TABLE supabase_migrations.schema_migrations;

-- After running this, go to your terminal and run:
-- supabase db push
