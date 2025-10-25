# Function Testing Examples

This document provides comprehensive testing examples for all Supabase Edge Functions in the flashcards application.

## Prerequisites

### Environment Setup
```bash
# Install dependencies
npm install -g supabase

# Set up environment variables
cp .env.example .env
# Edit .env with your values
```

### Required Environment Variables
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FILE_PROCESSING_WEBHOOK_SECRET=your_webhook_secret
JOB_WORKER_SECRET=your_worker_secret
CRON_SECRET=your_cron_secret
OPENAI_API_KEY=your_openai_key
```

## Local Development Testing

### 1. Start Functions Locally
```bash
# Start all functions
supabase functions serve --env-file .env

# Start specific functions
supabase functions serve ingest-webhook worker-pull cron-tick health --env-file .env
```

### 2. Test Ingest Webhook

#### Basic Webhook Test
```bash
# Test with valid signature
curl -X POST http://localhost:54321/functions/v1/ingest-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: sha256=$(echo -n '{"type":"INSERT","table":"objects","record":{"bucket_id":"ingest","name":"user123/test.jpg","metadata":{"mimetype":"image/jpeg","size":"1024000"}}}' | openssl dgst -sha256 -hmac 'your_webhook_secret' -binary | base64)" \
  -d '{
    "type": "INSERT",
    "table": "objects",
    "record": {
      "bucket_id": "ingest",
      "name": "user123/test.jpg",
      "metadata": {
        "mimetype": "image/jpeg",
        "size": "1024000"
      }
    }
  }'
```

#### Test Different File Types
```bash
# Test video upload
curl -X POST http://localhost:54321/functions/v1/ingest-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: sha256=..." \
  -d '{
    "type": "INSERT",
    "table": "objects",
    "record": {
      "bucket_id": "ingest",
      "name": "user123/test-video.mp4",
      "metadata": {
        "mimetype": "video/mp4",
        "size": "10485760"
      }
    }
  }'

# Test PDF upload
curl -X POST http://localhost:54321/functions/v1/ingest-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: sha256=..." \
  -d '{
    "type": "INSERT",
    "table": "objects",
    "record": {
      "bucket_id": "ingest",
      "name": "user123/document.pdf",
      "metadata": {
        "mimetype": "application/pdf",
        "size": "2048000"
      }
    }
  }'
```

#### Test Error Cases
```bash
# Test invalid signature
curl -X POST http://localhost:54321/functions/v1/ingest-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: sha256=invalid" \
  -d '{"type":"INSERT","table":"objects","record":{"bucket_id":"ingest","name":"test.jpg"}}'

# Test unsupported file type
curl -X POST http://localhost:54321/functions/v1/ingest-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: sha256=..." \
  -d '{
    "type": "INSERT",
    "table": "objects",
    "record": {
      "bucket_id": "ingest",
      "name": "user123/test.txt",
      "metadata": {
        "mimetype": "text/plain",
        "size": "1024"
      }
    }
  }'
```

### 3. Test Worker Pull

#### Basic Job Processing
```bash
# Process queued jobs
curl -X POST http://localhost:54321/functions/v1/worker-pull \
  -H "Authorization: Bearer your_worker_secret" \
  -H "Content-Type: application/json"
```

#### Test with Multiple Jobs
```bash
# Create multiple test jobs first
# (This would be done through the webhook or direct API calls)

# Process multiple jobs
for i in {1..5}; do
  echo "Processing batch $i"
  curl -X POST http://localhost:54321/functions/v1/worker-pull \
    -H "Authorization: Bearer your_worker_secret" \
    -H "Content-Type: application/json"
  sleep 2
done
```

#### Test Authentication
```bash
# Test without auth
curl -X POST http://localhost:54321/functions/v1/worker-pull \
  -H "Content-Type: application/json"

# Test with invalid auth
curl -X POST http://localhost:54321/functions/v1/worker-pull \
  -H "Authorization: Bearer invalid_secret" \
  -H "Content-Type: application/json"
```

### 4. Test Cron Tick

#### Basic Cron Trigger
```bash
# Single iteration
curl -X POST http://localhost:54321/functions/v1/cron-tick \
  -H "Authorization: Bearer your_cron_secret" \
  -H "Content-Type: application/json"
```

#### Multiple Iterations
```bash
# Multiple iterations with delay
curl -X POST http://localhost:54321/functions/v1/cron-tick \
  -H "Authorization: Bearer your_cron_secret" \
  -H "Content-Type: application/json" \
  -d '{
    "iterations": 5,
    "delay": 2000
  }'
```

#### Test Rate Limiting
```bash
# Rapid fire requests to test rate limiting
for i in {1..20}; do
  curl -X POST http://localhost:54321/functions/v1/cron-tick \
    -H "Authorization: Bearer your_cron_secret" \
    -H "Content-Type: application/json" &
done
wait
```

### 5. Test Health Check

#### Basic Health Check
```bash
# Basic health check
curl http://localhost:54321/functions/v1/health

# Detailed health check
curl "http://localhost:54321/functions/v1/health?type=detailed"

# Queue health check
curl "http://localhost:54321/functions/v1/health?type=queue"

# Storage health check
curl "http://localhost:54321/functions/v1/health?type=storage"
```

## Production Testing

### 1. Deploy Functions
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific functions
supabase functions deploy ingest-webhook worker-pull cron-tick health
```

### 2. Test with Real Files

#### Upload Test Files
```bash
# Upload image to ingest bucket
supabase storage upload ingest test-image.jpg ./test-files/image.jpg

# Upload video to ingest bucket
supabase storage upload ingest test-video.mp4 ./test-files/video.mp4

# Upload PDF to ingest bucket
supabase storage upload ingest test-document.pdf ./test-files/document.pdf
```

#### Monitor Job Processing
```sql
-- Check job queue
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

-- Check media assets
SELECT 
  id,
  type,
  storage_path,
  owner,
  created_at
FROM media_assets 
ORDER BY created_at DESC 
LIMIT 10;

-- Check draft cards
SELECT 
  id,
  deck_id,
  prompt_text,
  is_active,
  created_at
FROM cards 
WHERE is_active = false
ORDER BY created_at DESC 
LIMIT 10;
```

### 3. Test AI Card Generation

#### Create AI Generation Job
```sql
-- Insert AI card generation job
INSERT INTO jobs (type, status, input, created_by)
VALUES (
  'ai_generate_cards',
  'queued',
  '{
    "deck_id": 1,
    "strategy": "mcq",
    "difficulty": "intermediate",
    "bloom_level": "understand",
    "context": "Educational content about photosynthesis"
  }',
  'user-uuid-here'
);
```

#### Process AI Job
```bash
# Trigger worker to process AI job
curl -X POST https://your-project.supabase.co/functions/v1/worker-pull \
  -H "Authorization: Bearer your_worker_secret" \
  -H "Content-Type: application/json"
```

## Load Testing

### 1. Concurrent Upload Testing
```bash
#!/bin/bash
# concurrent-upload-test.sh

# Create test files
mkdir -p test-files
for i in {1..10}; do
  echo "Test image $i" > "test-files/image-$i.jpg"
done

# Upload files concurrently
for i in {1..10}; do
  (
    supabase storage upload ingest "test-$i.jpg" "test-files/image-$i.jpg" &
  )
done

wait
echo "All uploads completed"
```

### 2. Job Processing Load Test
```bash
#!/bin/bash
# job-processing-load-test.sh

# Create multiple jobs
for i in {1..50}; do
  curl -X POST https://your-project.supabase.co/functions/v1/ingest-webhook \
    -H "Content-Type: application/json" \
    -H "x-webhook-signature: sha256=..." \
    -d "{
      \"type\": \"INSERT\",
      \"table\": \"objects\",
      \"record\": {
        \"bucket_id\": \"ingest\",
        \"name\": \"user123/load-test-$i.jpg\",
        \"metadata\": {
          \"mimetype\": \"image/jpeg\",
          \"size\": \"1024000\"
        }
      }
    }" &
done

wait

# Process jobs
for i in {1..10}; do
  curl -X POST https://your-project.supabase.co/functions/v1/worker-pull \
    -H "Authorization: Bearer your_worker_secret" &
done

wait
echo "Load test completed"
```

## Monitoring and Debugging

### 1. Function Logs
```bash
# View function logs
supabase functions logs ingest-webhook
supabase functions logs worker-pull
supabase functions logs cron-tick
supabase functions logs health

# View logs with filtering
supabase functions logs worker-pull --filter="error"
```

### 2. Database Monitoring
```sql
-- Job queue status
SELECT 
  status,
  type,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM jobs 
GROUP BY status, type
ORDER BY status, type;

-- Processing performance
SELECT 
  type,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time_seconds,
  COUNT(*) as total_jobs
FROM jobs 
WHERE status = 'done'
GROUP BY type;

-- Error analysis
SELECT 
  type,
  error,
  COUNT(*) as count
FROM jobs 
WHERE status = 'failed'
GROUP BY type, error
ORDER BY count DESC;
```

### 3. Health Monitoring
```bash
# Continuous health monitoring
while true; do
  echo "$(date): Health check"
  curl -s "https://your-project.supabase.co/functions/v1/health?type=detailed" | jq '.'
  sleep 60
done
```

## Error Scenarios Testing

### 1. Network Failures
```bash
# Test with network timeouts
curl --max-time 5 -X POST http://localhost:54321/functions/v1/worker-pull \
  -H "Authorization: Bearer your_worker_secret"
```

### 2. Invalid Data
```bash
# Test with malformed JSON
curl -X POST http://localhost:54321/functions/v1/ingest-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: sha256=..." \
  -d '{"invalid": "json"'

# Test with missing required fields
curl -X POST http://localhost:54321/functions/v1/ingest-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: sha256=..." \
  -d '{}'
```

### 3. Resource Exhaustion
```bash
# Test with very large files
curl -X POST http://localhost:54321/functions/v1/ingest-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: sha256=..." \
  -d '{
    "type": "INSERT",
    "table": "objects",
    "record": {
      "bucket_id": "ingest",
      "name": "user123/huge-file.jpg",
      "metadata": {
        "mimetype": "image/jpeg",
        "size": "1073741824"
      }
    }
  }'
```

## Performance Testing

### 1. Response Time Testing
```bash
#!/bin/bash
# response-time-test.sh

for i in {1..100}; do
  start_time=$(date +%s%N)
  curl -s -X POST http://localhost:54321/functions/v1/health > /dev/null
  end_time=$(date +%s%N)
  echo "Request $i: $(( (end_time - start_time) / 1000000 ))ms"
done
```

### 2. Throughput Testing
```bash
#!/bin/bash
# throughput-test.sh

# Test worker throughput
for i in {1..100}; do
  curl -X POST http://localhost:54321/functions/v1/worker-pull \
    -H "Authorization: Bearer your_worker_secret" &
done

wait
echo "Throughput test completed"
```

## Security Testing

### 1. Authentication Testing
```bash
# Test without authentication
curl -X POST http://localhost:54321/functions/v1/worker-pull

# Test with invalid authentication
curl -X POST http://localhost:54321/functions/v1/worker-pull \
  -H "Authorization: Bearer invalid_token"

# Test with wrong authentication type
curl -X POST http://localhost:54321/functions/v1/worker-pull \
  -H "Authorization: Basic invalid_token"
```

### 2. Input Validation Testing
```bash
# Test SQL injection attempts
curl -X POST http://localhost:54321/functions/v1/ingest-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: sha256=..." \
  -d '{
    "type": "INSERT",
    "table": "objects",
    "record": {
      "bucket_id": "ingest",
      "name": "user123/; DROP TABLE jobs; --.jpg",
      "metadata": {
        "mimetype": "image/jpeg",
        "size": "1024000"
      }
    }
  }'
```

### 3. Rate Limiting Testing
```bash
#!/bin/bash
# rate-limit-test.sh

# Rapid fire requests to test rate limiting
for i in {1..200}; do
  curl -X POST http://localhost:54321/functions/v1/cron-tick \
    -H "Authorization: Bearer your_cron_secret" &
done

wait
echo "Rate limit test completed"
```

## Cleanup and Maintenance

### 1. Cleanup Test Data
```sql
-- Clean up test jobs
DELETE FROM jobs WHERE created_by = 'test-user';

-- Clean up test media assets
DELETE FROM media_assets WHERE owner = 'test-user';

-- Clean up test cards
DELETE FROM cards WHERE deck_id IN (
  SELECT id FROM decks WHERE owner = 'test-user'
);
```

### 2. Reset Test Environment
```bash
# Reset database (WARNING: This will delete all data)
supabase db reset

# Re-run migrations
supabase db push

# Re-seed data
supabase db seed
```

This comprehensive testing guide covers all aspects of the function system, from basic functionality to load testing and security validation. Use these examples to ensure your functions work correctly in all scenarios.
