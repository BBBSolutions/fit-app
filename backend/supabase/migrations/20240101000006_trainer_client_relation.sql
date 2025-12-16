-- Migration to create trainer_clients table for managing relationships
-- Links a Trainer (profile.user_id) to a Client (profile.user_id)

CREATE TYPE public.client_status_enum AS ENUM ('active', 'pending', 'archived');

CREATE TABLE IF NOT EXISTS public.trainer_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
    status public.client_status_enum DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(trainer_id, client_id)
);

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.trainer_clients
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- RLS Policies
ALTER TABLE public.trainer_clients ENABLE ROW LEVEL SECURITY;

-- Trainers can view their own clients
CREATE POLICY "Trainers can view their clients" ON public.trainer_clients
    FOR SELECT USING (trainer_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));

-- Trainers can insert new clients (invite)
CREATE POLICY "Trainers can add clients" ON public.trainer_clients
    FOR INSERT WITH CHECK (trainer_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));

-- Trainers can update their client status
CREATE POLICY "Trainers can update their clients" ON public.trainer_clients
    FOR UPDATE USING (trainer_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));

-- Clients can view who their trainer is
CREATE POLICY "Clients can view their trainer" ON public.trainer_clients
    FOR SELECT USING (client_id IN (SELECT id FROM public.app_users WHERE firebase_uid = auth.uid()::text));
