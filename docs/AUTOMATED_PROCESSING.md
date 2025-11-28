# Automated Job Processing Setup Guide

This guide explains how to set up and manage automated processing of uploaded media files (images, videos, PDFs).

## Overview

**What it does**: Automatically processes queued jobs every minute without manual intervention.

**How it works**:
1. User uploads a file to the 'ingest' bucket
2. Storage trigger creates a job in the queue (status: "queued")
3. pg_cron runs every minute and calls the cron-tick function
4. cron-tick function processes up to 5 jobs
5. Jobs are processed: AI analysis, thumbnail generation, card creation
6. Job status changes to "done" or "failed"

**Benefits**:
- ✅ No manual intervention needed
- ✅ Reliable and consistent processing
- ✅ Scalable (can adjust frequency and batch size)
- ✅ Built into Supabase (no external services)
- ✅ Easy to monitor and manage

---

## Setup Instructions

### Step 1: Run the Setup SQL

1. **Open Supabase SQL Editor**:
   - Go to https://supabase.com/dashboard/project/xzpyvvkqfnurbxqwcyrx/sql
   - Click **New query** or use an existing one

2. **Copy and Run SQL**:
   - Open `supabase/setup-automated-processing.sql` in your code editor
   - Copy the entire contents
   - Paste into SQL Editor
   - Click **Run** (or press Cmd+Enter / Ctrl+Enter)

3. **Verify Success**:
   You should see:
   - ✅ Extensions enabled (pg_cron, http)
   - ✅ Cron job created
   - ✅ Success message with job details

### Step 2: Verify the Cron Job

Run this query to confirm the job is active:

```sql
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname = 'process-flashcard-jobs';
```

**Expected result**:
- `jobname`: "process-flashcard-jobs"
- `schedule`: "* * * * *" (every minute)
- `active`: true

### Step 3: Test It Works

1. **Upload a test image** through your mobile app

2. **Check job was created**:
   ```sql
   SELECT * FROM jobs ORDER BY created_at DESC LIMIT 1;
   ```
   Should show status "queued"

3. **Wait 1 minute** for the cron job to run

4. **Check job was processed**:
   ```sql
   SELECT * FROM jobs ORDER BY updated_at DESC LIMIT 1;
   ```
   Should show status "done" or "failed"

5. **Check cron execution**:
   ```sql
   SELECT * FROM cron.job_run_details
   ORDER BY start_time DESC LIMIT 5;
   ```
   Should show recent executions with status "succeeded"

---

## Configuration

### Current Settings

- **Frequency**: Every minute (`* * * * *`)
- **Batch size**: 5 jobs per execution
- **Delay**: 1 second between jobs
- **Total capacity**: ~300 jobs per hour

### Adjusting Processing Rate

To process more jobs per minute, edit the SQL and change:

```sql
body := '{"iterations": 10, "delay": 500}'
-- iterations: number of jobs per minute
-- delay: milliseconds between jobs
```

Then re-run `setup-automated-processing.sql`

### Changing Schedule

To run more/less frequently, change the cron expression:

```sql
'*/2 * * * *'   -- Every 2 minutes
'*/5 * * * *'   -- Every 5 minutes
'0 * * * *'     -- Every hour
'*/30 * * * *'  -- Every 30 minutes
```

---

## Monitoring

### View Cron Job Status

```sql
-- See if cron job is active
SELECT * FROM cron.job WHERE jobname = 'process-flashcard-jobs';
```

### View Recent Executions

```sql
-- Last 10 cron runs
SELECT
  runid,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-flashcard-jobs')
ORDER BY start_time DESC
LIMIT 10;
```

### View Processing Statistics

```sql
-- Jobs processed in last hour
SELECT
  COUNT(*) FILTER (WHERE status = 'done') as completed,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'queued') as still_queued
FROM jobs
WHERE updated_at > NOW() - INTERVAL '1 hour';
```

### View Processing Rate

```sql
-- Jobs per minute
SELECT
  DATE_TRUNC('minute', updated_at) as minute,
  COUNT(*) as processed
FROM jobs
WHERE status IN ('done', 'failed')
  AND updated_at > NOW() - INTERVAL '1 hour'
GROUP BY minute
ORDER BY minute DESC;
```

---

## Management

### Pause Processing

To temporarily stop processing (without deleting the job):

```sql
UPDATE cron.job
SET active = false
WHERE jobname = 'process-flashcard-jobs';
```

### Resume Processing

```sql
UPDATE cron.job
SET active = true
WHERE jobname = 'process-flashcard-jobs';
```

### Delete Cron Job

To permanently remove:

```sql
SELECT cron.unschedule('process-flashcard-jobs');
```

To recreate, run `setup-automated-processing.sql` again.

---

## Troubleshooting

### Cron job not running

**Check if job exists**:
```sql
SELECT * FROM cron.job WHERE jobname = 'process-flashcard-jobs';
```

**Check if job is active**:
```sql
SELECT active FROM cron.job WHERE jobname = 'process-flashcard-jobs';
-- Should be: true
```

**Check recent executions**:
```sql
SELECT status, return_message, start_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-flashcard-jobs')
ORDER BY start_time DESC LIMIT 5;
```

### Cron job failing

**View error messages**:
```sql
SELECT return_message, start_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-flashcard-jobs')
  AND status = 'failed'
ORDER BY start_time DESC LIMIT 5;
```

**Common issues**:
- **"Function not found"**: Check function is deployed: `npx supabase functions list`
- **"Invalid authorization"**: Check CRON_SECRET in SQL matches `.env.local`
- **"Timeout"**: Reduce batch size (iterations) or increase delay

### Jobs still stuck in "queued"

**Manually trigger processing**:
```bash
./scripts/trigger-worker.sh
```

**Check cron is calling worker**:
```sql
-- View cron execution details
SELECT return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-flashcard-jobs')
ORDER BY start_time DESC LIMIT 1;
```

**Check worker function logs**:
- Go to Dashboard > Edge Functions > worker-pull > Logs

---

## Advanced Usage

### Multiple Environments

If you have staging/production environments:

1. Use different cron job names:
   ```sql
   SELECT cron.schedule('process-flashcard-jobs-staging', ...);
   SELECT cron.schedule('process-flashcard-jobs-production', ...);
   ```

2. Use different CRON_SECRET values per environment

3. Monitor each independently

### Scaling Up

For high-volume processing:

1. **Increase frequency**:
   ```sql
   schedule := '*/30 * * * * *'  -- Every 30 seconds (requires pg_cron 1.4+)
   ```

2. **Increase batch size**:
   ```sql
   body := '{"iterations": 20, "delay": 200}'
   ```

3. **Add multiple workers** (advanced):
   - Deploy multiple cron-tick variants
   - Each processes different job types
   - Requires code changes

### Monitoring & Alerting

Set up alerts for processing issues:

```sql
-- Create a cron job to check for stuck jobs
SELECT cron.schedule(
  'alert-stuck-jobs',
  '0 * * * *',  -- Every hour
  $$
  SELECT CASE
    WHEN COUNT(*) > 100 THEN
      extensions.http_post(
        'https://your-webhook-url.com/alert',
        '{"message": "More than 100 jobs stuck in queue!"}'
      )
  END
  FROM jobs
  WHERE status = 'queued'
    AND created_at < NOW() - INTERVAL '1 hour';
  $$
);
```

---

## SQL Reference

All management queries are available in:
- **File**: `supabase/manage-cron-job.sql`
- **Contains**: View status, pause/resume, delete, statistics, cleanup

---

## Related Documentation

- **Setup Guide**: [docs/SETUP.md](./SETUP.md#job-processing-setup)
- **Functions Guide**: [apps/functions/README.md](../apps/functions/README.md)
- **Troubleshooting**: [README.md](../README.md#troubleshooting)
- **Testing Scripts**: [scripts/README.md](../scripts/README.md)

---

## Summary

✅ **To enable**: Run `supabase/setup-automated-processing.sql` in SQL Editor
✅ **To monitor**: Use queries from `supabase/manage-cron-job.sql`
✅ **To test**: Upload an image and check it processes within 1 minute
✅ **To pause**: Set `active = false` in cron.job table
✅ **To adjust**: Modify iterations and delay in cron job SQL

**Status**: Recommended for production use
**Maintenance**: Monitor weekly, cleanup logs monthly
