#!/bin/bash
# Simple shell script to seed remote Supabase database using psql

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

# Extract project ref from URL
PROJECT_REF=$(echo $EXPO_PUBLIC_SUPABASE_URL | sed -n 's/.*\/\/\([^.]*\).*/\1/p')

# Get database password (you'll need to set this)
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
  echo "⚠️  SUPABASE_DB_PASSWORD not set in .env.local"
  echo "   Get it from: https://supabase.com/dashboard/project/$PROJECT_REF/settings/database"
  read -sp "Enter your database password: " SUPABASE_DB_PASSWORD
  echo
fi

# URL encode the password to handle special characters
# This is a simple URL encoding for common special characters
URL_ENCODED_PASSWORD=$(printf %s "$SUPABASE_DB_PASSWORD" | jq -sRr @uri)

# If jq is not available, use Python as fallback
if [ -z "$URL_ENCODED_PASSWORD" ]; then
  URL_ENCODED_PASSWORD=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$SUPABASE_DB_PASSWORD', safe=''))")
fi

# Construct connection string with URL-encoded password
DB_URL="postgresql://postgres.${PROJECT_REF}:${URL_ENCODED_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

echo "🌱 Seeding remote database..."
echo "   Project: $PROJECT_REF"

# Execute seed file
if command -v psql &> /dev/null; then
  # Use PGPASSWORD environment variable to avoid password in connection string
  # Use direct connection (port 5432) instead of pooler
  PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "aws-0-us-east-1.pooler.supabase.com" -p 5432 -U "postgres.${PROJECT_REF}" -d postgres -f supabase/seed.sql

  # If that fails, try alternative connection string format
  if [ $? -ne 0 ]; then
    echo "⚠️  Direct connection failed, trying alternative method..."
    PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "db.${EXPO_PUBLIC_SUPABASE_URL#https://}" -p 5432 -U postgres -d postgres -f supabase/seed.sql
  fi

  if [ $? -eq 0 ]; then
    echo "✅ Database seeded successfully!"
  else
    echo "❌ Database seeding failed"
    echo "   Try running the seed SQL manually in the Supabase dashboard:"
    echo "   https://supabase.com/dashboard/project/$PROJECT_REF/sql"
    exit 1
  fi
else
  echo "❌ psql command not found"
  echo "   Install PostgreSQL client tools or use the Supabase dashboard"
  exit 1
fi
