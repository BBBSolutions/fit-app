-- Drop the strict Foreign Key constraint to allow assigning Pending Trainers (Invitations)
-- We want to store either a Profile ID OR an Invitation ID in this column.

ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_assigned_trainer_id_fkey;

ALTER TABLE invitations 
DROP CONSTRAINT IF EXISTS invitations_assigned_trainer_id_fkey;
