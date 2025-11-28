# Supabase Edge Functions

This directory contains Supabase Edge Functions for the flashcards application, implementing a storage-driven ingestion pipeline with job queue processing.

## Architecture

```
Client Upload → Storage Webhook → Job Queue → Worker Processing → Media Assets + Cards
```

### Components

1. **ingest-webhook**: Receives storage upload notifications and creates processing jobs
2. **worker-pull**: Processes queued jobs (image/video/PDF analysis, AI card generation)
3. **cron-tick**: Triggers job processing on a schedule (optional)

## Local Development

### Prerequisites

- Deno installed
- Supabase CLI installed
- Environment variables configured

### Environment Variables

Create a `.env` file in the project root:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Function Security
FILE_PROCESSING_WEBHOOK_SECRET=your_webhook_secret
JOB_WORKER_SECRET=your_worker_secret
CRON_SECRET=your_cron_secret

# AI Provider (choose one)
VISION_PROVIDER=openai
OPENAI_API_KEY=your_openai_key

# Optional: Other AI providers
GOOGLE_AI_API_KEY=your_google_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### Serve Functions Locally

```bash
# From the project root
supabase functions serve --env-file .env

# Or serve specific functions
supabase functions serve ingest-webhook worker-pull cron-tick --env-file .env
```

The functions will be available at:
- `http://localhost:54321/functions/v1/ingest-webhook`
- `http://localhost:54321/functions/v1/worker-pull`
- `http://localhost:54321/functions/v1/cron-tick`
- `http://localhost:54321/functions/v1/health`
- `http://localhost:54321/functions/v1/monitoring`

### Testing Functions

#### Test Ingest Webhook

```bash
# Simulate storage upload webhook
curl -X POST http://localhost:54321/functions/v1/ingest-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: sha256=your_signature" \
  -d '{
    "type": "INSERT",
    "table": "objects",
    "record": {
      "bucket_id": "ingest",
      "name": "user123/test-image.jpg",
      "metadata": {
        "mimetype": "image/jpeg",
        "size": "1024000"
      }
    }
  }'
```

#### Test Worker Pull

```bash
# Process queued jobs
curl -X POST http://localhost:54321/functions/v1/worker-pull \
  -H "Authorization: Bearer your_worker_secret" \
  -H "Content-Type: application/json"
```

#### Test Cron Tick

```bash
# Trigger job processing (multiple iterations)
curl -X POST http://localhost:54321/functions/v1/cron-tick \
  -H "Authorization: Bearer your_cron_secret" \
  -H "Content-Type: application/json" \
  -d '{
    "iterations": 3,
    "delay": 1000
  }'
```

#### Test Health Check

```bash
# Basic health check
curl http://localhost:54321/functions/v1/health

# Detailed health check
curl "http://localhost:54321/functions/v1/health?type=detailed"

# Queue health check
curl "http://localhost:54321/functions/v1/health?type=queue"
```

#### Test Monitoring

```bash
# Get system metrics
curl http://localhost:54321/functions/v1/monitoring/metrics

# Get system alerts
curl http://localhost:54321/functions/v1/monitoring/alerts

# Get dashboard data
curl http://localhost:54321/functions/v1/monitoring/dashboard

# Perform system cleanup
curl -X POST http://localhost:54321/functions/v1/monitoring/cleanup
```

### Testing with Real Files

1. **Upload a file to the ingest bucket**:
   ```bash
   # Using Supabase CLI
   supabase storage upload ingest test-image.jpg ./test-image.jpg
   ```

2. **Check job creation**:
   ```sql
   SELECT * FROM jobs WHERE status = 'queued' ORDER BY created_at DESC LIMIT 5;
   ```

3. **Process jobs**:
   ```bash
   curl -X POST http://localhost:54321/functions/v1/worker-pull \
     -H "Authorization: Bearer your_worker_secret"
   ```

4. **Check results**:
   ```sql
   SELECT * FROM media_assets ORDER BY created_at DESC LIMIT 5;
   SELECT * FROM cards WHERE is_active = false ORDER BY created_at DESC LIMIT 5;
   ```

## Deployment

This section provides detailed instructions for deploying the Edge Functions to production.

### Prerequisites

Before deploying, make sure you have:

1. **Supabase CLI installed**
   ```bash
   npm install -g supabase
   ```

2. **Project linked to Supabase**
   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```

3. **Environment variables configured in `.env.local`**
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `FILE_PROCESSING_WEBHOOK_SECRET` - Webhook authentication secret
   - `JOB_WORKER_SECRET` - Worker endpoint authentication secret
   - `CRON_SECRET` - Cron endpoint authentication secret

4. **Database migrations applied**
   ```bash
   npx supabase db push
   ```

### Step-by-Step Deployment Guide

#### Step 1: Get Your OpenAI API Key

If you don't have an OpenAI API key yet:

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key and add it to your `.env.local` file

```env
OPENAI_API_KEY=sk-proj-...
```

#### Step 2: Generate Security Secrets

Generate secure random secrets for webhook and worker authentication:

```bash
# Generate all three secrets at once
openssl rand -hex 32  # Use for FILE_PROCESSING_WEBHOOK_SECRET
openssl rand -hex 32  # Use for JOB_WORKER_SECRET
openssl rand -hex 32  # Use for CRON_SECRET
```

Add these to your `.env.local` file:

```env
FILE_PROCESSING_WEBHOOK_SECRET=your_generated_secret_1
JOB_WORKER_SECRET=your_generated_secret_2
CRON_SECRET=your_generated_secret_3
```

#### Step 3: Set Supabase Secrets (Automated)

Use the provided script to automatically set all secrets from your `.env.local` file:

```bash
# From the project root
./scripts/setup-supabase-secrets.sh

# Or specify a custom env file
./scripts/setup-supabase-secrets.sh .env.production
```

The script will:
- Read your environment variables
- Validate that all required secrets are present
- Set each secret in Supabase
- Provide a summary of the operation

**Manual Alternative:**

If you prefer to set secrets manually:

```bash
# Set each secret individually
npx supabase secrets set OPENAI_API_KEY=your_openai_key
npx supabase secrets set FILE_PROCESSING_WEBHOOK_SECRET=your_webhook_secret
npx supabase secrets set JOB_WORKER_SECRET=your_worker_secret
npx supabase secrets set CRON_SECRET=your_cron_secret
```

#### Step 4: Verify Secrets

```bash
# List all secrets (values are hidden)
npx supabase secrets list

# You should see:
# - OPENAI_API_KEY
# - FILE_PROCESSING_WEBHOOK_SECRET
# - JOB_WORKER_SECRET
# - CRON_SECRET
```

#### Step 5: Deploy Edge Functions

```bash
# Deploy all functions
npx supabase functions deploy

# Or deploy specific functions
npx supabase functions deploy ingest-webhook worker-pull cron-tick health monitoring
```

The deployment will:
- Bundle each function with its dependencies
- Upload to Supabase infrastructure
- Make functions available at `https://YOUR_PROJECT_REF.supabase.co/functions/v1/`

#### Step 6: Configure Storage Trigger

Set up automatic job creation when files are uploaded using a database trigger.

**Using SQL (Recommended Method)**

This is the preferred method as it's more reliable than webhooks:

1. Go to your [Supabase SQL Editor](https://supabase.com/dashboard)
2. Select your project → **SQL Editor** → **New query**
3. Copy the contents of `supabase/setup-storage-trigger.sql`
4. Click **Run** (no placeholders to replace!)

The trigger will automatically create jobs in the database when files are uploaded to the `ingest` bucket.

**What this does:**
- Creates a database trigger that fires on file uploads
- Directly inserts jobs into the `jobs` table
- Determines job type based on mime type
- More reliable than webhooks (no HTTP calls, no secrets needed)

**Verify the trigger:**
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_storage_object_created';
```

**Note:** This approach is better than Storage Webhooks because it:
- Works on all Supabase plans
- Doesn't require webhook secrets
- Can't fail due to network issues
- Is faster (direct database insert)

#### Step 7: Set Up Automated Job Processing

You have two options for processing jobs automatically:

**Option A: Using pg_cron (Recommended for Production)**

This runs the job processor every minute directly from your database:

```sql
-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule job processing every minute
SELECT cron.schedule(
  'process-flashcard-jobs',        -- Job name
  '* * * * *',                      -- Every minute
  $$
  SELECT net.http_post(
    'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cron-tick',
    '{"iterations": 5, "delay": 1000}',
    headers:='{"Authorization": "Bearer YOUR_CRON_SECRET", "Content-Type": "application/json"}'::jsonb
  );
  $$
);
```

Replace:
- `YOUR_PROJECT_REF` with your actual Supabase project reference
- `YOUR_CRON_SECRET` with your actual CRON_SECRET value

**Option B: External Scheduler (GitHub Actions)**

Create `.github/workflows/process-jobs.yml`:

```yaml
name: Process Flashcard Jobs
on:
  schedule:
    - cron: '* * * * *'  # Every minute
  workflow_dispatch:     # Allow manual trigger

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Job Processing
        run: |
          curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/cron-tick \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            -d '{"iterations": 5, "delay": 1000}'
```

Add your `CRON_SECRET` to GitHub repository secrets.

**Option C: Manual Trigger (For Testing)**

Process jobs manually using curl:

```bash
# Trigger job processing manually
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/worker-pull \
  -H "Authorization: Bearer YOUR_JOB_WORKER_SECRET" \
  -H "Content-Type: application/json"

# Or use cron-tick for multiple iterations
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/cron-tick \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"iterations": 5, "delay": 1000}'
```

### Post-Deployment Verification

#### Test the Complete Pipeline

1. **Upload a test image** in your mobile app
   - Take a photo or upload an existing image
   - The image should be uploaded to the `ingest` bucket

2. **Check job creation**
   ```sql
   SELECT * FROM jobs
   ORDER BY created_at DESC
   LIMIT 5;
   ```
   You should see a new job with status `queued`

3. **Trigger job processing** (if not using automatic processing)
   ```bash
   curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/worker-pull \
     -H "Authorization: Bearer YOUR_JOB_WORKER_SECRET"
   ```

4. **Check job completion**
   ```sql
   SELECT * FROM jobs
   WHERE status = 'completed'
   ORDER BY updated_at DESC
   LIMIT 5;
   ```

5. **Verify media assets and cards were created**
   ```sql
   -- Check media assets
   SELECT * FROM media_assets
   ORDER BY created_at DESC
   LIMIT 5;

   -- Check generated cards (is_active=false until user approves)
   SELECT * FROM cards
   WHERE is_active = false
   ORDER BY created_at DESC
   LIMIT 5;
   ```

#### Check Function Health

```bash
# Basic health check
curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/health

# Detailed health check
curl "https://YOUR_PROJECT_REF.supabase.co/functions/v1/health?type=detailed"

# Queue health check
curl "https://YOUR_PROJECT_REF.supabase.co/functions/v1/health?type=queue"
```

#### Monitor Function Logs

```bash
# View logs for each function
npx supabase functions logs ingest-webhook
npx supabase functions logs worker-pull
npx supabase functions logs cron-tick
```

### Configuration Reference

#### Environment Variables / Secrets

| Secret Name | Purpose | How to Generate |
|------------|---------|-----------------|
| `OPENAI_API_KEY` | OpenAI API access for vision and text generation | Get from https://platform.openai.com/api-keys |
| `FILE_PROCESSING_WEBHOOK_SECRET` | Authenticates storage webhook requests | `openssl rand -hex 32` |
| `JOB_WORKER_SECRET` | Authenticates worker endpoint requests | `openssl rand -hex 32` |
| `CRON_SECRET` | Authenticates cron trigger requests | `openssl rand -hex 32` |
| `GOOGLE_AI_API_KEY` | (Optional) Google AI API access | Get from Google Cloud Console |
| `ANTHROPIC_API_KEY` | (Optional) Anthropic API access | Get from Anthropic Console |

#### Function URLs

After deployment, your functions will be available at:

- **Ingest Webhook**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/ingest-webhook`
- **Worker Pull**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/worker-pull`
- **Cron Tick**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/cron-tick`
- **Health Check**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/health`
- **Monitoring**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/monitoring`

### Updating Functions

When you make changes to the functions:

```bash
# Deploy updated functions
npx supabase functions deploy

# Or deploy specific function
npx supabase functions deploy worker-pull
```

Secrets are preserved during redeployment - you only need to set them once.

### Rollback

If you need to rollback a deployment:

```bash
# View deployment history
npx supabase functions list

# Deploy a specific version (if supported)
# Or redeploy from a previous commit
git checkout <previous-commit>
npx supabase functions deploy
```

## Monitoring

### Check Job Queue Status

```sql
-- Queue statistics
SELECT 
  status,
  type,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM jobs 
GROUP BY status, type
ORDER BY status, type;

-- Recent jobs
SELECT 
  id,
  type,
  status,
  created_at,
  updated_at,
  error
FROM jobs 
ORDER BY created_at DESC 
LIMIT 10;
```

### Monitor Function Logs

```bash
# View function logs
supabase functions logs ingest-webhook
supabase functions logs worker-pull
supabase functions logs cron-tick
```

### Health Check

```bash
# Check function health
curl https://your-project.supabase.co/functions/v1/cron-tick/health
```

## Troubleshooting

### Common Issues

1. **Jobs stuck in processing**: Check worker logs for errors
2. **Webhook not triggering**: Verify storage webhook configuration
3. **AI processing failing**: Check API keys and quotas
4. **Media assets not created**: Verify storage bucket permissions

### Debug Mode

Set environment variable for verbose logging:

```bash
export DEBUG=true
supabase functions serve --env-file .env
```

### Manual Job Processing

```sql
-- Manually trigger job processing
SELECT net.http_post(
  'https://your-project.supabase.co/functions/v1/worker-pull',
  '{}',
  '{"Authorization": "Bearer your_worker_secret", "Content-Type": "application/json"}'
);
```

## File Structure

```
apps/functions/
├── _internals/
│   ├── utils.ts          # HMAC verification, client factory, utilities
│   ├── ai.ts            # Pluggable AI client (OpenAI, Google, Anthropic)
│   ├── media.ts         # Media processing helpers (image, video, PDF)
│   └── rate-limiter.ts  # Rate limiting, queue management, circuit breakers
├── ingest-webhook/
│   └── index.ts         # Storage upload webhook handler
├── worker-pull/
│   └── index.ts         # Job processing worker
├── cron-tick/
│   └── index.ts         # Scheduled job trigger
├── health/
│   └── index.ts         # Health check and system monitoring
├── monitoring/
│   └── index.ts         # Metrics, alerts, and dashboard data
├── tests/
│   └── test-examples.md # Comprehensive testing examples
└── README.md           # This file
```

## Security

- All functions use service role for database access
- Webhook signatures verified with HMAC-SHA256
- Worker endpoints protected with bearer tokens
- Client uploads go to `ingest/` bucket only
- Processed files stored in `derived/` bucket
- RLS policies control access to all data

---

## Troubleshooting

### Function Returns 503 or BOOT_ERROR

**Symptoms**: Functions fail to start, logs show "worker boot error" or "BOOT_ERROR"

**Common Causes**:
1. **Syntax errors in code** - Check function logs for specific line numbers
2. **Missing imports** - Verify all imported functions exist
3. **Environment variables missing** - Check `npx supabase secrets list`
4. **Async/await issues** - Ensure async functions are properly declared

**Solutions**:
```bash
# 1. Check function logs in Dashboard
# Go to: Dashboard > Edge Functions > [function-name] > Logs

# 2. Verify all secrets are set
npx supabase secrets list

# 3. Redeploy with latest code
npx supabase functions deploy worker-pull ingest-webhook

# 4. Test locally first
supabase functions serve worker-pull --env-file .env.local
```

**Recent Fixes** (Nov 27, 2025):
- ✅ Fixed async function syntax error in `utils.ts`
- ✅ Added missing `getMediaAssetUrl` and `storeDerivedAsset` functions
- ✅ Updated OpenAI model from deprecated `gpt-4-vision-preview` to `gpt-4o`

### Jobs Stuck in "queued" Status

**Symptoms**: Jobs created but never processed, remain in "queued" forever

**Causes**:
1. **Storage trigger not installed** - Jobs not created automatically
2. **Worker not running** - No automated processing set up
3. **Incorrect job input data** - Missing required fields

**Solutions**:

1. **Verify storage trigger exists**:
   ```sql
   SELECT trigger_name FROM information_schema.triggers
   WHERE trigger_name = 'on_storage_object_created';
   ```
   If missing, run `supabase/setup-storage-trigger.sql` in SQL Editor

2. **Check job input format**:
   ```sql
   SELECT id, type, input FROM jobs WHERE status = 'queued' LIMIT 1;
   ```
   Should have: `storage_path`, `mime_type`, `owner` (snake_case, not camelCase)

3. **Manually trigger processing**:
   ```bash
   export JOB_WORKER_SECRET='your_secret'
   export SUPABASE_SERVICE_ROLE_KEY='your_service_role_key'
   ./scripts/trigger-worker.sh
   ```

4. **Set up automated processing**:
   - See [Job Processing Setup](../../docs/SETUP.md#job-processing-setup)
   - Use pg_cron to auto-process jobs every minute

**Recent Fixes** (Nov 27, 2025):
- ✅ Fixed field name mismatch in storage trigger (camelCase → snake_case)
- ✅ Added backwards compatibility for missing owner field
- ✅ Updated storage trigger to create `ingest_files` records

### Jobs Failing with OpenAI Errors

**Symptoms**: Jobs fail with "OpenAI API error: Not Found" or similar

**Causes**:
1. **Deprecated model name** - Using old `gpt-4-vision-preview`
2. **Invalid API key** - Key expired or has no credit
3. **Rate limit exceeded** - Too many API calls

**Solutions**:

1. **Verify model name** (should be `gpt-4o`):
   ```bash
   grep "model:" apps/functions/_internals/ai.ts
   # Should show: model: 'gpt-4o'
   ```

2. **Check API key**:
   ```bash
   # Verify secret is set
   npx supabase secrets list | grep OPENAI_API_KEY

   # Test API key manually
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_OPENAI_KEY"
   ```

3. **Check OpenAI account**:
   - Go to https://platform.openai.com/account/billing
   - Verify you have credits/billing set up
   - Check usage limits

**Recent Fixes** (Nov 27, 2025):
- ✅ Updated to current OpenAI model: `gpt-4o` (supports vision)
- ✅ Removed deprecated `gpt-4-vision-preview` references

### Storage Path or Bucket Issues

**Symptoms**: "Bucket not found", "Access denied", or "File not found" errors

**Solutions**:

1. **Verify buckets exist**:
   - Go to Dashboard > Storage
   - Should have: `ingest`, `media`, `derived`

2. **Check file is in correct bucket**:
   ```sql
   SELECT bucket_id, name FROM storage.objects
   WHERE name LIKE '%your-filename%';
   ```

3. **Verify processing reads from correct bucket**:
   - Processing functions now default to `ingest` bucket
   - Can be overridden if needed

**Recent Fixes** (Nov 27, 2025):
- ✅ Updated processing functions to use `ingest` bucket by default
- ✅ Added bucket parameter for flexibility

### Missing Owner Field

**Symptoms**: "null value in column owner violates not-null constraint"

**This issue is fixed** as of Nov 27, 2025. The worker now extracts owner from storage_path if not provided.

**Verification**:
```typescript
// In worker-pull/index.ts, you should see:
const owner = input.owner || input.storage_path.split('/')[0];
```

This provides backwards compatibility with old job formats.

---

## Recent Updates (Nov 27, 2025)

All critical bugs have been fixed. The image processing pipeline is now fully functional:

✅ **Fixed Issues**:
- Import errors causing BOOT_ERROR
- Bucket name mismatches
- Storage trigger field name mismatches
- Async function syntax errors
- Deprecated OpenAI model
- Missing owner field handling

✅ **Verified Working**:
- Worker deploys successfully
- Jobs process correctly (status: "done")
- Media assets created
- Draft cards generated with AI descriptions
- Thumbnails stored in derived bucket
- OpenAI Vision API calls successful

For detailed changelog, see [CHANGELOG.md](../../CHANGELOG.md).

For complete troubleshooting guide, see [README.md](../../README.md#troubleshooting).
