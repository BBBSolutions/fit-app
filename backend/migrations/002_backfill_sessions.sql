-- Backfill sessions from completed workout assignments
-- This ensures that workouts completed BEFORE the automated session logging was implemented still appear in stats.

INSERT INTO sessions (
    user_id,
    workout_id,
    started_at,
    completed_at,
    status,
    metrics
)
SELECT 
    client_id as user_id,
    workout_id,
    created_at as started_at, -- Approximation
    updated_at as completed_at, -- When status changed to 'completed'
    'completed' as status,
    jsonb_build_object(
        'durationMinutes', 30, -- Default fallback
        'caloriesBurned', 150, -- Conservative fallback
        'notes', 'Backfilled from assignment'
    ) as metrics
FROM 
    workout_assignments
WHERE 
    status = 'completed'
    AND NOT EXISTS (
        SELECT 1 FROM sessions 
        WHERE sessions.workout_id = workout_assignments.workout_id 
        AND sessions.user_id = workout_assignments.client_id
    );
