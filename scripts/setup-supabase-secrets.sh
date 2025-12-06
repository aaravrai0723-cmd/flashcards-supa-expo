#!/bin/bash

# Script to set Supabase secrets from .env.local file
# This script reads the required environment variables and sets them as Supabase secrets

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to load .env file (supports being run from any directory)
load_env() {
    local env_file="$1"

    if [ ! -f "$env_file" ]; then
        print_error "Environment file not found: $env_file"
        exit 1
    fi

    print_info "Loading environment variables from: $env_file"

    # Export variables from .env file. Using 'source' here handles quoted values and spaces.
    set -a
    # shellcheck source=/dev/null
    source "$env_file"
    set +a
}

# Function to check if a variable is set
check_var() {
    local var_name="$1"
    local var_value="${!var_name}"

    if [ -z "$var_value" ]; then
        print_warning "$var_name is not set or empty"
        return 1
    else
        print_success "$var_name is set"
        return 0
    fi
}

# Function to set Supabase secret
set_secret() {
    local secret_name="$1"
    local secret_value="$2"

    if [ -z "$secret_value" ]; then
        print_warning "Skipping $secret_name (value is empty)"
        return 1
    fi

    print_info "Setting secret: $secret_name"

    if npx supabase secrets set "$secret_name=$secret_value"; then
        print_success "$secret_name has been set"
        return 0
    else
        print_error "Failed to set $secret_name"
        return 1
    fi
}

# Main script
main() {
    echo ""
    print_info "==============================================="
    print_info "  Supabase Secrets Setup Script"
    print_info "==============================================="
    echo ""

    # Resolve repo root (script can be run from anywhere)
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

    # Determine which .env file to use
    ENV_FILE="${1:-$REPO_ROOT/.env.local}"

    # If user passed a relative path, resolve it from repo root for convenience
    if [ ! -f "$ENV_FILE" ] && [ -f "$REPO_ROOT/$ENV_FILE" ]; then
        ENV_FILE="$REPO_ROOT/$ENV_FILE"
    fi

    if [ ! -f "$ENV_FILE" ]; then
        print_error "Environment file not found: $ENV_FILE"
        print_info "Usage: $0 [path-to-env-file]"
        print_info "Example: $0 .env.local"
        exit 1
    fi

    # Load environment variables
    load_env "$ENV_FILE"

    echo ""
    print_info "Checking required environment variables..."
    echo ""

    # Track success/failure
    all_vars_set=true

    # Check all required variables
    check_var "OPENAI_API_KEY" || all_vars_set=false
    check_var "FILE_PROCESSING_WEBHOOK_SECRET" || all_vars_set=false
    check_var "JOB_WORKER_SECRET" || all_vars_set=false
    check_var "CRON_SECRET" || all_vars_set=false

    echo ""

    if [ "$all_vars_set" = false ]; then
        print_warning "Some required variables are missing. The script will continue with available variables."
        echo ""
        read -p "Do you want to continue? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Setup cancelled."
            exit 0
        fi
    fi

    echo ""
    print_info "Setting Supabase secrets..."
    echo ""

    # Set secrets in Supabase
    success_count=0
    fail_count=0

    if set_secret "OPENAI_API_KEY" "$OPENAI_API_KEY"; then
        ((success_count++))
    else
        ((fail_count++))
    fi

    if set_secret "FILE_PROCESSING_WEBHOOK_SECRET" "$FILE_PROCESSING_WEBHOOK_SECRET"; then
        ((success_count++))
    else
        ((fail_count++))
    fi

    if set_secret "JOB_WORKER_SECRET" "$JOB_WORKER_SECRET"; then
        ((success_count++))
    else
        ((fail_count++))
    fi

    if set_secret "CRON_SECRET" "$CRON_SECRET"; then
        ((success_count++))
    else
        ((fail_count++))
    fi

    # Optional: Set other provider keys if present
    if [ -n "$GOOGLE_AI_API_KEY" ]; then
        if set_secret "GOOGLE_AI_API_KEY" "$GOOGLE_AI_API_KEY"; then
            ((success_count++))
        else
            ((fail_count++))
        fi
    fi

    if [ -n "$ANTHROPIC_API_KEY" ]; then
        if set_secret "ANTHROPIC_API_KEY" "$ANTHROPIC_API_KEY"; then
            ((success_count++))
        else
            ((fail_count++))
        fi
    fi

    echo ""
    print_info "==============================================="
    if [ $fail_count -eq 0 ]; then
        print_success "All secrets set successfully! ($success_count/$success_count)"
    else
        print_warning "Setup completed with errors: $success_count succeeded, $fail_count failed"
    fi
    print_info "==============================================="
    echo ""

    # Show next steps
    print_info "Next steps:"
    echo "  1. Verify secrets with: npx supabase secrets list"
    echo "  2. Deploy Edge Functions: npx supabase functions deploy"
    echo "  3. Set up the cron job for automated processing (see README.md)"
    echo ""
}

# Run main function
main "$@"
