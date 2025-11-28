-- Setup Automated Job Processing for Flashcards App
-- This script sets up a cron job that triggers the worker every minute to process queued jobs
--
-- IMPORTANT: Before running this script, replace the following placeholders:
--   1. YOUR_PROJECT_REF - Your Supabase project reference (e.g., xzpyvvkqfnurbxqwcyrx)
--   2. YOUR_CRON_SECRET - Your CRON_SECRET value from .env.local
--
-- How to run:
--   1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT_REF/sql
--   2. Copy this file's contents
--   3. Replace YOUR_PROJECT_REF and YOUR_CRON_SECRET with your actual values
--   4. Click "Run" or press Cmd+Enter

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing cron job if it exists (safe to run even if job doesn't exist)
DO $$
BEGIN
  PERFORM cron.unschedule('process-flashcard-jobs');
EXCEPTION
  WHEN OTHERS THEN
    -- Job doesn't exist, that's fine
    NULL;
END $$;

-- Schedule job processing every minute
-- This will call the cron-tick function which processes jobs in batches
SELECT cron.schedule(
  'process-flashcard-jobs',        -- Job name
  '* * * * *',                      -- Every minute (cron expression)
  $$
  SELECT net.http_post(
    'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cron-tick',
    '{"iterations": 5, "delay": 1000}'::jsonb,
    headers:='{"x-cron-secret": "YOUR_CRON_SECRET", "Content-Type": "application/json"}'::jsonb
  );
  $$
);

-- Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'process-flashcard-jobs';

-- To check cron job history later, run:
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-flashcard-jobs') ORDER BY start_time DESC LIMIT 10;

-- To manually unschedule the job (if needed), run:
-- SELECT cron.unschedule('process-flashcard-jobs');
