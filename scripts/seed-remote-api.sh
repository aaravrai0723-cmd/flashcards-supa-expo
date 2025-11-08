#!/bin/bash
# Seed remote Supabase database using SQL Editor API
# This is more reliable than direct psql connection

set -e

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check required variables
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Missing required environment variables"
  echo "   Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
  exit 1
fi

# Read seed file
SEED_FILE="supabase/seed.sql"
if [ ! -f "$SEED_FILE" ]; then
  echo "❌ Seed file not found: $SEED_FILE"
  exit 1
fi

echo "🌱 Seeding remote database via Supabase API..."
echo "   Project: $EXPO_PUBLIC_SUPABASE_URL"

# Read the SQL file content
SQL_CONTENT=$(cat "$SEED_FILE")

# Execute SQL using Supabase Management API
# Note: This uses the PostgREST API to execute raw SQL
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "${EXPO_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(jq -Rs . <<< "$SQL_CONTENT")}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
  echo "✅ Database seeded successfully!"
else
  echo "⚠️  API method not available."
  echo ""
  echo "📋 Please seed manually using the Supabase SQL Editor:"
  echo "   1. Go to: https://supabase.com/dashboard/project/$(basename $EXPO_PUBLIC_SUPABASE_URL .supabase.co | cut -d/ -f3)/sql"
  echo "   2. Copy the contents of: $SEED_FILE"
  echo "   3. Paste into the SQL Editor and run"
  echo ""
  echo "   Or use: cat $SEED_FILE"
  exit 1
fi
