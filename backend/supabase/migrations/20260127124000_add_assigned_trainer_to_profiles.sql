-- Add assigned_trainer_id to profiles (Active members)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS assigned_trainer_id UUID REFERENCES profiles(user_id);

-- Add assigned_trainer_id to invitations (Pending members)
ALTER TABLE invitations 
ADD COLUMN IF NOT EXISTS assigned_trainer_id UUID REFERENCES profiles(user_id);
-- Note: Referencing profiles(user_id) assumes the trainer has a profile.
