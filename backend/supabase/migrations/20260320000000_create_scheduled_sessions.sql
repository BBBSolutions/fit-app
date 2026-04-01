-- Migration: Create scheduled_sessions table for trainer appointment scheduling

CREATE TABLE IF NOT EXISTS public.scheduled_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    client_id  UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 60,
    session_type TEXT NOT NULL DEFAULT 'Personal Training',
    goal TEXT,
    status TEXT NOT NULL DEFAULT 'upcoming',  -- upcoming | completed | cancelled
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS handle_scheduled_sessions_updated_at ON public.scheduled_sessions;
CREATE TRIGGER handle_scheduled_sessions_updated_at
    BEFORE UPDATE ON public.scheduled_sessions
    FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- RLS
ALTER TABLE public.scheduled_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers can manage their scheduled sessions" ON public.scheduled_sessions;
CREATE POLICY "Trainers can manage their scheduled sessions"
    ON public.scheduled_sessions
    FOR ALL
    USING (trainer_id = auth.uid())
    WITH CHECK (trainer_id = auth.uid());

DROP POLICY IF EXISTS "Clients can view their scheduled sessions" ON public.scheduled_sessions;
CREATE POLICY "Clients can view their scheduled sessions"
    ON public.scheduled_sessions
    FOR SELECT
    USING (client_id = auth.uid());
