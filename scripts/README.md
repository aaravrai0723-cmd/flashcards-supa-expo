# Scripts Directory

This directory contains utility scripts for setting up and managing the Flashcards app.

## Available Scripts

### 🔐 setup-supabase-secrets.sh

**Purpose**: Automatically sets all required Supabase secrets from your `.env.local` file.

**Usage**:
```bash
# Use default .env.local file
./scripts/setup-supabase-secrets.sh

# Use a custom environment file
./scripts/setup-supabase-secrets.sh .env.production
```

**What it does**:
- Reads environment variables from `.env.local` (or specified file)
- Validates that all required secrets are present
- Sets each secret in Supabase using `supabase secrets set`
- Provides a summary of successful and failed operations

**Required environment variables**:
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `FILE_PROCESSING_WEBHOOK_SECRET` - Webhook authentication secret
- `JOB_WORKER_SECRET` - Worker endpoint authentication secret
- `CRON_SECRET` - Cron trigger authentication secret
- `GOOGLE_AI_API_KEY` (optional) - Google AI API key
- `ANTHROPIC_API_KEY` (optional) - Anthropic API key

**When to use**:
- During initial deployment setup
- When rotating secrets
- When adding new secrets to the project

**Example output**:
```
===============================================
  Supabase Secrets Setup Script
===============================================

Loading environment variables from: .env.local

Checking required environment variables...

✓ OPENAI_API_KEY is set
✓ FILE_PROCESSING_WEBHOOK_SECRET is set
✓ JOB_WORKER_SECRET is set
✓ CRON_SECRET is set

Setting Supabase secrets...

ℹ Setting secret: OPENAI_API_KEY
✓ OPENAI_API_KEY has been set

...

===============================================
✓ All secrets set successfully! (4/4)
===============================================
```

---

### 🌱 seed-manual-instructions.sh

**Purpose**: Displays instructions for manually seeding the database via Supabase Dashboard.

**Usage**:
```bash
./scripts/seed-manual-instructions.sh

# Or via npm
npm run db:seed
```

**What it does**:
- Loads your `.env.local` to get your project reference
- Displays step-by-step instructions for seeding via Supabase Dashboard
- Provides direct links to your project's SQL Editor
- Optionally displays the seed file contents

**When to use**:
- **Recommended method** for database seeding
- When you don't have `psql` installed
- When direct database connections are blocked by your network/firewall
- For first-time setup

**Seed data includes**:
- Grade levels (K-12, College, Graduate, etc.)
- Subjects (Math, Science, Language Arts, Social Studies, etc.)
- Topics within each subject
- Common tags for flashcards
- Sample educational standards (CCSS, NGSS, etc.)

---

### 🗄️ seed-remote-simple.sh

**Purpose**: Seeds the remote database using `psql` command-line tool.

**Usage**:
```bash
./scripts/seed-remote-simple.sh

# Or via npm
npm run db:seed:psql
```

**What it does**:
- Loads environment variables from `.env.local`
- Connects to your remote Supabase database using `psql`
- Executes the `supabase/seed.sql` file
- Handles password encoding and connection string formatting

**Prerequisites**:
- `psql` (PostgreSQL client) must be installed
- `SUPABASE_DB_PASSWORD` must be set in `.env.local`
- Network access to Supabase database (port 5432)

**When to use**:
- When you have `psql` installed and prefer command-line seeding
- For automated CI/CD pipelines
- When you want to seed without using the browser

**Installing psql**:

**macOS**:
```bash
brew install postgresql
```

**Ubuntu/Debian**:
```bash
sudo apt-get install postgresql-client
```

**Windows**:
Download from [postgresql.org](https://www.postgresql.org/download/windows/)

---

### 📝 seed-remote-api.sh

**Purpose**: Seeds the database using Supabase REST API (alternative method).

**Usage**:
```bash
./scripts/seed-remote-api.sh
```

**What it does**:
- Uses the Supabase REST API to insert seed data
- Bypasses the need for direct database connection
- Requires `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`

**When to use**:
- When `psql` is not available
- When direct database connections are blocked
- For programmatic seeding

---

### 🔄 seed-remote.ts

**Purpose**: TypeScript-based seeding script using the Supabase client SDK.

**Usage**:
```bash
npx tsx scripts/seed-remote.ts
```

**What it does**:
- Uses the type-safe Supabase TypeScript client
- Inserts seed data with proper type checking
- Provides detailed error handling

**Prerequisites**:
- `tsx` package (should be installed with dependencies)
- `EXPO_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

**When to use**:
- When you want type-safe seeding
- For custom seeding logic
- In TypeScript-based workflows

---

## Script Selection Guide

Choose the right script for your use case:

| Use Case | Recommended Script | Why? |
|----------|-------------------|------|
| **Initial setup** | `seed-manual-instructions.sh` | Easiest, works everywhere, no dependencies |
| **Have psql installed** | `seed-remote-simple.sh` | Fast, one command |
| **CI/CD pipeline** | `seed-remote-simple.sh` or `seed-remote-api.sh` | Automated, no manual steps |
| **Network restrictions** | `seed-manual-instructions.sh` | Uses Supabase Dashboard (always accessible) |
| **Custom seeding logic** | `seed-remote.ts` | Type-safe, programmable |
| **Setting secrets** | `setup-supabase-secrets.sh` | Automated, validated |

---

### 🔧 trigger-worker.sh

**Purpose**: Manually trigger the worker to process a single queued job.

**Usage**:
```bash
# Set the secret first
export JOB_WORKER_SECRET='your_secret_value_here'

# Trigger the worker
./scripts/trigger-worker.sh
```

**What it does**:
- Calls the production worker-pull function
- Processes one queued job
- Returns the job processing result

**When to use**:
- Testing job processing
- Processing stuck jobs manually
- Debugging job failures

**Prerequisites**:
- `JOB_WORKER_SECRET` environment variable set
- `jq` installed (for JSON parsing)

---

### ⏰ trigger-cron.sh

**Purpose**: Manually trigger the cron function to process multiple queued jobs.

**Usage**:
```bash
# Set the secret first
export CRON_SECRET='your_secret_value_here'

# Process 5 jobs with 1 second delay between each
./scripts/trigger-cron.sh 5 1000

# Process 10 jobs with 500ms delay
./scripts/trigger-cron.sh 10 500
```

**Arguments**:
1. `iterations` - Number of jobs to process (default: 5)
2. `delay_ms` - Delay in milliseconds between jobs (default: 1000)

**What it does**:
- Calls the production cron-tick function
- Processes multiple jobs sequentially
- Returns a summary of all processed jobs

**When to use**:
- Processing multiple queued jobs at once
- Clearing the job queue
- Batch processing after deployments

**Prerequisites**:
- `CRON_SECRET` environment variable set
- `jq` installed (for JSON parsing)

---

## Getting Secret Values

To get the actual secret values (not just hashes):

**Option 1: From your environment file**
```bash
cat .env.local | grep -E "JOB_WORKER_SECRET|CRON_SECRET"
```

**Option 2: Regenerate and update**
```bash
# Generate new secret
NEW_SECRET=$(openssl rand -hex 32)

# Set it in Supabase
npx supabase secrets set JOB_WORKER_SECRET="$NEW_SECRET"

# Use it locally
export JOB_WORKER_SECRET="$NEW_SECRET"

# Save to env file
echo "JOB_WORKER_SECRET=$NEW_SECRET" >> .env.local
```

**Note:** Supabase CLI's `secrets list` command only shows hashes, not actual values. You need to store the actual values in your local `.env.local` file when you first set them.

---

## Common Issues

### Script Permission Denied

If you get a "permission denied" error:

```bash
chmod +x scripts/*.sh
```

### psql: command not found

Install PostgreSQL client tools (see "Installing psql" above).

### Database Connection Failed

1. Check your `SUPABASE_DB_PASSWORD` in `.env.local`
2. Verify network connectivity to Supabase
3. Use `seed-manual-instructions.sh` as a fallback

### Environment Variables Not Loading

Ensure `.env.local` exists in the project root and contains all required variables.

---

## Adding New Scripts

When adding new scripts to this directory:

1. Make the script executable: `chmod +x scripts/your-script.sh`
2. Add a header comment explaining what the script does
3. Include usage examples in comments
4. Update this README with the new script information
5. Add an npm script in `package.json` if appropriate

**Example header format**:

```bash
#!/bin/bash
# Brief description of what this script does
#
# Usage:
#   ./scripts/your-script.sh [options]
#
# Prerequisites:
#   - List any requirements
#
# Examples:
#   ./scripts/your-script.sh --option value

set -e  # Exit on error
```

---

## Related Documentation

- [Complete Setup Guide](../docs/SETUP.md) - Full setup instructions
- [Main README](../README.md) - Project overview
- [Functions Guide](../apps/functions/README.md) - Edge Functions documentation
- [Environment Variables Guide](../README.md#environment-setup) - Environment configuration

---

## Support

If you encounter issues with any script:

1. Check the error message for specific guidance
2. Verify all required environment variables are set
3. Review the [Troubleshooting section](../docs/SETUP.md#troubleshooting) in the setup guide
4. Check that you have the necessary permissions and dependencies

For `setup-supabase-secrets.sh` issues:
- Verify you're logged in to Supabase CLI: `npx supabase login`
- Verify your project is linked: `npx supabase link --project-ref YOUR_REF`
- Check secrets were set: `npx supabase secrets list`

For seeding issues:
- Use `seed-manual-instructions.sh` as the most reliable method
- Verify the `supabase/seed.sql` file exists and is valid SQL
- Check database logs in Supabase Dashboard for specific errors

For trigger-worker.sh / trigger-cron.sh issues:
- **"Error: JOB_WORKER_SECRET environment variable is not set"**: Export the secret value: `export JOB_WORKER_SECRET='your_secret'`
- **"HTTP Status: 401"**: The secret value is incorrect - check `.env.local` for the actual value (not the hash from `npx supabase secrets list`)
- **"HTTP Status: 503"**: The function is failing - check function logs in Supabase Dashboard > Edge Functions > Logs
- **Jobs not processing**: Verify job input data has correct fields (`storage_path`, `mime_type`, `owner`) by running SQL: `SELECT input FROM jobs WHERE id = X;`
