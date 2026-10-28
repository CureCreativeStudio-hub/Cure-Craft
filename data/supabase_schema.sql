-- ==============================================================================
-- CURE CRAFT — PERMANENT BRANDING STORAGE & DATABASE SCHEMA FOR SUPABASE
-- Run this script in your Supabase Project: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Create the persistent branding state table
CREATE TABLE IF NOT EXISTS curecraft_branding (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  published JSONB NOT NULL,
  draft JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS) on the branding table
ALTER TABLE curecraft_branding ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow public read access to all website visitors
CREATE POLICY "Public read access for branding"
  ON curecraft_branding
  FOR SELECT
  TO public
  USING (true);

-- 4. Policy: Allow service role full write/insert/update access
CREATE POLICY "Service role full access on branding table"
  ON curecraft_branding
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Storage Bucket Configuration for 'branding-assets'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'branding-assets',
  'branding-assets',
  true,
  15728640,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 6. Storage Policies: Allow public read of uploaded branding assets
CREATE POLICY "Public read access to branding assets"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'branding-assets');

-- 7. Storage Policies: Allow service role write/upload access
CREATE POLICY "Service role write access to branding assets"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'branding-assets')
  WITH CHECK (bucket_id = 'branding-assets');
