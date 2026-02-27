-- Function to check if a gym code exists
-- This allows unauthenticated users (during login) to verify the code without bypassing RLS
CREATE OR REPLACE FUNCTION public.is_valid_gym_code(p_gym_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.branches WHERE gym_code = p_gym_code
    );
$$;
