-- Fix storage bucket owner configuration to prevent UUID upload errors
-- This migration clears any lingering owner/owner_id assignments on the
-- ingest, media, and derived buckets so Supabase Storage uses the
-- authenticated user's UUID for future uploads.

UPDATE storage.buckets
SET owner = NULL,
    owner_id = NULL
WHERE id IN ('ingest', 'media', 'derived')
  AND (owner IS NOT NULL OR owner_id IS NOT NULL);
