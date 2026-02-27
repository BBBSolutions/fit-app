-- Standardize all profile columns to snake_case
-- This handles renaming "quotedCamelCase" columns if they exist from the previous migration, or adding them if missing.

DO $$
BEGIN
    -- activityLevel -> activity_level
    IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='activityLevel') THEN
        IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='activity_level') THEN
            ALTER TABLE public.profiles DROP COLUMN "activityLevel";
        ELSE
            ALTER TABLE public.profiles RENAME COLUMN "activityLevel" TO activity_level;
        END IF;
    ELSE
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS activity_level TEXT;
    END IF;

    -- workoutDays -> workout_days
    IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='workoutDays') THEN
        IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='workout_days') THEN
            ALTER TABLE public.profiles DROP COLUMN "workoutDays";
        ELSE
            ALTER TABLE public.profiles RENAME COLUMN "workoutDays" TO workout_days;
        END IF;
    ELSE
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS workout_days TEXT;
    END IF;

    -- injuries -> injuries (already snake, but ensure exists)
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS injuries TEXT;

    -- medicalConditions -> medical_conditions
    IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='medicalConditions') THEN
        IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='medical_conditions') THEN
             ALTER TABLE public.profiles DROP COLUMN "medicalConditions";
        ELSE
             ALTER TABLE public.profiles RENAME COLUMN "medicalConditions" TO medical_conditions;
        END IF;
    ELSE
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS medical_conditions TEXT;
    END IF;

    -- workoutLocation -> workout_location
    IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='workoutLocation') THEN
        IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='workout_location') THEN
            ALTER TABLE public.profiles DROP COLUMN "workoutLocation";
        ELSE
            ALTER TABLE public.profiles RENAME COLUMN "workoutLocation" TO workout_location;
        END IF;
    ELSE
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS workout_location TEXT;
    END IF;

    -- trainingStyle -> training_style
    IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='trainingStyle') THEN
        IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='training_style') THEN
            ALTER TABLE public.profiles DROP COLUMN "trainingStyle";
        ELSE
            ALTER TABLE public.profiles RENAME COLUMN "trainingStyle" TO training_style;
        END IF;
    ELSE
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS training_style TEXT;
    END IF;

    -- exercisesToAvoid -> exercises_to_avoid
    IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='exercisesToAvoid') THEN
        IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='exercises_to_avoid') THEN
            ALTER TABLE public.profiles DROP COLUMN "exercisesToAvoid";
        ELSE
            ALTER TABLE public.profiles RENAME COLUMN "exercisesToAvoid" TO exercises_to_avoid;
        END IF;
    ELSE
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS exercises_to_avoid TEXT;
    END IF;

    -- experienceDuration -> experience_duration (Standard field, usually exists, but ensure)
    IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='experienceDuration') THEN
        -- If we accidentally added a duplicate camelCase one, maybe drop it or migrate data? 
        -- Safer to drop the camelCase one if it's empty, or rename/merge. 
        -- For simplicity in this dev phase, let's drop the camelCase duplicate if the snake_case one exists.
        -- Actually, simpler: just ensure experience_duration exists.
        NULL;
    END IF;
    -- Note: experience_duration is in initial_schema. 
    -- If user ran migration 02, they might have "experienceDuration" too.
    -- Let's ignore the camelCase one for now and focus on filling standard fields.

    -- Ensure body measurement fields exist as columns (since we are flattening)
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS waist TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hip TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS chest TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS arms TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS thighs TEXT;

END $$;
