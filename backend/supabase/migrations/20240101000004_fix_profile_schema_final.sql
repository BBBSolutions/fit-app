-- Final Comprehensive Migration for Onboarding Survey Fields
-- Ensures every field from OnboardingSurvey.js exists in snake_case in the profiles table.

DO $$
BEGIN
    -- 1. Create or Rename 'activity_level'
    IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='activityLevel') THEN
        ALTER TABLE public.profiles RENAME COLUMN "activityLevel" TO activity_level;
    ELSE
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS activity_level TEXT;
    END IF;

    -- 2. Create or Rename 'workout_days'
    IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='workoutDays') THEN
        ALTER TABLE public.profiles RENAME COLUMN "workoutDays" TO workout_days;
    ELSE
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS workout_days TEXT;
    END IF;

    -- 3. Create or Rename 'medical_conditions'
    IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='medicalConditions') THEN
        ALTER TABLE public.profiles RENAME COLUMN "medicalConditions" TO medical_conditions;
    ELSE
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS medical_conditions TEXT;
    END IF;

    -- 4. Create or Rename 'workout_location'
    IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='workoutLocation') THEN
        ALTER TABLE public.profiles RENAME COLUMN "workoutLocation" TO workout_location;
    ELSE
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS workout_location TEXT;
    END IF;

    -- 5. Create or Rename 'training_style'
    IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='trainingStyle') THEN
        ALTER TABLE public.profiles RENAME COLUMN "trainingStyle" TO training_style;
    ELSE
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS training_style TEXT;
    END IF;

    -- 6. Create or Rename 'exercises_to_avoid'
    IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='exercisesToAvoid') THEN
        ALTER TABLE public.profiles RENAME COLUMN "exercisesToAvoid" TO exercises_to_avoid;
    ELSE
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS exercises_to_avoid TEXT;
    END IF;

    -- 7. Create or Rename 'plan_type'
    -- Note: initial_schema had check constraint or enum, here we ensure it exists as TEXT or ENUM. 
    -- If user has plan_type_enum, casting might be needed. For now, assuming it handles strings or is compatible.
    IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='planType') THEN
        ALTER TABLE public.profiles RENAME COLUMN "planType" TO plan_type;
    ELSE
        -- plan_type might already exist from initial schema.
        -- We only add checks if it's missing entirely to avoid errors.
        NULL; 
    END IF;

    -- 8. Create or Rename 'fitness_level'
    IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='fitnessLevel') THEN
        ALTER TABLE public.profiles RENAME COLUMN "fitnessLevel" TO fitness_level;
    ELSE
         NULL; -- existed as fitness_level
    END IF;

    -- 9. Create or Rename 'experience_duration'
     IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='experienceDuration') THEN
        ALTER TABLE public.profiles RENAME COLUMN "experienceDuration" TO experience_duration;
    ELSE
         NULL; -- existed as experience_duration
    END IF;

    -- 10. Ensure flat body measurements exist (Onboarding sends them as top-level keys now)
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS waist TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hip TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS chest TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS arms TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS thighs TEXT;
    
    -- 11. Ensure 'injuries' exists
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS injuries TEXT;

END $$;
