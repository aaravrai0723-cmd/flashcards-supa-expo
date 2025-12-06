#!/bin/bash

# Simple script to run all Supabase setup scripts in sequence
# Usage: ./run-all-setup.sh

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================="
echo "Running all Supabase setup scripts..."
echo "========================================="
echo ""

# Run setup scripts in logical order
echo "1/3 Setting up storage trigger..."
supabase db execute --file "$SCRIPT_DIR/setup-storage-trigger.sql"
echo "✓ Storage trigger setup complete"
echo ""

echo "2/3 Setting up automated processing..."
supabase db execute --file "$SCRIPT_DIR/setup-automated-processing.sql"
echo "✓ Automated processing setup complete"
echo ""

echo "3/3 Setting up cron job..."
supabase db execute --file "$SCRIPT_DIR/setup-cron-job.sql"
echo "✓ Cron job setup complete"
echo ""

echo "========================================="
echo "All setup scripts completed successfully!"
echo "========================================="
