-- Create Exercises Table
CREATE TABLE public.exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    image_url TEXT,
    video_url TEXT,
    instructions TEXT[],
    muscles_targeted TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to authenticated users" 
ON public.exercises FOR SELECT 
TO authenticated 
USING (true);

-- Allow service role full access (default, but good to ensure)
CREATE POLICY "Allow full access to service role"
ON public.exercises FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow anon read access (for edge functions testing without auth if needed)
CREATE POLICY "Allow read access to anon users" 
ON public.exercises FOR SELECT 
TO anon 
USING (true);
