-- Grant proper permissions to the scheduled_sessions table

GRANT ALL ON public.scheduled_sessions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_sessions TO authenticated;
GRANT SELECT ON public.scheduled_sessions TO anon;
