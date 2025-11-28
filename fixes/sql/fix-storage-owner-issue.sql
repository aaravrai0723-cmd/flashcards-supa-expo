-- Fix for storage owner type error
-- Run this in the Supabase SQL Editor

-- Check current bucket configuration
SELECT id, name, owner_id, public
FROM storage.buckets
WHERE id IN ('ingest', 'media', 'derived');

-- Update buckets to remove owner_id if it's set incorrectly
-- This allows Supabase to handle owner automatically
UPDATE storage.buckets
SET owner_id = NULL
WHERE id IN ('ingest', 'media', 'derived')
  AND owner_id IS NOT NULL;

-- Verify the update
SELECT id, name, owner_id, public
FROM storage.buckets
WHERE id IN ('ingest', 'media', 'derived');

-- Check if there are any custom policies that might be interfering
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;
