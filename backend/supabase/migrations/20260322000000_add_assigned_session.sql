-- Migration: Add assigned_session to profiles for schedule categorization

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS assigned_session TEXT;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS assigned_session TEXT;
