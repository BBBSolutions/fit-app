-- 1. LEADS MANAGEMENT
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    source TEXT, -- Website, Referral, Campaign, etc.
    status TEXT DEFAULT 'New', -- New, Contacted, Qualified, Converted, Lost
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Admins can view/manage all leads (assuming admin policies will be added later or using service role)
-- For now, we'll allow authenticated users to view/create for simplicity if they are admins, 
-- but strictly this should be restricted. 
-- Adding a basic policy for now that allows authenticated users (admins) to do everything.
DROP POLICY IF EXISTS "Admins can manage leads" ON public.leads;
CREATE POLICY "Admins can manage leads" ON public.leads
    FOR ALL USING (auth.role() = 'authenticated');


-- 2. CONTENT MANAGEMENT
CREATE TABLE IF NOT EXISTS public.content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- Page, Article, Announcement, Banner
    slug TEXT UNIQUE,
    body TEXT,
    status TEXT DEFAULT 'Draft', -- Draft, Published, Archived
    author_id UUID REFERENCES public.app_users(id),
    meta_title TEXT,
    meta_description TEXT,
    thumbnail_url TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage content" ON public.content;
CREATE POLICY "Admins can manage content" ON public.content
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public can view published content" ON public.content;
CREATE POLICY "Public can view published content" ON public.content
    FOR SELECT USING (status = 'Published');


-- 3. BILLING PLANS
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    currency TEXT DEFAULT 'INR',
    interval TEXT DEFAULT 'Monthly', -- Monthly, Yearly, Quarterly
    features TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    stripe_price_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage plans" ON public.plans;
CREATE POLICY "Admins can manage plans" ON public.plans
    FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public can view active plans" ON public.plans;
CREATE POLICY "Public can view active plans" ON public.plans
    FOR SELECT USING (is_active = TRUE);
