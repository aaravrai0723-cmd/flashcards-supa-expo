# Image Processing Pipeline - Fixed Issues & Setup Guide

**Status**: ✅ RESOLVED as of November 27, 2025
**Impact**: Critical - Job processing was completely broken
**Solution**: Multiple fixes applied and tested

---

## Executive Summary

The image processing job pipeline was experiencing 503 errors and BOOT_ERROR failures, preventing any uploaded images from being processed. After investigation and fixes, the pipeline is now fully operational.

### What Was Broken

- ❌ Jobs stuck in "queued" status indefinitely
- ❌ Worker function returning 503 errors
- ❌ "BOOT_ERROR: Function failed to start"
- ❌ OpenAI API errors: "Not Found"
- ❌ Database errors: "null value in column owner"

### What's Fixed Now

- ✅ Worker function deploys successfully
- ✅ Jobs process correctly (status changes to "done")
- ✅ Media assets created in database
- ✅ Draft cards generated with AI descriptions
- ✅ Thumbnails generated and stored
- ✅ OpenAI Vision API calls successful

---

## Root Causes & Fixes

### 1. Import Errors (BOOT_ERROR)

**Problem**: `getMediaAssetUrl` and `storeDerivedAsset` functions were imported but didn't exist.

**Fix**: Added both functions to `apps/functions/_internals/utils.ts` (lines 270-307)

**Files Changed**:
- `apps/functions/_internals/utils.ts` - Added missing functions
- `apps/functions/_internals/ai.ts` - Removed duplicates

### 2. Async Function Syntax Error

**Problem**: `verifyWebhookSignature()` used `await` but wasn't declared as `async`.

**Error**: `Uncaught SyntaxError: Unexpected reserved word at line 15`

**Fix**: Added `async` keyword and changed return type to `Promise<boolean>`

**File Changed**: `apps/functions/_internals/utils.ts` (line 5)

### 3. Bucket Name Mismatch

**Problem**: Functions tried to read from 'media' bucket but files were uploaded to 'ingest' bucket.

**Fix**: Updated all processing functions to use 'ingest' bucket by default

**Files Changed**: `apps/functions/_internals/media.ts` (lines 75, 114, 181)

### 4. Storage Trigger Field Names

**Problem**: Trigger created jobs with camelCase (`filePath`, `mimeType`) but worker expected snake_case (`storage_path`, `mime_type`, `owner`).

**Fix**: Updated trigger SQL to use correct snake_case field names

**File Changed**: `supabase/setup-storage-trigger.sql` (lines 46-81)

### 5. Deprecated OpenAI Model

**Problem**: Code used `gpt-4-vision-preview` which is deprecated, causing "Not Found" errors.

**Fix**: Updated to `gpt-4o` model which supports vision tasks

**File Changed**: `apps/functions/_internals/ai.ts` (line 93)

### 6. Missing Owner Field

**Problem**: Old jobs didn't have `owner` field, causing NOT NULL constraint violations.

**Fix**: Added fallback to extract owner from `storage_path` (format: `{user_id}/{filename}`)

**Files Changed**: `apps/functions/worker-pull/index.ts` (lines 152, 207, 266)

### 7. Storage Trigger Auth Context Missing

**Problem**: Storage trigger used `NEW.owner` which was always `null` because Supabase doesn't automatically populate the owner field in `storage.objects` when files are uploaded. This caused uploads to fail with "null value in column owner" errors.

**Diagnostic Output**: `auth.uid()` returned `null` in trigger context.

**Fix**: Updated trigger to extract user ID from the file path instead of relying on `NEW.owner`. Files are uploaded with paths like `{user_id}/filename.jpg`, so we use `storage.foldername()` to extract the first folder.

**Files Changed**:
- `supabase/setup-storage-trigger.sql` (line 35) - Extract user_id from path
- `apps/mobile/app/(tabs)/create.tsx` (lines 154-170) - Simplified to remove duplicate job creation

**Why This Works**:
- The RLS policies already enforce that files must be uploaded to paths matching the authenticated user's ID
- By extracting the user ID from the path, we get the correct authenticated user who uploaded the file
- This is more reliable than `NEW.owner` which Supabase doesn't populate automatically

---

## Verification Steps for Your Team

### 1. Verify Functions Deploy Correctly

```bash
npx supabase functions deploy worker-pull ingest-webhook
# Should complete without errors
```

### 2. Test Worker Function

```bash
# Set environment variables (from .env.local)
export JOB_WORKER_SECRET='your_secret_here'
export SUPABASE_SERVICE_ROLE_KEY='your_service_role_key_here'

# Run test script
./scripts/trigger-worker.sh

# Expected output:
# HTTP Status: 200
# "processed": 1
# "status": "done"
```

### 3. Verify Storage Trigger

```sql
-- Run in Supabase SQL Editor
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_storage_object_created';

-- Should return one row
```

### 4. Check Job Input Format

```sql
-- Run in Supabase SQL Editor
SELECT id, type, input FROM jobs
ORDER BY created_at DESC LIMIT 1;

-- input should have: storage_path, mime_type, owner
-- NOT: filePath, mimeType
```

### 5. End-to-End Test

1. Upload an image in the mobile app
2. Check job was created:
   ```sql
   SELECT * FROM jobs ORDER BY created_at DESC LIMIT 1;
   ```
3. Trigger processing:
   ```bash
   ./scripts/trigger-worker.sh
   ```
4. Verify results:
   ```sql
   -- Job should be "done"
   SELECT * FROM jobs ORDER BY updated_at DESC LIMIT 1;

   -- Media asset should exist
   SELECT * FROM media_assets ORDER BY created_at DESC LIMIT 1;

   -- Draft card should exist
   SELECT * FROM cards WHERE is_active = false ORDER BY created_at DESC LIMIT 1;
   ```

---

## Setup Checklist for New Team Members

Use this checklist when setting up the project:

- [ ] Clone repository and install dependencies
- [ ] Create `.env.local` with all required secrets
- [ ] Link Supabase project: `npx supabase link`
- [ ] Apply migrations: `npx supabase db push`
- [ ] Set Supabase secrets: `./scripts/setup-supabase-secrets.sh`
- [ ] Deploy functions: `npx supabase functions deploy`
- [ ] **Run storage trigger SQL** in Supabase Dashboard SQL Editor
  - Copy contents of `supabase/setup-storage-trigger.sql`
  - Paste and run in SQL Editor
- [ ] Verify trigger created (see SQL query above)
- [ ] Set up pg_cron for automated processing (optional but recommended)
- [ ] Test worker: `./scripts/trigger-worker.sh` returns HTTP 200
- [ ] Upload test image and verify end-to-end processing

---

## Common Issues & Solutions

### Issue: "BOOT_ERROR" when calling worker

**Check**:
```bash
# View function logs in Dashboard
# Go to: Edge Functions > worker-pull > Logs > Invocations
```

**Fix**:
1. Verify all secrets are set: `npx supabase secrets list`
2. Check for syntax errors in code
3. Redeploy: `npx supabase functions deploy worker-pull`

### Issue: Jobs stuck in "queued"

**Check**:
```sql
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'on_storage_object_created';
```

**Fix**:
1. If no results, run `supabase/setup-storage-trigger.sql`
2. Set up pg_cron for automated processing
3. Or manually process: `./scripts/trigger-worker.sh`

### Issue: OpenAI errors

**Check**:
```bash
grep "model:" apps/functions/_internals/ai.ts
# Should show: model: 'gpt-4o'
```

**Fix**:
1. Verify model is `gpt-4o` (not `gpt-4-vision-preview`)
2. Check API key has credits: https://platform.openai.com/account/billing
3. Verify secret is set: `npx supabase secrets list | grep OPENAI`

---

## Testing Scripts

Two helper scripts are provided for manual job processing:

### Process Single Job

```bash
export JOB_WORKER_SECRET='your_secret'
export SUPABASE_SERVICE_ROLE_KEY='your_key'
./scripts/trigger-worker.sh
```

### Process Multiple Jobs

```bash
export CRON_SECRET='your_secret'
export SUPABASE_SERVICE_ROLE_KEY='your_key'
./scripts/trigger-cron.sh 5 1000
# Processes 5 jobs with 1 second delay
```

---

## Documentation References

- **Complete Setup Guide**: [docs/SETUP.md](./SETUP.md)
- **Troubleshooting**: [README.md](../README.md#troubleshooting)
- **Functions Guide**: [apps/functions/README.md](../apps/functions/README.md)
- **Detailed Changelog**: [CHANGELOG.md](../CHANGELOG.md)
- **Scripts Documentation**: [scripts/README.md](../scripts/README.md)

---

## Technical Details

### Modified Files Summary

| File | Changes | Lines |
|------|---------|-------|
| `apps/functions/_internals/utils.ts` | Added async, added missing functions | 5, 270-307 |
| `apps/functions/_internals/ai.ts` | Updated OpenAI model, removed duplicates | 1, 93 |
| `apps/functions/_internals/media.ts` | Updated bucket parameter | 75, 114, 181 |
| `apps/functions/worker-pull/index.ts` | Added owner fallback logic | 152, 207, 266 |
| `supabase/setup-storage-trigger.sql` | Fixed field names, added ingest_files | 46-81 |

### Dependencies

No new dependencies added. All fixes use existing packages.

### Backwards Compatibility

All changes are backwards compatible:
- Old jobs with missing owner field will still work (extracted from path)
- Storage trigger creates both old and new job formats
- Functions handle both camelCase and snake_case inputs

---

## Support

If you encounter issues:

1. **Check function logs**: Dashboard > Edge Functions > Logs
2. **Run verification SQL**: See "Verification Steps" above
3. **Review troubleshooting**: [README.md](../README.md#troubleshooting)
4. **Check CHANGELOG**: [CHANGELOG.md](../CHANGELOG.md)

---

**Last Updated**: November 27, 2025 (Updated with auth context fix)
**Status**: All issues resolved, pipeline fully functional
**Next Review**: When new features are added to the pipeline
