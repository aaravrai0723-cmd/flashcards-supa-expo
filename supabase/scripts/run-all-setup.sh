#!/bin/bash

# Simple script to run all Supabase setup scripts in sequence
# Works with both local and remote Supabase instances
# Usage: ./run-all-setup.sh

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================="
echo "Running all Supabase setup scripts..."
echo "========================================="
echo ""

# Try to get local database URL first
DB_URL=$(supabase status 2>/dev/null | grep "DB URL" | awk '{print $3}' || echo "")

# If local not available, try remote connection
if [ -z "$DB_URL" ]; then
    echo "Local Supabase not running, trying remote connection..."

    # Load environment variables
    if [ -f ../../.env.local ]; then
        export $(cat ../../.env.local | grep -v '^#' | xargs)
    fi

    # Check required variables
    if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_DB_PASSWORD" ]; then
        echo "❌ Error: Missing required environment variables"
        echo "   Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_DB_PASSWORD in .env.local"
        echo "   Or start local Supabase: supabase start"
        exit 1
    fi

    # Extract project ref from URL
    PROJECT_REF=$(echo $EXPO_PUBLIC_SUPABASE_URL | sed -n 's/.*\/\/\([^.]*\).*/\1/p')

    # Use remote connection
    PSQL_CMD="PGPASSWORD='$SUPABASE_DB_PASSWORD' psql -h aws-0-us-east-1.pooler.supabase.com -p 5432 -U postgres.$PROJECT_REF -d postgres"
    echo "   Project: $PROJECT_REF"
    echo ""
else
    echo "Using local Supabase instance"
    PSQL_CMD="psql $DB_URL"
    echo ""
fi

# Run setup scripts in logical order
echo "1/3 Setting up storage trigger..."
eval "$PSQL_CMD" < "$SCRIPT_DIR/setup-storage-trigger.sql" > /dev/null
echo "✓ Storage trigger setup complete"
echo ""

echo "2/3 Setting up automated processing..."
eval "$PSQL_CMD" < "$SCRIPT_DIR/setup-automated-processing.sql" > /dev/null
echo "✓ Automated processing setup complete"
echo ""

echo "3/3 Setting up cron job..."
eval "$PSQL_CMD" < "$SCRIPT_DIR/setup-cron-job.sql" > /dev/null
echo "✓ Cron job setup complete"
echo ""

echo "========================================="
echo "All setup scripts completed successfully!"
echo "========================================="
