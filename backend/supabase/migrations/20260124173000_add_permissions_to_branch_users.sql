-- Add permissions column to branch_users
ALTER TABLE public.branch_users 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.branch_users.permissions IS 'Array of permissions granted to the user for this branch.';

-- Add permissions column to invitations
ALTER TABLE public.invitations
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.invitations.permissions IS 'Array of permissions to be granted when the user accepts the invitation.';
