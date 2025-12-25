-- Create a view to easily fetch Personal Records (Max Weight) per exercise for each user
CREATE OR REPLACE VIEW user_personal_records AS
SELECT 
    user_id,
    exercise_name,
    MAX(NULLIF(regexp_replace(weight::text, '[^0-9.]', '', 'g'), '')::numeric) as max_weight
FROM 
    workout_logs
WHERE 
    weight IS NOT NULL 
    AND weight != ''
GROUP BY 
    user_id, 
    exercise_name;

-- Grant access to authenticated users (so the Edge Function or Frontend can read it)
GRANT SELECT ON user_personal_records TO authenticated;
GRANT SELECT ON user_personal_records TO service_role;
