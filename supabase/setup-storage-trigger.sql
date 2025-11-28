-- Setup Storage Upload Trigger for Flashcards App
-- This script creates a database trigger that automatically creates jobs when files are uploaded
--
-- How to run:
--   1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT_REF/sql
--   2. Copy this file's contents
--   3. Click "Run" or press Cmd+Enter
--
-- This is an alternative to the storage webhook configuration if webhooks are not available
-- in the Supabase Dashboard UI.
--
-- Note: This trigger directly creates jobs in the database, which is more reliable than
-- making HTTP calls from within a trigger.

-- Create a function to create a processing job when a file is uploaded
CREATE OR REPLACE FUNCTION public.create_job_on_file_upload()
RETURNS TRIGGER AS $$
DECLARE
  file_path TEXT;
  mime_type TEXT;
  file_size BIGINT;
  user_id UUID;
  job_type TEXT;
BEGIN
  -- Only trigger for INSERT operations in the 'ingest' bucket
  IF TG_OP = 'INSERT' AND NEW.bucket_id = 'ingest' THEN

    -- Extract file information
    file_path := NEW.name;
    mime_type := COALESCE(NEW.metadata->>'mimetype', 'application/octet-stream');
    file_size := COALESCE((NEW.metadata->>'size')::BIGINT, 0);

    -- Extract user_id from the file path (format: {user_id}/filename)
    -- The path is structured as user_id/filename, so we extract the first folder
    user_id := (storage.foldername(NEW.name))[1]::UUID;

    -- Determine job type based on mime type
    IF mime_type LIKE 'image/%' THEN
      job_type := 'ingest_image';
    ELSIF mime_type LIKE 'video/%' THEN
      job_type := 'ingest_video';
    ELSIF mime_type = 'application/pdf' THEN
      job_type := 'ingest_pdf';
    ELSE
      -- Default to image ingest for unknown types
      job_type := 'ingest_image';
    END IF;

    -- Create an ingest file record first
    INSERT INTO public.ingest_files (
      owner,
      source,
      storage_path,
      mime_type,
      meta
    ) VALUES (
      user_id::TEXT,
      'upload',
      file_path,
      mime_type,
      jsonb_build_object(
        'size', file_size,
        'uploaded_at', NOW()
      )
    );

    -- Create a job in the jobs table
    INSERT INTO public.jobs (
      type,
      status,
      input,
      created_by
    ) VALUES (
      job_type,
      'queued',
      jsonb_build_object(
        'storage_path', file_path,
        'mime_type', mime_type,
        'file_size', file_size,
        'owner', user_id::TEXT,
        'bucket', NEW.bucket_id
      ),
      user_id::TEXT
    );

    -- Log for debugging
    RAISE NOTICE 'Created % job for file: %', job_type, file_path;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS on_storage_object_created ON storage.objects;

-- Create the trigger
CREATE TRIGGER on_storage_object_created
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION public.create_job_on_file_upload();

-- Verify the trigger was created
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_storage_object_created';

-- To disable the trigger later (if needed), run:
-- DROP TRIGGER IF EXISTS on_storage_object_created ON storage.objects;

-- To manually test the trigger, upload a file to the 'ingest' bucket
-- and check if a job was created in the jobs table
