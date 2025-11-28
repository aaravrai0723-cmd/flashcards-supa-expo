-- Manage Automated Job Processing Cron Job
-- This file contains useful SQL queries for managing the cron job
--
-- Copy and paste individual queries into Supabase SQL Editor as needed

-- ============================================================
-- VIEW CRON JOB STATUS
-- ============================================================

-- Check if cron job exists and is active
SELECT
  jobid,
  jobname,
  schedule,
  active,
  database,
  nodename
FROM cron.job
WHERE jobname = 'process-flashcard-jobs';


-- ============================================================
-- VIEW RECENT CRON EXECUTIONS
-- ============================================================

-- See last 20 cron job runs
SELECT
  runid,
  jobid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'process-flashcard-jobs'
)
ORDER BY start_time DESC
LIMIT 20;


-- ============================================================
-- VIEW CRON JOB STATISTICS
-- ============================================================

-- Count successful vs failed runs
SELECT
  status,
  COUNT(*) as count,
  MIN(start_time) as first_run,
  MAX(start_time) as last_run
FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'process-flashcard-jobs'
)
GROUP BY status;


-- ============================================================
-- VIEW RECENT FAILED RUNS
-- ============================================================

-- See only failed runs with error messages
SELECT
  runid,
  start_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'process-flashcard-jobs'
)
AND status = 'failed'
ORDER BY start_time DESC
LIMIT 10;


-- ============================================================
-- PAUSE CRON JOB (WITHOUT DELETING)
-- ============================================================

-- Temporarily disable the cron job
-- To re-enable, change false to true
UPDATE cron.job
SET active = false
WHERE jobname = 'process-flashcard-jobs';


-- ============================================================
-- RESUME CRON JOB
-- ============================================================

-- Re-enable the cron job after pausing
UPDATE cron.job
SET active = true
WHERE jobname = 'process-flashcard-jobs';


-- ============================================================
-- DELETE CRON JOB
-- ============================================================

-- Permanently remove the cron job
-- Run setup-automated-processing.sql again to recreate it
SELECT cron.unschedule('process-flashcard-jobs');


-- ============================================================
-- VERIFY JOB PROCESSING IS WORKING
-- ============================================================

-- Check recent job processing activity
SELECT
  COUNT(*) FILTER (WHERE status = 'queued') as queued,
  COUNT(*) FILTER (WHERE status = 'processing') as processing,
  COUNT(*) FILTER (WHERE status = 'done') as done,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  MAX(updated_at) as last_update
FROM jobs
WHERE created_at > NOW() - INTERVAL '1 hour';


-- ============================================================
-- VIEW PROCESSING RATE
-- ============================================================

-- See how many jobs are being processed per minute
SELECT
  DATE_TRUNC('minute', updated_at) as minute,
  COUNT(*) as jobs_processed
FROM jobs
WHERE status IN ('done', 'failed')
  AND updated_at > NOW() - INTERVAL '1 hour'
GROUP BY DATE_TRUNC('minute', updated_at)
ORDER BY minute DESC
LIMIT 20;


-- ============================================================
-- CLEANUP OLD CRON LOGS (OPTIONAL)
-- ============================================================

-- Delete cron run history older than 7 days
-- (Keeps database clean and improves query performance)
DELETE FROM cron.job_run_details
WHERE start_time < NOW() - INTERVAL '7 days';
