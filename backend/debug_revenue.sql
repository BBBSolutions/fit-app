-- DEBUG: Check for payments associated with Gym Profiles
-- Run this in Supabase SQL Editor to see if any payments exist for your users.

SELECT 
    p.user_id,
    prof.full_name,
    prof.gym_code,
    p.amount,
    p.status,
    p.created_at
FROM payments p
JOIN profiles prof ON p.user_id = prof.user_id
ORDER BY p.created_at DESC;
