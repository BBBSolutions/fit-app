-- Create exercises table
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    video_url TEXT,
    instructions JSONB DEFAULT '[]',
    muscles_targeted TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow authenticated read access" ON exercises FOR SELECT TO authenticated USING (true);

-- Allow service role full access (for seeding)
-- (Service role bypasses RLS by default, but good to be explicit if needed, usually not for RLS policies)
