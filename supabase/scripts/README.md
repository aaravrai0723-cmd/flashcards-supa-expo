# Supabase Scripts

This folder contains SQL scripts and utilities for setting up and managing your Supabase instance.

## Quick Start

The runner scripts now work with **both local and remote** Supabase instances!

```bash
cd supabase/scripts
./run-all-setup.sh
```

The script will automatically:
- Use local Supabase if running (`supabase start`)
- Or connect to your remote project using `.env.local` credentials

---

## SQL Scripts

### Setup Scripts
- `setup-storage-trigger.sql` - Sets up storage bucket triggers
- `setup-automated-processing.sql` - Configures automated processing workflows
- `setup-cron-job.sql` - Initializes cron job for scheduled tasks

### Management Scripts
- `manage-cron-job.sql` - Utilities for managing cron jobs

## Runner Scripts

The scripts automatically detect and work with both local and remote Supabase instances.

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

### Required for All
- **PostgreSQL client** (`psql`) installed
  - macOS: `brew install postgresql`
  - Ubuntu/Debian: `sudo apt-get install postgresql-client`
  - Windows: Install from [PostgreSQL downloads](https://www.postgresql.org/download/windows/)

### For Remote Projects
- `.env.local` file with:
  - `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
  - `SUPABASE_DB_PASSWORD` - Your database password

### For Local Development
- **Supabase CLI** installed (`npm install -g supabase`)
- **Local Supabase instance** running (`supabase start`)

## Manual Execution

You can also run individual SQL scripts manually:

### Using psql (Recommended)
```bash
# Get the database URL
DB_URL=$(supabase status | grep "DB URL" | awk '{print $3}')

# Run a script
psql "$DB_URL" < supabase/scripts/setup-storage-trigger.sql
```

### Using Supabase Dashboard
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of the SQL file
4. Paste and run in the SQL Editor
