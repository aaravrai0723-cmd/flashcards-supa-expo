# Automatic Job Processing Setup

This document explains how to set up automatic processing of queued jobs in your Supabase project.

## Overview

When files are uploaded, they create jobs in the `jobs` table with status `queued`. These jobs need to be processed by edge functions. By default, edge functions don't run automatically - they need to be triggered.

## How It Works

1. **File Upload** → Creates an entry in `ingest_files` table
2. **Database Trigger** → Automatically creates a job in `jobs` table with status `queued`
3. **Automatic Processing** → pg_cron calls the `cron-tick` edge function every minute
4. **cron-tick Function** → Calls `worker-pull` function to process jobs
5. **worker-pull Function** → Processes one job at a time, updates status to `done` or `failed`

## Setup Options

### Option 1: pg_cron (Recommended for Supabase Projects)

PostgreSQL's built-in cron scheduler that runs database functions on a schedule.

**Pros:**
- Runs inside your database
- No external dependencies
- Free (included in all Supabase plans)
- Reliable and simple

**Cons:**
- Requires enabling pg_cron and http extensions
- Configuration stored in database

#### Setup Steps:

1. **Deploy the migration:**
   ```bash
   npx supabase db push
   ```

2. **Get your database connection string:**
   - Go to [Database Settings](https://supabase.com/dashboard/project/iwduhrpcxblodxfbrhyy/settings/database)
   - Copy the "Connection string" (Session pooler)
   - Click "Use connection pooling" toggle
   - Add the password
   - Add to `.env.local`:
     ```
     DATABASE_URL='postgresql://postgres.iwduhrpcxblodxfbrhyy:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres'
     ```

3. **Configure pg_cron settings:**
   ```bash
   ./scripts/setup-cron-config.sh
   ```

4. **Verify it's working:**
   Wait 1-2 minutes, then check if jobs are being processed:
   ```sql
   -- Check job processing status
   SELECT * FROM job_processing_status;

   -- Check recent job runs
   SELECT * FROM cron.job_run_details
   WHERE jobname = 'process-queued-jobs'
   ORDER BY start_time DESC
   LIMIT 10;

   -- Check jobs table
   SELECT id, type, status, created_at, updated_at
   FROM jobs
   ORDER BY created_at DESC
   LIMIT 10;
   ```

### Option 2: Manual Trigger (For Testing)

For development or testing, you can manually trigger job processing:

```bash
# Process jobs using the worker-pull function directly
export JOB_WORKER_SECRET='your-secret'
export SUPABASE_SERVICE_ROLE_KEY='your-key'
./scripts/trigger-worker.sh

# Or use the cron-tick function to process multiple jobs
export CRON_SECRET='your-secret'
export SUPABASE_SERVICE_ROLE_KEY='your-key'
./scripts/trigger-cron.sh 5 1000  # Process 5 jobs with 1 second delay
```

### Option 3: Database Function (For Manual Triggering)

Call the database function directly from SQL:

```sql
-- Process 5 jobs
SELECT manual_process_jobs(5);
```

### Option 4: External Cron Service

You can use external services like GitHub Actions, AWS EventBridge, or Render Cron Jobs to call the edge function.

**Example GitHub Actions workflow:**

```yaml
name: Process Jobs
on:
  schedule:
    - cron: '* * * * *'  # Every minute
  workflow_dispatch:  # Allow manual trigger

jobs:
  process-jobs:
    runs-on: ubuntu-latest
    steps:
      - name: Call cron-tick function
        run: |
          curl -X POST \
            "${{ secrets.SUPABASE_URL }}/functions/v1/cron-tick" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            -d '{"iterations": 5, "delay": 500}'
```

## Monitoring

### Check Cron Job Status

```sql
-- View current cron configuration
SELECT * FROM job_processing_status;

-- View recent cron runs
SELECT jobname, status, return_message, start_time, end_time
FROM cron.job_run_details
WHERE jobname = 'process-queued-jobs'
ORDER BY start_time DESC
LIMIT 20;
```

### Check Job Queue

```sql
-- Count jobs by status
SELECT status, COUNT(*) as count
FROM jobs
GROUP BY status;

-- View recent jobs
SELECT id, type, status, created_at, updated_at, error
FROM jobs
ORDER BY created_at DESC
LIMIT 20;

-- View failed jobs
SELECT id, type, input, error, created_at
FROM jobs
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### View Edge Function Logs

Go to [Edge Functions Logs](https://supabase.com/dashboard/project/iwduhrpcxblodxfbrhyy/functions/logs)

## Adjusting Processing Frequency

### Change Cron Schedule

```sql
-- Update to run every 30 seconds
SELECT cron.schedule(
    'process-queued-jobs',
    '*/30 * * * * *',  -- Note: 6-field format with seconds
    'SELECT trigger_job_worker();'
);

-- Update to run every 5 minutes
SELECT cron.unschedule('process-queued-jobs');
SELECT cron.schedule(
    'process-queued-jobs',
    '*/5 * * * *',
    'SELECT trigger_job_worker();'
);
```

### Change Jobs Per Iteration

Edit the migration file and update the `trigger_job_worker()` function:

```sql
'{"iterations": 10, "delay": 500}'  -- Process up to 10 jobs
```

## Troubleshooting

### Jobs not processing

1. **Check if pg_cron is enabled:**
   ```sql
   SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'http');
   ```

2. **Check cron job exists:**
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'process-queued-jobs';
   ```

3. **Check cron run history:**
   ```sql
   SELECT * FROM cron.job_run_details
   WHERE jobname = 'process-queued-jobs'
   ORDER BY start_time DESC
   LIMIT 5;
   ```

4. **Check configuration:**
   ```sql
   SELECT name, setting FROM pg_settings WHERE name LIKE 'app.settings.%';
   ```

5. **Manually test the worker:**
   ```bash
   ./scripts/trigger-worker.sh
   ```

### Cron job failing

Check the error in `cron.job_run_details`:

```sql
SELECT jobname, status, return_message, start_time
FROM cron.job_run_details
WHERE jobname = 'process-queued-jobs' AND status = 'failed'
ORDER BY start_time DESC;
```

Common issues:
- Configuration not set (run `./scripts/setup-cron-config.sh`)
- Invalid secrets
- Network/connectivity issues
- Edge function not deployed

### Disable automatic processing

```sql
-- Temporarily disable
SELECT cron.unschedule('process-queued-jobs');

-- Re-enable
SELECT cron.schedule(
    'process-queued-jobs',
    '* * * * *',
    'SELECT trigger_job_worker();'
);
```

## Performance Considerations

- The default configuration processes up to 5 jobs per minute
- Each job can take several seconds to complete (especially for AI processing)
- Adjust the cron frequency and iterations based on your load
- Monitor edge function usage and adjust as needed

## Cost Considerations

- Edge function invocations are limited by your Supabase plan
- Free plan: 500K invocations/month
- Pro plan: 2M invocations/month
- Running every minute = ~43K invocations/month (well within limits)

## Next Steps

1. Deploy the migration: `npx supabase db push`
2. Configure pg_cron: `./scripts/setup-cron-config.sh`
3. Upload a test file to verify automatic processing
4. Monitor the logs and adjust as needed
