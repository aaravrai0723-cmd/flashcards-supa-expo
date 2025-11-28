-- Recreate Storage Buckets (NUCLEAR OPTION - USE WITH CAUTION)
-- ⚠️ WARNING: This will delete and recreate buckets
-- ⚠️ ALL EXISTING FILES WILL BE LOST
-- ⚠️ Only use this if the diagnostic script didn't work

-- ====================
-- BACKUP: Check what files exist
-- ====================
SELECT
  'EXISTING FILES' as info,
  bucket_id,
  COUNT(*) as file_count
FROM storage.objects
WHERE bucket_id IN ('ingest', 'media', 'derived')
GROUP BY bucket_id;

-- ====================
-- UNCOMMENT BELOW TO ACTUALLY DELETE AND RECREATE
-- ====================

/*
-- Delete existing buckets (this deletes all files!)
DELETE FROM storage.buckets WHERE id = 'ingest';
DELETE FROM storage.buckets WHERE id = 'media';
DELETE FROM storage.buckets WHERE id = 'derived';

-- Recreate buckets with correct configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, owner_id, owner)
VALUES
    (
        'ingest',
        'ingest',
        false,
        104857600, -- 100MB
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'application/pdf', 'text/plain', 'application/json'],
        NULL,  -- Important: NULL owner_id
        NULL   -- Important: NULL owner
    ),
    (
        'media',
        'media',
        false,
        52428800, -- 50MB
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'application/pdf'],
        NULL,  -- Important: NULL owner_id
        NULL   -- Important: NULL owner
    ),
    (
        'derived',
        'derived',
        false,
        104857600, -- 100MB
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'application/pdf'],
        NULL,  -- Important: NULL owner_id
        NULL   -- Important: NULL owner
    );

-- Verify buckets were created correctly
SELECT
  'RECREATED BUCKETS' as info,
  id,
  name,
  owner_id,
  owner,
  public,
  file_size_limit
FROM storage.buckets
WHERE id IN ('ingest', 'media', 'derived');
*/

-- ====================
-- TO USE THIS SCRIPT:
-- ====================
-- 1. Review the file count above
-- 2. Make sure you have backups if needed
-- 3. Uncomment the section between /* and */
-- 4. Run the script
