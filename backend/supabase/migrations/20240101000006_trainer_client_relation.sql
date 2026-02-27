-- Migration to create trainer_clients table for managing relationships
-- Links a Trainer (profile.user_id) to a Client (profile.user_id)

DO $$ BEGIN
    CREATE TYPE public.client_status_enum AS ENUM ('active', 'pending', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.trainer_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
    status public.client_status_enum DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(trainer_id, client_id)
);

DROP TRIGGER IF EXISTS handle_updated_at ON public.trainer_clients;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.trainer_clients
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- RLS Policies
ALTER TABLE public.trainer_clients ENABLE ROW LEVEL SECURITY;

-- Trainers can view their own clients
DROP POLICY IF EXISTS "Trainers can view their clients" ON public.trainer_clients;
CREATE POLICY "Trainers can view their clients" ON public.trainer_clients
    FOR SELECT USING (trainer_id = auth.uid());

-- Trainers can insert new clients (invite)
DROP POLICY IF EXISTS "Trainers can add clients" ON public.trainer_clients;
CREATE POLICY "Trainers can add clients" ON public.trainer_clients
    FOR INSERT WITH CHECK (trainer_id = auth.uid());

-- Trainers can update their client status
DROP POLICY IF EXISTS "Trainers can update their clients" ON public.trainer_clients;
CREATE POLICY "Trainers can update their clients" ON public.trainer_clients
    FOR UPDATE USING (trainer_id = auth.uid());

-- Clients can view who their trainer is
DROP POLICY IF EXISTS "Clients can view their trainer" ON public.trainer_clients;
CREATE POLICY "Clients can view their trainer" ON public.trainer_clients
    FOR SELECT USING (client_id = auth.uid());
