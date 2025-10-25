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

### Deploy to Supabase

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific functions
supabase functions deploy ingest-webhook worker-pull cron-tick
```

### Set Environment Variables

```bash
# Set secrets
supabase secrets set FILE_PROCESSING_WEBHOOK_SECRET=your_secret
supabase secrets set JOB_WORKER_SECRET=your_secret
supabase secrets set OPENAI_API_KEY=your_key
```

### Configure Storage Webhook

In the Supabase dashboard:

1. Go to Storage → Settings
2. Add webhook URL: `https://your-project.supabase.co/functions/v1/ingest-webhook`
3. Set webhook secret: `FILE_PROCESSING_WEBHOOK_SECRET`

### Set up Cron Job (Optional)

Using pg_cron extension:

```sql
-- Run every minute
SELECT cron.schedule('process-jobs', '* * * * *', 'SELECT net.http_post(''https://your-project.supabase.co/functions/v1/cron-tick'', ''{"iterations": 5}'', ''{"Authorization": "Bearer your_cron_secret", "Content-Type": "application/json"}'');');
```

Or use external scheduler (GitHub Actions, etc.):

```yaml
name: Process Jobs
on:
  schedule:
    - cron: '* * * * *'  # Every minute
jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Job Processing
        run: |
          curl -X POST https://your-project.supabase.co/functions/v1/cron-tick \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            -d '{"iterations": 5, "delay": 1000}'
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
