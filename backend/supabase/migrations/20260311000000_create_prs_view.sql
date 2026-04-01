-- Create a view for User Personal Records (PRs)
-- It calculates the maximum weight lifted per user and exercise from workout_logs

-- Drop first in case we need to recreate
DROP VIEW IF EXISTS public.user_personal_records;

CREATE OR REPLACE VIEW public.user_personal_records AS
SELECT 
    user_id,
    exercise_id,
    exercise_name,
    MAX(
        -- Cast the extracted numeric string to a numeric value. 
        -- If it doesn't match the regex (e.g. 'bodyweight'), it falls back to 0.
        COALESCE(
            NULLIF(
                SUBSTRING(weight FROM '([0-9]+[.]?[0-9]*)'), ''
            )::numeric, 
            0
        )
    ) as max_weight
FROM 
    public.workout_logs
WHERE 
    weight IS NOT NULL 
    AND weight != ''
GROUP BY 
    user_id,
    exercise_id,
    exercise_name;

-- Grant permissions for authenticated users to view
GRANT SELECT ON public.user_personal_records TO authenticated;
GRANT SELECT ON public.user_personal_records TO service_role;
