#!/bin/bash

# Script to manually trigger the worker to process queued jobs
# Usage: ./scripts/trigger-worker.sh [iterations]

set -e

# Configuration
ITERATIONS=${1:-5}  # Default to 5 iterations

# Resolve repo root (script can be run from anywhere)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Derive Supabase URL (prefer env, fallback to .env.local)
if [ -z "$SUPABASE_URL" ] && [ -f "$REPO_ROOT/.env.local" ]; then
  SUPABASE_URL="$(grep -m1 '^SUPABASE_URL=' "$REPO_ROOT/.env.local" | cut -d= -f2-)"
fi

if [ -z "$SUPABASE_URL" ]; then
  echo "Error: SUPABASE_URL is not set and could not be read from .env.local"
  exit 1
fi

# Check if JOB_WORKER_SECRET is set
if [ -z "$JOB_WORKER_SECRET" ]; then
  echo "Error: JOB_WORKER_SECRET environment variable is not set"
  echo ""
  echo "Please set it first:"
  echo "  export JOB_WORKER_SECRET='your_secret_here'"
  echo ""
  echo "You can get the secret value from:"
  echo "  grep JOB_WORKER_SECRET .env.local"
  echo ""
  exit 1
fi

# Check if SUPABASE_SERVICE_ROLE_KEY is set
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set"
  echo ""
  echo "Please set it first:"
  echo "  export SUPABASE_SERVICE_ROLE_KEY='your_service_role_key'"
  echo ""
  echo "You can get it from:"
  echo "  grep SUPABASE_SERVICE_ROLE_KEY .env.local"
  echo ""
  exit 1
fi

echo "Triggering worker to process $ITERATIONS jobs..."
echo "Project URL: $SUPABASE_URL"
echo ""

# Call the worker-pull function directly
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
  "${SUPABASE_URL}/functions/v1/worker-pull" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "x-worker-secret: $JOB_WORKER_SECRET" \
  -H "Content-Type: application/json")

# Extract status code and body
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | sed 's/HTTP_STATUS://')
BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS:")

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" -eq 200 ]; then
  echo ""
  echo "✓ Worker triggered successfully!"
  PROCESSED=$(echo "$BODY" | jq -r '.processed // 0' 2>/dev/null || echo "0")
  echo "  Processed: $PROCESSED job(s)"
else
  echo ""
  echo "✗ Worker trigger failed"
  exit 1
fi
