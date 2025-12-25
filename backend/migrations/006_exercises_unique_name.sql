-- Add unique constraint to exercises name to allow upserts
ALTER TABLE exercises ADD CONSTRAINT exercises_name_key UNIQUE (name);
