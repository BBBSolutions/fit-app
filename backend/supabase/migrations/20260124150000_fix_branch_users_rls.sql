-- Fix infinite recursion in branch_users policy

-- 1. Drop the problematic policy
DROP POLICY IF EXISTS "Branch Admins can view branch users" ON public.branch_users;

-- 2. Create a specific helper function to check admin status
-- Security Definer ensures it runs with permissions of the creator (postgres), avoiding the RLS recursion loop
CREATE OR REPLACE FUNCTION public.check_is_branch_admin(lookup_branch_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Secure the search path
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.branch_users
    WHERE branch_id = lookup_branch_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'branch_admin')
  );
END;
$$;

-- 3. Re-create the policy using the function
CREATE POLICY "Branch Admins can view branch users" ON public.branch_users
    FOR SELECT USING (
        public.check_is_branch_admin(branch_id)
    );
