-- Comprehensive Storage Owner Issue Diagnostic & Fix Script
-- Run this in Supabase SQL Editor to diagnose and fix the storage owner type error

-- ====================
-- 1. CHECK BUCKET CONFIGURATION
-- ====================
SELECT
  'BUCKET CONFIG' as check_type,
  id,
  name,
  owner_id,
  owner as bucket_owner,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id IN ('ingest', 'media', 'derived');

-- ====================
-- 2. CHECK STORAGE.OBJECTS TABLE STRUCTURE
-- ====================
SELECT
  'STORAGE.OBJECTS COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'storage'
  AND table_name = 'objects'
  AND column_name IN ('owner', 'owner_id', 'bucket_id')
ORDER BY ordinal_position;

-- ====================
-- 3. FIX: REMOVE OWNER_ID FROM BUCKETS
-- ====================
UPDATE storage.buckets
SET owner_id = NULL
WHERE id IN ('ingest', 'media', 'derived')
  AND owner_id IS NOT NULL;

-- ====================
-- 4. FIX: ENSURE BUCKET OWNER IS NULL
-- ====================
UPDATE storage.buckets
SET owner = NULL
WHERE id IN ('ingest', 'media', 'derived')
  AND owner IS NOT NULL;

-- ====================
-- 5. VERIFY BUCKET UPDATES
-- ====================
SELECT
  'BUCKET CONFIG AFTER FIX' as check_type,
  id,
  name,
  owner_id,
  owner as bucket_owner,
  public
FROM storage.buckets
WHERE id IN ('ingest', 'media', 'derived');

-- ====================
-- 6. CHECK RLS POLICIES ON STORAGE.OBJECTS
-- ====================
SELECT
  'STORAGE POLICIES' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles::text,
  cmd::text,
  SUBSTRING(qual::text, 1, 100) as condition_short,
  SUBSTRING(with_check::text, 1, 100) as with_check_short
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;

-- ====================
-- 7. CHECK FOR TRIGGERS ON STORAGE.OBJECTS
-- ====================
SELECT
  'STORAGE TRIGGERS' as check_type,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'storage'
  AND event_object_table = 'objects';

-- ====================
-- 8. TEST: Check if we can determine the current user's UUID type
-- ====================
SELECT
  'CURRENT USER CHECK' as check_type,
  auth.uid() as user_uuid,
  pg_typeof(auth.uid()) as uuid_type,
  auth.uid()::text as user_text,
  pg_typeof(auth.uid()::text) as text_type;

-- ====================
-- EXPECTED RESULTS:
-- ====================
-- 1. Buckets should have owner_id = NULL and owner = NULL
-- 2. storage.objects.owner should be type 'uuid'
-- 3. Policies should use auth.uid() which returns UUID
-- 4. No triggers should be forcing owner to text
