-- Add missing columns to profiles table based on OnboardingSurvey.js
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS "activityLevel" TEXT,
ADD COLUMN IF NOT EXISTS "workoutDays" TEXT,
ADD COLUMN IF NOT EXISTS "injuries" TEXT,
ADD COLUMN IF NOT EXISTS "medicalConditions" TEXT,
ADD COLUMN IF NOT EXISTS "workoutLocation" TEXT,
ADD COLUMN IF NOT EXISTS "trainingStyle" TEXT,
ADD COLUMN IF NOT EXISTS "exercisesToAvoid" TEXT,
ADD COLUMN IF NOT EXISTS "experienceDuration" TEXT,
ADD COLUMN IF NOT EXISTS "waist" TEXT,
ADD COLUMN IF NOT EXISTS "hip" TEXT,
ADD COLUMN IF NOT EXISTS "chest" TEXT,
ADD COLUMN IF NOT EXISTS "arms" TEXT,
ADD COLUMN IF NOT EXISTS "thighs" TEXT;
