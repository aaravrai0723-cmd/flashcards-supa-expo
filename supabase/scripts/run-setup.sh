#!/bin/bash

# Flexible script to run specific Supabase setup scripts
# Usage: ./run-setup.sh [options]

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to display usage
show_help() {
    cat << EOF
Usage: ./run-setup.sh [OPTIONS]

Options:
    --all                   Run all setup scripts
    --storage               Run storage trigger setup
    --processing            Run automated processing setup
    --cron                  Run cron job setup
    --manage-cron           Run cron job management script
    -h, --help              Show this help message

Examples:
    ./run-setup.sh --all
    ./run-setup.sh --storage --cron
    ./run-setup.sh --manage-cron

EOF
    exit 0
}

# Function to run a script
run_script() {
    local script_name=$1
    local description=$2

    echo "Running $description..."
    supabase db execute --file "$SCRIPT_DIR/$script_name"
    echo "✓ $description complete"
    echo ""
}

# Check if no arguments provided
if [ $# -eq 0 ]; then
    show_help
fi

# Parse command line arguments
RUN_STORAGE=false
RUN_PROCESSING=false
RUN_CRON=false
RUN_MANAGE_CRON=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --all)
            RUN_STORAGE=true
            RUN_PROCESSING=true
            RUN_CRON=true
            shift
            ;;
        --storage)
            RUN_STORAGE=true
            shift
            ;;
        --processing)
            RUN_PROCESSING=true
            shift
            ;;
        --cron)
            RUN_CRON=true
            shift
            ;;
        --manage-cron)
            RUN_MANAGE_CRON=true
            shift
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

echo "========================================="
echo "Running Supabase setup scripts..."
echo "========================================="
echo ""

# Run selected scripts
if [ "$RUN_STORAGE" = true ]; then
    run_script "setup-storage-trigger.sql" "Storage trigger setup"
fi

if [ "$RUN_PROCESSING" = true ]; then
    run_script "setup-automated-processing.sql" "Automated processing setup"
fi

if [ "$RUN_CRON" = true ]; then
    run_script "setup-cron-job.sql" "Cron job setup"
fi

if [ "$RUN_MANAGE_CRON" = true ]; then
    run_script "manage-cron-job.sql" "Cron job management"
fi

echo "========================================="
echo "Selected scripts completed successfully!"
echo "========================================="
