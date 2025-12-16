-- Storage Buckets

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('user-media-private', 'user-media-private', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('user-media-public', 'user-media-public', true) ON CONFLICT DO NOTHING;

-- 2. Security Policies

-- Private Bucket Policies
CREATE POLICY "Users can upload their own private media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-media-private' AND 
  (auth.uid()::text = (storage.foldername(name))[1]) 
);

CREATE POLICY "Users can view their own private media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-media-private' AND 
  (auth.uid()::text = (storage.foldername(name))[1])
);

-- Public Bucket Policies
CREATE POLICY "Users can upload their own public media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-media-public' AND 
  (auth.uid()::text = (storage.foldername(name))[1])
);

CREATE POLICY "Anyone can view public media"
ON storage.objects FOR SELECT
USING ( bucket_id = 'user-media-public' );
