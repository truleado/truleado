-- Create logos storage bucket
-- This migration creates a storage bucket for user logos

-- Create the logos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
);

-- Create RLS policies for the logos bucket
-- Users can upload their own logos
CREATE POLICY "Users can upload their own logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own logos
CREATE POLICY "Users can view their own logos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own logos
CREATE POLICY "Users can update their own logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own logos
CREATE POLICY "Users can delete their own logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Public access to view logos (for displaying in the app)
CREATE POLICY "Public can view logos" ON storage.objects
FOR SELECT USING (bucket_id = 'logos');
