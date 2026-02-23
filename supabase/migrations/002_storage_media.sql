-- ============================================
-- Storage bucket "media" and policies
-- Run this in Supabase SQL Editor if the bucket doesn't exist yet.
-- ============================================

-- Create the media bucket (public so frontend can display images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies so this migration can be re-run
DROP POLICY IF EXISTS "Public read media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete media" ON storage.objects;

-- Allow anyone to read (view) files in media bucket
CREATE POLICY "Public read media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated update media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated delete media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media');
