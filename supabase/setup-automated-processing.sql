-- Setup Automated Job Processing for Flashcards App
-- This script configures pg_cron to automatically process queued jobs every minute
--
-- IMPORTANT: Before running this script, replace the following placeholders:
--   1. YOUR_PROJECT_REF - Your Supabase project reference (e.g., xzpyvvkqfnurbxqwcyrx)
--   2. YOUR_CRON_SECRET - Your CRON_SECRET value from .env.local
--
-- How to run:
--   1. Open this file and replace YOUR_PROJECT_REF and YOUR_CRON_SECRET with your actual values
--   2. Go to https://supabase.com/dashboard/project/YOUR_PROJECT_REF/sql
--   3. Copy the edited contents
--   4. Paste into SQL Editor
--   5. Click "Run" or press Cmd+Enter
--
-- What this does:
--   - Enables pg_cron and http extensions (if not already enabled)
--   - Creates a cron job that runs every minute
--   - Calls the cron-tick function to process 5 jobs per minute
--   - Uses exponential backoff (1 second delay between jobs)
--
-- Benefits:
--   - Automatic processing of uploaded images, videos, and PDFs
--   - No manual intervention needed
--   - Scalable and reliable
--   - Can be monitored and managed through pg_cron.job table

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Drop existing job if it exists (allows re-running this script)
SELECT cron.unschedule('process-flashcard-jobs') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'process-flashcard-jobs'
);

-- Create the automated processing job
-- Runs every minute: '* * * * *'
-- Processes 5 jobs per execution with 1 second delay between each
SELECT cron.schedule(
  'process-flashcard-jobs',                     -- Job name
  '* * * * *',                                   -- Schedule: every minute
  $$
  SELECT extensions.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cron-tick',
    body := '{"iterations": 5, "delay": 1000}',
    headers := '{"Authorization": "Bearer YOUR_CRON_SECRET", "Content-Type": "application/json"}'::jsonb
  );
  $$
);

-- Verify the cron job was created
SELECT
  jobid,
  jobname,
  schedule,
  active,
  nodename
FROM cron.job
WHERE jobname = 'process-flashcard-jobs';

-- Display success message
DO $$
BEGIN
  RAISE NOTICE '✅ Automated job processing has been set up successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Job Details:';
  RAISE NOTICE '  - Name: process-flashcard-jobs';
  RAISE NOTICE '  - Schedule: Every minute';
  RAISE NOTICE '  - Processing: 5 jobs per minute';
  RAISE NOTICE '  - Delay: 1 second between jobs';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Monitor with:';
  RAISE NOTICE '  SELECT * FROM cron.job;';
  RAISE NOTICE '  SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;';
END $$;
