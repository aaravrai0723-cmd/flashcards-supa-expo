# Complete Setup Guide

This comprehensive guide walks you through setting up the Flashcards app from scratch. Follow these steps in order to get everything running.

> 🆕 **Starting over with a brand-new Supabase project?** This guide already covers every required step (project creation, linking, migrations, secrets, storage trigger, function deploys). Only reach for the optional repair scripts under [`fixes/`](../fixes) if you’re troubleshooting an existing deployment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Project Setup](#initial-project-setup)
3. [Supabase Project Setup](#supabase-project-setup)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Edge Functions Deployment](#edge-functions-deployment)
7. [Storage Trigger Setup](#storage-trigger-setup)
8. [Job Processing Setup](#job-processing-setup)
9. [OAuth Setup (Optional)](#oauth-setup-optional)
10. [Mobile App Development](#mobile-app-development)
11. [Testing the System](#testing-the-system)
12. [Troubleshooting](#troubleshooting)
13. [Known Issues & Fixes](#known-issues--fixes)

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Node.js** 18+ (LTS recommended)
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify installation: `node --version`

- **npm** (comes with Node.js) or **pnpm** 8+
  - npm is included with Node.js
  - For pnpm: `npm install -g pnpm`

**Important**: The mobile app requires `@supabase/supabase-js` v2.86.0 or later to avoid storage upload issues. This is automatically installed when you run `npm install`.

- **Git** (for cloning the repository)
  - Download from [git-scm.com](https://git-scm.com/)
  - Verify installation: `git --version`

- **Supabase CLI** (for database management)
  ```bash
  npm install -g supabase
  ```
  - Verify installation: `supabase --version`

- **Expo CLI** (for mobile development)
  ```bash
  npm install -g expo-cli
  ```
  - Verify installation: `expo --version`

### Required Accounts

- **Supabase Account** - Sign up at [supabase.com](https://supabase.com/)
- **OpenAI Account** (for AI features) - Sign up at [platform.openai.com](https://platform.openai.com/)
- **Google Cloud Account** (optional, for Google OAuth)
- **Apple Developer Account** (optional, for Apple Sign In)

### Development Environment

- **iOS Development** (macOS only):
  - Xcode (latest version from App Store)
  - Xcode Command Line Tools: `xcode-select --install`
  - iOS Simulator

- **Android Development**:
  - Android Studio (download from [developer.android.com](https://developer.android.com/studio))
  - Android SDK and emulator configured

---

## Initial Project Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone <repository-url>
cd flashcards-supa-expo

# Or if you already have it cloned, navigate to the directory
cd flashcards-supa-expo
```

### 2. Install Dependencies

```bash
# Install all dependencies (mobile app, SDK, and functions)
npm install

# Or using pnpm
pnpm install

# Or using bun
bun install
```

This will install dependencies for:
- The mobile app (`apps/mobile`)
- The SDK package (`packages/sdk`)
- The root workspace

**Note**: The installation might take a few minutes depending on your internet connection.

---

## Supabase Project Setup

### 1. Create a Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in the project details:
   - **Organization**: Select or create an organization
   - **Name**: `flashcards-app` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest region to your users
   - **Pricing Plan**: Free tier works for development
4. Click **"Create new project"**
5. Wait for the project to be provisioned (takes ~2 minutes)

### 2. Note Down Your Project Information

Once your project is ready, you'll need these values:

- **Project Reference**: Found in the URL (e.g., `xzpyvvkqfnurbxqwcyrx`)
- **Project URL**: `https://YOUR_PROJECT_REF.supabase.co`
- **API Keys**: Found in **Settings > API**
  - `anon/public` key (safe to use client-side)
  - `service_role` key (keep secret, server-side only)
- **Database Password**: The password you set during project creation

### 3. Link Your Local Project to Supabase

```bash
# Link to your Supabase project
npx supabase link --project-ref YOUR_PROJECT_REF

# You'll be prompted to enter your database password
```

Replace `YOUR_PROJECT_REF` with your actual project reference.

---

## Environment Configuration

### 1. Create Environment File

```bash
# Copy the example environment file
cp .env.example .env.local
```

### 2. Get Supabase Keys

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings > API**
4. Copy the following:
   - **Project URL** (e.g., `https://xzpyvvkqfnurbxqwcyrx.supabase.co`)
   - **anon/public key** (under "Project API keys")
   - **service_role key** (under "Project API keys" - keep this secret!)

### 3. Get Database Password

- If you saved it during project creation, use that
- If not, go to **Settings > Database** and reset the password

### 4. Generate Security Secrets

Generate three random secrets for function authentication:

```bash
# Generate all three secrets
openssl rand -base64 32  # For FILE_PROCESSING_WEBHOOK_SECRET
openssl rand -base64 32  # For JOB_WORKER_SECRET
openssl rand -base64 32  # For CRON_SECRET
```

Copy each output and use them in the next step.

### 5. Get OpenAI API Key

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click **"Create new secret key"**
4. Give it a name (e.g., "Flashcards App")
5. Copy the key immediately (you won't see it again)

### 6. Configure .env.local

Edit `.env.local` with your actual values:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_from_dashboard
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_from_dashboard

# Database Password
SUPABASE_DB_PASSWORD=your_database_password

# Function Security Secrets (generated above)
FILE_PROCESSING_WEBHOOK_SECRET=your_generated_secret_1
JOB_WORKER_SECRET=your_generated_secret_2
CRON_SECRET=your_generated_secret_3

# AI Provider Configuration
VISION_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key
```

**Important**: Never commit `.env.local` to git - it's already in `.gitignore`.

---

## Database Setup

### 1. Apply Database Migrations

Apply all database migrations to set up the schema:

```bash
# Push migrations to your Supabase database
npx supabase db push
```

This will create all the necessary tables:
- `users` - User profiles
- `decks` - Flashcard decks
- `cards` - Individual flashcards
- `media_assets` - Uploaded images/videos/PDFs
- `jobs` - Background job queue
- `quizzes` - Quiz sessions
- `subjects`, `topics`, `grade_levels`, `standards`, `tags` - Educational taxonomy

### 2. Verify Migrations

Check that all migrations were applied successfully:

```bash
# Check migration status
npx supabase migration list
```

You should see all migrations marked as applied.

### 3. Seed Initial Data (Optional)

Seed the database with starter data (subjects, grade levels, tags):

```bash
# This will show instructions for manual seeding
npm run db:seed
```

Follow the instructions to:
1. Go to your Supabase SQL Editor
2. Paste the seed SQL
3. Run the query

**Alternative** (if you have `psql` installed):
```bash
npm run db:seed:psql
```

### 4. Generate TypeScript Types

Generate TypeScript types from your database schema:

```bash
# Generate types from remote database
npm run gen:types
```

This creates type definitions at `packages/sdk/src/types/database.ts`.

**Important**: Re-run this command whenever you change the database schema.

---

## Local Supabase (Development)

- **Start services**: `supabase start` (runs Docker locally; does not create a new Supabase project)
- **Apply schema locally**: `npm run db:push`
- **Seed sample data (optional)**: `npm run db:seed`
- Scripts and setup tools auto-prefer the local instance when it is running; otherwise they use the remote project defined in `.env.local`.

---

## Edge Functions Deployment

Edge Functions handle background processing (AI analysis, card generation, etc.).

### 1. Set Supabase Secrets

Use the automated script to set all secrets from your `.env.local`:

```bash
# Make the script executable (first time only)
chmod +x ./scripts/setup-supabase-secrets.sh

# Run the setup script
./scripts/setup-supabase-secrets.sh
```

The script will:
- Read your `.env.local` file
- Validate all required secrets
- Set them in Supabase
- Show a summary

**Verify secrets were set:**
```bash
npx supabase secrets list
```

You should see:
- `OPENAI_API_KEY`
- `FILE_PROCESSING_WEBHOOK_SECRET`
- `JOB_WORKER_SECRET`
- `CRON_SECRET`

### 2. Deploy Edge Functions

Deploy all Edge Functions to Supabase:

```bash
# Deploy all functions
npx supabase functions deploy
```

This deploys:
- `ingest-webhook` - Handles file uploads
- `worker-pull` - Processes jobs
- `cron-tick` - Scheduled job trigger
- `health` - Health monitoring
- `monitoring` - Metrics and alerts

**Functions will be available at:**
- `https://YOUR_PROJECT_REF.supabase.co/functions/v1/ingest-webhook`
- `https://YOUR_PROJECT_REF.supabase.co/functions/v1/worker-pull`
- `https://YOUR_PROJECT_REF.supabase.co/functions/v1/cron-tick`
- `https://YOUR_PROJECT_REF.supabase.co/functions/v1/health`
- `https://YOUR_PROJECT_REF.supabase.co/functions/v1/monitoring`

### 3. Configure Storage Trigger

Set up automatic job creation when files are uploaded using a database trigger:

1. Go to your [Supabase SQL Editor](https://supabase.com/dashboard)
2. Select your project → **SQL Editor** → **New query**
3. Open the file `supabase/scripts/setup-storage-trigger.sql` in your code editor
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** or press Cmd+Enter (no placeholders to replace!)

**What this does:**
- Creates a database trigger on the `storage.objects` table
- Automatically creates jobs in the `jobs` table when files are uploaded to the `ingest` bucket
- Determines the job type based on file mime type (image, video, PDF)
- More reliable than webhooks - no HTTP calls, no secrets needed

**Verify the trigger was created:**
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_storage_object_created';
```

You should see one row with the trigger information.

**Note:** This is actually better than Storage Webhooks because:
- ✅ Works on all Supabase plans
- ✅ No webhook secrets to manage
- ✅ More reliable (no HTTP calls that can fail)
- ✅ Faster (direct database insert)

### 4. Set Up Automated Job Processing

Enable automatic job processing every minute using pg_cron:

1. Go to **SQL Editor** in Supabase Dashboard
2. Create a new query
3. Paste the following SQL (replace placeholders):

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- Schedule job processing every minute
SELECT cron.schedule(
  'process-flashcard-jobs',
  '* * * * *',
  $$
  SELECT net.http_post(
    'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cron-tick',
    '{"iterations": 5, "delay": 1000}',
    headers:='{"Authorization": "Bearer YOUR_CRON_SECRET", "Content-Type": "application/json"}'::jsonb
  );
  $$
);
```

4. Replace:
   - `YOUR_PROJECT_REF` with your actual project reference
   - `YOUR_CRON_SECRET` with your actual `CRON_SECRET` from `.env.local`
5. Click **Run**

**Verify the cron job:**
```sql
SELECT * FROM cron.job;
```

You should see your `process-flashcard-jobs` scheduled.

### 5. Test Edge Functions

Test that everything is working:

```bash
# Test health check
curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/health

# Test detailed health
curl "https://YOUR_PROJECT_REF.supabase.co/functions/v1/health?type=detailed"
```

Replace `YOUR_PROJECT_REF` with your actual project reference.

---

## Storage Trigger Setup

The storage trigger automatically creates processing jobs when files are uploaded to the 'ingest' bucket. This is a **critical step** for the image processing pipeline to work.

### Why It's Important

Without the storage trigger:
- Uploaded files won't be processed automatically
- No jobs will be created in the queue
- AI features won't work

### Setup Steps

1. **Open Supabase SQL Editor**:
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Navigate to **SQL Editor** (left sidebar)

2. **Run the Trigger SQL**:
   - Open the file `supabase/scripts/setup-storage-trigger.sql` in your code editor
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click **Run** (or press Cmd+Enter / Ctrl+Enter)

   **Alternative - Use runner script**:
   ```bash
   cd supabase/scripts
   ./run-setup.sh --storage
   ```

3. **Verify the Trigger Was Created**:
   ```sql
   SELECT trigger_name, event_object_table, action_statement
   FROM information_schema.triggers
   WHERE trigger_name = 'on_storage_object_created';
   ```

   You should see one row with:
   - `trigger_name`: `on_storage_object_created`
   - `event_object_table`: `objects`
   - `action_statement`: The function that creates jobs

### What the Trigger Does

When a file is uploaded to the 'ingest' bucket:

1. Extracts file information (path, mime type, size)
2. Extracts user ID from the file path (format: `{user_id}/filename.jpg`)
   - Uses `storage.foldername()` function to parse the path
   - More reliable than `NEW.owner` which Supabase doesn't populate automatically
3. Determines job type based on mime type:
   - `image/*` → `ingest_image`
   - `video/*` → `ingest_video`
   - `application/pdf` → `ingest_pdf`
4. Creates an `ingest_files` record
5. Creates a job in the `jobs` table with status "queued"

### Important Notes

- **Correct bucket**: Only triggers for uploads to the `ingest` bucket
- **File path format**: Files must be uploaded with paths like `{user_id}/filename.jpg`
- **User ID extraction**: Automatically extracts user ID from the file path
- **Field names**: Uses snake_case (`storage_path`, `mime_type`, `owner`)
- **Automatic**: No manual intervention needed once set up
- **RLS enforcement**: The storage RLS policies ensure users can only upload to their own folder

### Troubleshooting

**Trigger not working?**

```sql
-- Check if trigger exists
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'on_storage_object_created';

-- Check if function exists
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'create_job_on_file_upload';
```

**Jobs not being created?**

1. Verify you're uploading to the `ingest` bucket (not `media` or `derived`)
2. Check storage.objects table:
   ```sql
   SELECT id, name, bucket_id, created_at
   FROM storage.objects
   WHERE bucket_id = 'ingest'
   ORDER BY created_at DESC
   LIMIT 5;
   ```
3. Check jobs table:
   ```sql
   SELECT id, type, status, created_at, input
   FROM jobs
   ORDER BY created_at DESC
   LIMIT 5;
   ```

---

## Job Processing Setup

After files are uploaded and jobs are created, you need a way to process them. There are two options:

### Option 1: Automated Processing with pg_cron (Recommended)

Set up automatic job processing that runs every minute:

1. **Enable Required Extensions** (run in SQL Editor):
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   CREATE EXTENSION IF NOT EXISTS http;
   ```

2. **Create the Cron Job** (run in SQL Editor):
   ```sql
   SELECT cron.schedule(
     'process-flashcard-jobs',        -- Job name
     '* * * * *',                      -- Every minute
     $$
     SELECT net.http_post(
       'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cron-tick',
       '{"iterations": 5, "delay": 1000}',
       headers:='{"Authorization": "Bearer YOUR_CRON_SECRET", "Content-Type": "application/json"}'::jsonb
     );
     $$
   );
   ```

   **Replace**:
   - `YOUR_PROJECT_REF` → Your Supabase project reference
   - `YOUR_CRON_SECRET` → Your actual `CRON_SECRET` from `.env.local`

3. **Verify Cron Job**:
   ```sql
   SELECT jobid, jobname, schedule, active
   FROM cron.job
   WHERE jobname = 'process-flashcard-jobs';
   ```

### Option 2: Manual Processing (For Testing)

Process jobs manually using the provided scripts:

```bash
# Set up environment variables
export JOB_WORKER_SECRET='your_secret_from_env_local'
export SUPABASE_SERVICE_ROLE_KEY='your_service_role_key_from_env_local'

# Process one job
./scripts/trigger-worker.sh

# Process multiple jobs
./scripts/trigger-cron.sh 5 1000
```

### Testing Job Processing

1. **Upload a Test Image**:
   - Use your mobile app or upload directly to the `ingest` bucket
   - File path format: `{user_id}/{filename}`

2. **Check Job Was Created**:
   ```sql
   SELECT id, type, status, input, created_at
   FROM jobs
   ORDER BY created_at DESC
   LIMIT 1;
   ```

   Should show:
   - `type`: "ingest_image"
   - `status`: "queued"
   - `input`: Has `storage_path`, `mime_type`, `owner`

3. **Wait for Processing** (if using pg_cron) or **Trigger Manually**:
   ```bash
   ./scripts/trigger-worker.sh
   ```

4. **Verify Results**:
   ```sql
   -- Check job completed
   SELECT id, type, status, result, error
   FROM jobs
   WHERE status = 'done'
   ORDER BY updated_at DESC
   LIMIT 1;

   -- Check media asset created
   SELECT id, type, storage_path, alt_text
   FROM media_assets
   ORDER BY created_at DESC
   LIMIT 1;

   -- Check card created
   SELECT id, prompt_text, answer_text, is_active
   FROM cards
   WHERE is_active = false  -- Draft cards
   ORDER BY created_at DESC
   LIMIT 1;
   ```

### What Should Happen

When a job is processed successfully:

1. **Media Asset**: Created in `media_assets` table with:
   - Storage path
   - AI-generated description
   - Metadata (dimensions, format, etc.)

2. **Thumbnail**: Generated and stored in `derived` bucket

3. **Draft Card**: Created in `cards` table with:
   - `is_active = false` (needs user approval)
   - AI-generated prompt and answer
   - Link to media asset

4. **Job Status**: Updated to "done" with result data

### Troubleshooting Job Processing

**Jobs stuck in "queued"?**
- Check pg_cron is running: `SELECT * FROM cron.job;`
- Manually trigger: `./scripts/trigger-worker.sh`
- Check function logs in Supabase Dashboard

**Jobs failing with errors?**
```sql
SELECT id, type, error, updated_at
FROM jobs
WHERE status = 'failed'
ORDER BY updated_at DESC;
```

Common issues:
- OpenAI API key invalid or no credit
- Storage path doesn't exist
- Missing owner field (fixed in latest version)

**See [Troubleshooting](#troubleshooting) section below for more details.**

---

## OAuth Setup (Optional)

If you want to enable Google and Apple authentication, follow the detailed guide:

📄 **See [docs/OAUTH_SETUP.md](./OAUTH_SETUP.md)** for complete instructions.

**Quick Summary:**

### Google OAuth
1. Create project in Google Cloud Console
2. Configure OAuth consent screen
3. Create OAuth 2.0 credentials
4. Add redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
5. Enable Google provider in Supabase Dashboard (Authentication > Providers)

### Apple Sign In
1. Enable Sign In with Apple in Apple Developer Portal
2. Create Service ID
3. Generate private key (.p8 file)
4. Configure in Supabase Dashboard (Authentication > Providers)

---

## Mobile App Development

### 0. Prepare Mobile Environment

From the repo root, copy the example env so Expo can read values when you run inside `apps/mobile`:

```bash
cp .env.example .env.local
cp .env.example apps/mobile/.env
```

### 1. Install Expo Go (Optional)

For testing on real devices:

- **iOS**: Install [Expo Go](https://apps.apple.com/app/expo-go/id982107779) from App Store
- **Android**: Install [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) from Play Store

### 2. Start Development Server

```bash
# Start the mobile app
npm run dev

# Or specifically for mobile
npm run dev:mobile

# Or with tunnel mode (required for OAuth authentication)
npm run dev:tunnel
```

This will start the Expo development server.

#### 🔐 When to Use Tunnel Mode

**Use tunnel mode (`npm run dev:tunnel`) when:**
- Testing OAuth authentication (Google, Apple Sign In)
- Testing on physical devices that aren't on the same network
- You need a stable, publicly accessible URL for OAuth redirects
- Testing deep links and redirect URLs

**Use standard mode (`npm run dev`) when:**
- Doing general development work
- Testing on emulators/simulators
- Not testing authentication flows

#### Why Tunnel Mode is Required for OAuth

OAuth providers (Google, Apple) require **exact redirect URL matches**. When you configure OAuth:

1. **Without tunnel**: Your app URL changes every time (e.g., `exp://192.168.1.5:8081`)
   - ❌ Can't configure a stable redirect URL
   - ❌ OAuth providers reject mismatched URLs
   - ❌ Authentication will fail

2. **With tunnel**: You get a stable ngrok URL (e.g., `https://abc123.ngrok.io`)
   - ✅ Configure this URL in OAuth provider settings
   - ✅ URL stays the same across sessions
   - ✅ Authentication works correctly

#### Setting Up OAuth with Tunnel Mode

**Step 1: Start in tunnel mode**
```bash
npm run dev:tunnel
```

Wait for the tunnel URL to appear (e.g., `https://abc123.ngrok.io`)

**Step 2: Configure OAuth redirect URLs**

For your Supabase project, the redirect URL is:
```
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

This stays the same and is already configured in your OAuth providers.

**Step 3: Update mobile app deep link (if needed)**

The mobile app needs to handle the OAuth callback. With tunnel mode, Expo handles this automatically through the tunnel URL.

**Step 4: Test OAuth flow**

1. Open your app via the tunnel URL
2. Tap "Sign in with Google" or "Sign in with Apple"
3. Complete authentication in the browser/system dialog
4. You'll be redirected back to the app
5. Verify you're signed in

#### Troubleshooting Tunnel Mode

**Tunnel not starting?**
- Check your internet connection
- Try clearing Expo cache: `cd apps/mobile && npx expo start -c --tunnel`
- Update Expo CLI: `npm install -g expo-cli`

**OAuth still not working?**
- Verify redirect URLs match exactly in OAuth provider settings
- Check that OAuth is enabled in Supabase Dashboard
- See detailed guide: [docs/OAUTH_SETUP.md](./OAUTH_SETUP.md)

**Tunnel URL keeps changing?**
- This is normal - ngrok generates a new URL each time
- For production, use a custom domain with Expo EAS
- For development, update OAuth settings if the tunnel URL changes

### 3. Open the App

You have several options:

**Option A: Expo Go (easiest)**
1. Open Expo Go on your device
2. Scan the QR code from the terminal
3. App will load on your device

**Option B: iOS Simulator** (macOS only)
```bash
# Press 'i' in the terminal after starting dev server
# Or run:
cd apps/mobile
npx expo start --ios
```

**Option C: Android Emulator**
```bash
# Press 'a' in the terminal after starting dev server
# Or run:
cd apps/mobile
npx expo start --android
```

**Option D: Web Browser**
```bash
# Press 'w' in the terminal
# Or run:
cd apps/mobile
npx expo start --web
```

### 4. App Features to Test

- **Authentication**: Sign in with email (magic link), Google, or Apple
- **Deck Creation**: Create a new flashcard deck
- **Card Management**: Add cards manually
- **Media Upload**: Upload an image to auto-generate cards
- **Quiz Mode**: Practice with your flashcards
- **AI Generation**: Let AI create cards from images

---

## Testing the System

### End-to-End Test

Follow these steps to verify everything is working:

#### 1. Test Authentication

1. Open the mobile app
2. Sign in with email or OAuth
3. Verify you're logged in successfully

#### 2. Test Manual Card Creation

1. Create a new deck
2. Add a card manually with:
   - Front: "What is the capital of France?"
   - Back: "Paris"
3. Save the card
4. Verify it appears in the deck

#### 3. Test AI-Powered Card Generation

1. Create or select a deck
2. Upload an image (e.g., a photo of text, a diagram, or educational content)
3. Wait for processing (should take 5-30 seconds)
4. Check the job status:
   ```sql
   SELECT * FROM jobs ORDER BY created_at DESC LIMIT 5;
   ```
5. Verify a media asset was created:
   ```sql
   SELECT * FROM media_assets ORDER BY created_at DESC LIMIT 5;
   ```
6. Check for generated cards (initially inactive):
   ```sql
   SELECT * FROM cards WHERE is_active = false ORDER BY created_at DESC LIMIT 5;
   ```
7. Review and activate the AI-generated cards in the app

#### 4. Test Job Processing

Monitor the job processing system:

```sql
-- Check job queue status
SELECT
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest
FROM jobs
GROUP BY status;

-- View recent jobs
SELECT
  id,
  type,
  status,
  created_at,
  updated_at,
  error
FROM jobs
ORDER BY created_at DESC
LIMIT 10;
```

#### 5. Test Health Monitoring

```bash
# Check system health
curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/health

# Check queue health
curl "https://YOUR_PROJECT_REF.supabase.co/functions/v1/health?type=queue"

# View metrics
curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/monitoring/metrics
```

---

## Troubleshooting

### Common Issues

#### 1. "Supabase not linked" Error

**Problem**: Running commands fails with "Project ref is not linked"

**Solution**:
```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

#### 2. Database Migration Errors

**Problem**: `npx supabase db push` fails

**Solution**:
- Check your database password in `.env.local`
- Ensure you're connected to the internet
- Try resetting the database password in Supabase Dashboard
- Check migration files for syntax errors

#### 3. Type Generation Fails

**Problem**: `npm run gen:types` fails

**Solution**:
```bash
# Ensure you're linked to Supabase
npx supabase link --project-ref YOUR_PROJECT_REF

# Try generating from local instead
npm run gen:types:local

# Or regenerate manually
supabase gen types typescript --linked > packages/sdk/src/types/database.ts
```

#### 4. Edge Functions Not Deploying

**Problem**: Deployment fails or functions return errors

**Solution**:
- Ensure all secrets are set: `npx supabase secrets list`
- Check function logs: `npx supabase functions logs ingest-webhook`
- Verify your OpenAI API key is valid
- Check for any syntax errors in function code

#### 5. Jobs Not Processing

**Problem**: Uploaded files don't create jobs or jobs stay in "queued" status

**Solution**:

**Check storage webhook:**
- Go to Storage > Settings > Webhooks in Supabase Dashboard
- Verify webhook URL is correct
- Verify webhook secret matches `FILE_PROCESSING_WEBHOOK_SECRET`

**Check cron job:**
```sql
-- View cron jobs
SELECT * FROM cron.job;

-- Check cron job runs
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

**Manually trigger processing:**
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/worker-pull \
  -H "Authorization: Bearer YOUR_JOB_WORKER_SECRET"
```

#### 6. OpenAI API Errors

**Problem**: Jobs fail with OpenAI-related errors

**Solution**:
- Verify your OpenAI API key is valid
- Check you have credits in your OpenAI account
- Review function logs for specific error messages:
  ```bash
  npx supabase functions logs worker-pull
  ```

#### 7. Mobile App Won't Start

**Problem**: `npm run dev` fails

**Solution**:
```bash
# Clear cache and reinstall
npm run clean
npm install

# Clear Expo cache
cd apps/mobile
npx expo start -c
```

#### 8. Environment Variables Not Loading

**Problem**: App can't connect to Supabase

**Solution**:
- Ensure `.env.local` exists in the project root
- Check variable names match exactly (case-sensitive)
- Restart the development server after changing `.env.local`
- For mobile app, environment variables must start with `EXPO_PUBLIC_`

#### 9. Row Level Security (RLS) Errors

**Problem**: Database queries fail with "permission denied"

**Solution**:
- Ensure you're authenticated in the app
- Check RLS policies in Supabase Dashboard (Authentication > Policies)
- Verify user IDs match in the database
- For testing, you can temporarily disable RLS (not recommended for production)

#### 10. OAuth Not Working

**Problem**: OAuth sign-in fails or redirects incorrectly

**Solution**:
- Verify redirect URIs match exactly in OAuth provider settings
- Check OAuth credentials are set correctly in Supabase
- See detailed troubleshooting in [docs/OAUTH_SETUP.md](./OAUTH_SETUP.md)

#### 11. Storage Upload Owner Type Error

**Problem**: File uploads fail with error: `column "owner" is of type uuid but expression is of type text`

**Solution**:
```bash
# Update Supabase client to latest version
cd apps/mobile
npm install @supabase/supabase-js@latest

# Run the SQL fix script in Supabase Dashboard > SQL Editor
# Copy and paste contents of: fixes/sql/fix-storage-owner-issue.sql

# Restart your development server
npm run dev
```

**Root Cause**: Older versions of `@supabase/supabase-js` (< v2.86.0) had a bug where the storage owner field was set as TEXT instead of UUID.

**Verification**:
- Try uploading a file through the mobile app
- Should complete without UUID type errors
- Check `storage.objects` table to verify owner is set correctly

---

## Known Issues & Fixes

This section documents issues that have been fixed and how to verify they're resolved in your deployment.

### Image Processing Job Pipeline (Fixed Nov 27, 2025)

**Issue**: Jobs were failing with 503 errors, "BOOT_ERROR", or stuck in "queued" status.

**Root Causes**:
1. Import errors - missing utility functions
2. Bucket mismatch - reading from wrong storage bucket
3. Field name mismatch - trigger using camelCase vs snake_case
4. Async function syntax error
5. Deprecated OpenAI model (`gpt-4-vision-preview`)
6. Missing owner field in job input
7. Storage trigger auth context - `NEW.owner` was null, needed to extract user ID from path

**Verification Steps**:

```bash
# 1. Test worker function loads correctly
export JOB_WORKER_SECRET='your_secret_from_env_local'
export SUPABASE_SERVICE_ROLE_KEY='your_service_role_key_from_env_local'
./scripts/trigger-worker.sh

# Should return HTTP 200 (not 503 or BOOT_ERROR)
```

```sql
-- 2. Verify storage trigger exists and uses correct fields
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_storage_object_created';

-- 3. Check recent job has correct structure
SELECT id, type, input
FROM jobs
ORDER BY created_at DESC
LIMIT 1;

-- Input should have: storage_path, mime_type, owner (not filePath, mimeType)
```

**If Issues Persist**:

1. **Redeploy functions**:
   ```bash
   npx supabase functions deploy worker-pull ingest-webhook
   ```

2. **Recreate storage trigger**:
   - Go to Supabase Dashboard > SQL Editor
   - Copy and run `supabase/scripts/setup-storage-trigger.sql`
   - Or use the runner script: `cd supabase/scripts && ./run-setup.sh --storage`

3. **Verify OpenAI model**:
   - Check `apps/functions/_internals/ai.ts` line 93
   - Should be `gpt-4o` (not `gpt-4-vision-preview`)

4. **Check secrets are set**:
   ```bash
   npx supabase secrets list
   # Should show: OPENAI_API_KEY, JOB_WORKER_SECRET, CRON_SECRET, etc.
   ```

### Processing Old Queued Jobs

If you have jobs that were queued before the fixes:

```bash
# Option 1: Delete old malformed jobs
# Run in Supabase SQL Editor:
DELETE FROM jobs WHERE status IN ('queued', 'failed') AND created_at < NOW() - INTERVAL '1 day';

# Option 2: Process with fixed worker (it handles missing owner field)
export JOB_WORKER_SECRET='your_secret'
export SUPABASE_SERVICE_ROLE_KEY='your_service_role_key'
./scripts/trigger-cron.sh 10 1000
```

### Current Status

All known issues have been resolved as of November 27, 2025. The image processing pipeline is fully functional with the following confirmed:

✅ Worker function deploys successfully (no BOOT_ERROR)
✅ Jobs process correctly (status changes to "done")
✅ Media assets created in database
✅ Draft cards created with AI descriptions
✅ Thumbnails generated and stored in 'derived' bucket
✅ OpenAI Vision API calls successful with gpt-4o model
✅ Backwards compatible with old job formats
✅ Storage trigger correctly extracts user ID from file path
✅ File uploads complete without auth context errors

For detailed technical information, see [docs/IMAGE_PROCESSING_FIXES.md](./IMAGE_PROCESSING_FIXES.md) and [CHANGELOG.md](../CHANGELOG.md).

---

## Next Steps

After completing the setup:

1. **Explore the codebase**:
   - Mobile app: `apps/mobile/`
   - Edge functions: `apps/functions/`
   - SDK: `packages/sdk/`

2. **Read the documentation**:
   - [README.md](../README.md) - Project overview
   - [apps/functions/README.md](../apps/functions/README.md) - Functions guide
   - [docs/OAUTH_SETUP.md](./OAUTH_SETUP.md) - OAuth configuration

3. **Customize the app**:
   - Update branding in `app.json`
   - Customize UI components
   - Add new features

4. **Deploy to production**:
   - Build mobile app for app stores
   - Configure production environment
   - Set up monitoring and analytics

---

## Getting Help

If you encounter issues not covered here:

1. Check the [main README](../README.md) for additional information
2. Review the [Edge Functions documentation](../apps/functions/README.md)
3. Check [Supabase Documentation](https://supabase.com/docs)
4. Check [Expo Documentation](https://docs.expo.dev/)
5. Search for similar issues in the project's issue tracker

---

## Summary Checklist

Use this checklist to ensure you've completed all setup steps:

- [ ] Prerequisites installed (Node.js, Supabase CLI, Expo CLI)
- [ ] Repository cloned and dependencies installed
- [ ] Supabase project created
- [ ] Project linked to Supabase: `npx supabase link`
- [ ] `.env.local` file created and configured with all keys
- [ ] Database migrations applied: `npx supabase db push`
- [ ] Database seeded (optional): `npm run db:seed`
- [ ] TypeScript types generated: `npm run gen:types`
- [ ] Supabase secrets set: `./scripts/setup-supabase-secrets.sh`
- [ ] Edge Functions deployed: `npx supabase functions deploy`
- [ ] Storage trigger configured: run `supabase/setup-storage-trigger.sql` in SQL Editor
- [ ] Storage trigger verified: check `information_schema.triggers`
- [ ] Job processing tested: `./scripts/trigger-worker.sh` returns HTTP 200
- [ ] Cron job set up for automated processing (optional but recommended)
- [ ] OAuth configured (if needed) - see [OAUTH_SETUP.md](./OAUTH_SETUP.md)
- [ ] Mobile app running: `npm run dev`
- [ ] End-to-end test completed successfully

**Congratulations!** Your Flashcards app is now fully set up and ready for development! 🎉
