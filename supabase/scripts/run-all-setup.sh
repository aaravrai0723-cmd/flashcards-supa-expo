#!/bin/bash

# Simple script to run all Supabase setup scripts in sequence
# Works with both local and remote Supabase instances
# Usage:
#   ./run-all-setup.sh                   # Run all setup scripts
#   ./run-all-setup.sh --sql-file path   # Run a specific SQL file
#   ./run-all-setup.sh --sql "QUERY"     # Run an inline SQL statement

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE=""
SQL_TEXT=""

show_help() {
    cat << EOF
Usage: ./run-all-setup.sh [OPTIONS]

Options:
    --sql-file <path>    Run a specific SQL file against Supabase
    --sql "QUERY"        Run an inline SQL statement (wrap in quotes)
    -h, --help           Show this help message

Without options, all setup scripts are run in order.
EOF
    exit 0
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --sql-file)
            if [[ -z "$2" ]]; then
                echo "Error: --sql-file requires a file path"
                exit 1
            fi
            SQL_FILE="$2"
            shift 2
            ;;
        --sql)
            if [[ -z "$2" ]]; then
                echo "Error: --sql requires a SQL statement"
                exit 1
            fi
            SQL_TEXT="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            ;;
        *)
            echo "Error: Unknown option $1"
            echo ""
            show_help
            ;;
    esac
done

if [ -n "$SQL_FILE" ] && [ -n "$SQL_TEXT" ]; then
    echo "Error: Use either --sql-file or --sql, not both"
    exit 1
fi

echo "========================================="
if [ -n "$SQL_FILE" ]; then
    echo "Running SQL file against Supabase..."
elif [ -n "$SQL_TEXT" ]; then
    echo "Running inline SQL against Supabase..."
else
    echo "Running all Supabase setup scripts..."
fi
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

    # Use remote connection with correct host format
    # Port 6543 is for transaction pooler, port 5432 for direct connection
    PSQL_CMD="PGPASSWORD='$SUPABASE_DB_PASSWORD' psql -h db.${PROJECT_REF}.supabase.co -p 5432 -U postgres -d postgres"
    echo "   Project: $PROJECT_REF"
    echo ""
else
    echo "Using local Supabase instance"
    PSQL_CMD="psql $DB_URL"
    echo ""
fi

# Run arbitrary SQL if requested
if [ -n "$SQL_FILE" ]; then
    if [ ! -f "$SQL_FILE" ]; then
        echo "❌ Error: SQL file not found: $SQL_FILE"
        exit 1
    fi
    echo "Running SQL file: $SQL_FILE"
    eval "$PSQL_CMD" < "$SQL_FILE"
    echo "✓ SQL file executed successfully"
    exit 0
fi

if [ -n "$SQL_TEXT" ]; then
    echo "Running inline SQL..."
    echo "$SQL_TEXT" | eval "$PSQL_CMD"
    echo "✓ SQL executed successfully"
    exit 0
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
