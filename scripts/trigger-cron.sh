#!/bin/bash

# Script to manually trigger the cron-tick function to process multiple jobs
# Usage: ./scripts/trigger-cron.sh [iterations] [delay_ms]

set -e

# Configuration
ITERATIONS=${1:-5}  # Default to 5 iterations
DELAY_MS=${2:-1000}  # Default to 1 second delay between iterations

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

# Check if CRON_SECRET is set
if [ -z "$CRON_SECRET" ]; then
  echo "Error: CRON_SECRET environment variable is not set"
  echo ""
  echo "Please set it first:"
  echo "  export CRON_SECRET='your_secret_here'"
  echo ""
  echo "You can get the secret value from:"
  echo "  grep CRON_SECRET .env.local"
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

echo "Triggering cron to process jobs..."
echo "Project URL: $SUPABASE_URL"
echo "Iterations: $ITERATIONS"
echo "Delay: ${DELAY_MS}ms"
echo ""

# Call the cron-tick function
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
  "${SUPABASE_URL}/functions/v1/cron-tick" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "x-cron-secret: $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"iterations\": $ITERATIONS, \"delay\": $DELAY_MS}")

# Extract status code and body
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | sed 's/HTTP_STATUS://')
BODY=$(echo "$RESPONSE" | grep -v "HTTP_STATUS:")

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" -eq 200 ]; then
  echo ""
  echo "✓ Cron triggered successfully!"
  TOTAL=$(echo "$BODY" | jq -r '.summary.totalProcessed // 0' 2>/dev/null || echo "0")
  echo "  Total processed: $TOTAL job(s)"
else
  echo ""
  echo "✗ Cron trigger failed"
  exit 1
fi
