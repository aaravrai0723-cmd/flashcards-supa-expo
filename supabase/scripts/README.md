# Supabase Scripts

This folder contains SQL scripts and utilities for setting up and managing your Supabase instance.

## SQL Scripts

### Setup Scripts
- `setup-storage-trigger.sql` - Sets up storage bucket triggers
- `setup-automated-processing.sql` - Configures automated processing workflows
- `setup-cron-job.sql` - Initializes cron job for scheduled tasks

### Management Scripts
- `manage-cron-job.sql` - Utilities for managing cron jobs

## Runner Scripts

### Quick Setup (run-all-setup.sh)
Runs all setup scripts in the correct order:

```bash
cd supabase/scripts
./run-all-setup.sh
```

### Flexible Setup (run-setup.sh)
Run specific scripts as needed:

```bash
# Run all setup scripts
./run-setup.sh --all

# Run specific scripts
./run-setup.sh --storage
./run-setup.sh --processing
./run-setup.sh --cron

# Run management script
./run-setup.sh --manage-cron

# Combine multiple options
./run-setup.sh --storage --cron

# Show help
./run-setup.sh --help
```

## Prerequisites

Make sure you have:
- Supabase CLI installed
- Local Supabase instance running (`supabase start`)
- Or connected to a remote Supabase project (`supabase link`)

## Manual Execution

You can also run individual SQL scripts manually:

```bash
supabase db execute --file supabase/scripts/setup-storage-trigger.sql
```
