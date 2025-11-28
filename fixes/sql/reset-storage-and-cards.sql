-- Reset storage buckets and flashcard data for a clean slate.
-- Run this in the Supabase SQL Editor or via psql against your project.

BEGIN;

-- 1. Remove every object in the ingest/media/derived buckets so they can be recreated.
DELETE FROM storage.objects
WHERE bucket_id IN ('ingest', 'media', 'derived');

-- 2. Clear ingest metadata + jobs so no orphaned records remain.
DELETE FROM ingest_files;
DELETE FROM jobs;

-- 3. Remove all cards; cascading FKs take care of related tables
-- (card_media, card_topics, card_tags, etc.).
DELETE FROM cards;

COMMIT;

-- After running this script, execute fixes/sql/recreate-storage-buckets.sql
-- to recreate the buckets with null owner metadata so uploads work again.
