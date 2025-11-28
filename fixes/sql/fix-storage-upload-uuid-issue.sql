-- Fix Storage Upload UUID Type Error
-- This fixes the "column owner is of type uuid but expression is of type text" error
--
-- Root Cause: Supabase storage buckets created with owner/owner_id fields can cause
-- the storage API to send owner as TEXT instead of UUID, causing upload failures.
--
-- Solution: Ensure buckets don't have owner/owner_id set, and verify column types
--
-- How to run:
--   1. Go to https://supabase.com/dashboard -> Select your project -> SQL Editor
--   2. Copy this entire file
--   3. Click "Run" or press Cmd+Enter

-- ====================
-- Step 1: Check Current Configuration
-- ====================
DO $$
BEGIN
  RAISE NOTICE '=== Current Bucket Configuration ===';
END $$;

SELECT
  id,
  name,
  owner_id,
  owner,
  public
FROM storage.buckets
WHERE id IN ('ingest', 'media', 'derived');

-- ====================
-- Step 2: Fix Bucket Configuration
-- ====================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Fixing Bucket Configuration ===';
  RAISE NOTICE 'Setting owner and owner_id to NULL for all buckets...';
END $$;

-- Remove owner and owner_id from buckets
-- This prevents the storage API from trying to set these fields during upload
UPDATE storage.buckets
SET
  owner = NULL,
  owner_id = NULL
WHERE id IN ('ingest', 'media', 'derived');

-- ====================
-- Step 3: Verify Fix
-- ====================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Verification ===';
  RAISE NOTICE 'Checking bucket configuration after fix...';
END $$;

SELECT
  id,
  name,
  owner_id as should_be_null_1,
  owner as should_be_null_2,
  public
FROM storage.buckets
WHERE id IN ('ingest', 'media', 'derived');

-- ====================
-- Step 4: Verify Column Types
-- ====================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Storage Objects Column Types ===';
END $$;

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'storage'
  AND table_name = 'objects'
  AND column_name IN ('owner', 'owner_id')
ORDER BY column_name;

-- ====================
-- Success Message
-- ====================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Fix applied successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Verify owner and owner_id are NULL in bucket configuration above';
  RAISE NOTICE '2. Restart your mobile app development server';
  RAISE NOTICE '3. Try uploading a file again';
  RAISE NOTICE '';
  RAISE NOTICE 'If the issue persists, check:';
  RAISE NOTICE '- Your @supabase/supabase-js version is 2.86.0 or higher';
  RAISE NOTICE '- You have cleared the app cache (expo start -c)';
  RAISE NOTICE '- The file path format is: {user_id}/filename.jpg';
END $$;
