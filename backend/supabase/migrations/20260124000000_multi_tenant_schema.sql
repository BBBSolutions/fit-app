-- 1. OWNERS TABLE
-- Stores the top-level business owner.
CREATE TABLE IF NOT EXISTS public.owners (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    business_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their own record" ON public.owners
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Owners can update their own record" ON public.owners
    FOR UPDATE USING (auth.uid() = id);

-- 2. BRANCHES TABLE
-- Stores individual gym locations.
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES public.owners(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    city TEXT,
    state TEXT,
    country TEXT,
    address TEXT,
    gym_code TEXT UNIQUE NOT NULL, -- The 5-char code (e.g., FIT-DEL-7F3A)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view/manage their branches" ON public.branches
    FOR ALL USING (auth.uid() = owner_id);

-- 3. BRANCH USERS TABLE (Multi-tenancy mapping)
-- Links a user (staff, member, trainer) to a specific branch.
CREATE TYPE public.branch_role_enum AS ENUM ('owner', 'branch_admin', 'reception', 'trainer', 'member');
CREATE TYPE public.branch_user_status_enum AS ENUM ('active', 'pending', 'suspended');

CREATE TABLE IF NOT EXISTS public.branch_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.branch_role_enum NOT NULL DEFAULT 'member',
    status public.branch_user_status_enum DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(branch_id, user_id) -- A user appears once per branch (though can be in multiple branches)
);

ALTER TABLE public.branch_users ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can view everyone in their branches
CREATE POLICY "Owners can view branch users" ON public.branch_users
    FOR SELECT USING (
        branch_id IN (SELECT id FROM public.branches WHERE owner_id = auth.uid())
    );

-- Policy: Branch Admins can view everyone in their branch
CREATE POLICY "Branch Admins can view branch users" ON public.branch_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.branch_users bu 
            WHERE bu.branch_id = public.branch_users.branch_id 
            AND bu.user_id = auth.uid() 
            AND bu.role IN ('owner', 'branch_admin')
        )
    );

-- Policy: Users can view their own branch association
CREATE POLICY "Users can view self" ON public.branch_users
    FOR SELECT USING (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER handle_owners_updated_at BEFORE UPDATE ON public.owners FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_branch_users_updated_at BEFORE UPDATE ON public.branch_users FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
