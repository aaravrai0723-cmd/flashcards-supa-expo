#!/bin/bash

# Script to configure job processing settings using the config table
# This sets up the configuration needed for the cron job to call edge functions

set -e

# Resolve repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load environment variables from .env.local
if [ -f "$REPO_ROOT/.env.local" ]; then
  export $(grep -v '^#' "$REPO_ROOT/.env.local" | xargs)
fi

# Check required variables
if [ -z "$SUPABASE_URL" ]; then
  echo "Error: SUPABASE_URL not found in .env.local"
  exit 1
fi

if [ -z "$CRON_SECRET" ]; then
  echo "Error: CRON_SECRET not found in .env.local"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: SUPABASE_SERVICE_ROLE_KEY not found in .env.local"
  exit 1
fi

echo "Configuring job processing settings..."
echo "Project URL: $SUPABASE_URL"
echo ""

# Get database connection string
DB_URL=$(grep -m1 '^DATABASE_URL=' "$REPO_ROOT/.env.local" | cut -d= -f2- | tr -d "'\"")

if [ -z "$DB_URL" ]; then
  echo "Error: DATABASE_URL not found in .env.local"
  echo ""
  echo "Please add your database connection string to .env.local:"
  echo "  DATABASE_URL=postgresql://postgres.iwduhrpcxblodxfbrhyy:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:6543/postgres"
  exit 1
fi

echo "Setting configuration in database table..."

# Use psql to insert configuration
psql "$DB_URL" <<EOF
-- Set the configuration values
SELECT set_job_processing_config('supabase_url', '$SUPABASE_URL');
SELECT set_job_processing_config('cron_secret', '$CRON_SECRET');
SELECT set_job_processing_config('service_role_key', '$SUPABASE_SERVICE_ROLE_KEY');

-- Verify settings
SELECT key,
       CASE
         WHEN key = 'service_role_key' THEN LEFT(value, 20) || '...[truncated]'
         WHEN key = 'cron_secret' THEN LEFT(value, 10) || '...[truncated]'
         ELSE value
       END as value,
       updated_at
FROM job_processing_config
ORDER BY key;
EOF

if [ $? -eq 0 ]; then
  echo ""
  echo "✓ Configuration completed successfully!"
  echo ""
  echo "The cron job will now automatically process queued jobs every minute."
  echo ""
  echo "To monitor the cron job:"
  echo "  SELECT * FROM job_processing_status;"
  echo ""
  echo "To manually trigger job processing:"
  echo "  SELECT manual_process_jobs(5);"
  echo ""
  echo "To view cron job run history:"
  echo "  SELECT * FROM cron.job_run_details WHERE jobname = 'process-queued-jobs' ORDER BY start_time DESC LIMIT 10;"
else
  echo ""
  echo "✗ Configuration failed"
  exit 1
fi
