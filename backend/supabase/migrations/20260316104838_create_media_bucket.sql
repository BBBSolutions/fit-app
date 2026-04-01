-- Create media bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-media-public', 'user-media-public', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to read
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'user-media-public' );

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'user-media-public' );

-- Allow service role full access
CREATE POLICY "Service Role Full Access"
ON storage.objects FOR ALL
TO service_role
USING ( bucket_id = 'user-media-public' );