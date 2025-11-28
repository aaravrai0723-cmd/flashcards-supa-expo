# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed - Storage Upload Owner Type Error (2025-11-27)

**Problem**: Mobile app file uploads were failing with database error:
```
StorageApiError: column "owner" is of type uuid but expression is of type text
```

**Root Cause**: Older version of `@supabase/supabase-js` (v2.39.3) had a bug where the storage owner field was being set as TEXT instead of UUID type.

**Solution**:
- Updated `@supabase/supabase-js` from v2.39.3 to v2.86.0 in mobile app
- Created SQL fix script to ensure storage buckets don't have incorrect `owner_id` configuration
- Allows Supabase to automatically handle owner assignment from authenticated user's JWT token

**Files Changed**:
- `apps/mobile/package.json` - Updated Supabase client dependency
- `fixes/sql/fix-storage-owner-issue.sql` - New SQL script to verify/fix bucket configuration

**Testing**:
✅ File uploads now complete successfully without UUID type errors
✅ Storage owner field correctly set as UUID from auth context
✅ Backwards compatible with existing storage policies

**Migration Guide**:
1. Update mobile dependencies: `cd apps/mobile && npm install @supabase/supabase-js@latest`
2. Run SQL fix script in Supabase Dashboard > SQL Editor (see `fixes/sql/fix-storage-owner-issue.sql`)
3. Restart mobile development server
4. Test file upload functionality

### Fixed - Image Processing Job Pipeline (2025-11-27)

This release fixes critical issues preventing the image processing job pipeline from working. All jobs were failing with 503 errors and "BOOT_ERROR" messages. The following fixes were implemented:

#### 1. Import Errors in media.ts
**Problem**: `getMediaAssetUrl` and `storeDerivedAsset` functions were imported from `utils.ts` but didn't exist there, causing runtime errors.

**Solution**:
- Added both functions to `apps/functions/_internals/utils.ts` (lines 270-307)
- Removed duplicate implementations from `ai.ts`
- Functions now properly handle storage bucket operations

**Files Changed**:
- `apps/functions/_internals/utils.ts` - Added missing utility functions
- `apps/functions/_internals/ai.ts` - Removed duplicates, now imports from utils

#### 2. Bucket Name Mismatch
**Problem**: Processing functions tried to read from 'media' bucket but files were uploaded to 'ingest' bucket.

**Solution**:
- Updated `processImage()`, `processVideo()`, and `processPDF()` to accept `bucket` parameter
- Set default bucket to 'ingest' instead of 'media'
- Maintains backwards compatibility

**Files Changed**:
- `apps/functions/_internals/media.ts` (lines 75-192) - Updated all processing functions

#### 3. Storage Trigger Field Name Mismatch
**Problem**: Database trigger created jobs with camelCase field names (`filePath`, `mimeType`) but worker expected snake_case (`storage_path`, `mime_type`, `owner`).

**Solution**:
- Updated storage trigger SQL to use correct snake_case field names
- Added `owner` field to job input (extracted from user_id)
- Created `ingest_files` record before creating job

**Files Changed**:
- `supabase/setup-storage-trigger.sql` (lines 46-81) - Fixed field names and added ingest_files record

#### 4. Async Function Syntax Error
**Problem**: `verifyWebhookSignature()` function used `await` but wasn't declared as `async`, causing "Unexpected reserved word" syntax error at line 15.

**Solution**:
- Added `async` keyword to function declaration
- Changed return type from `boolean` to `Promise<boolean>`
- Function now properly handles asynchronous crypto operations

**Files Changed**:
- `apps/functions/_internals/utils.ts` (line 5) - Fixed function declaration

#### 5. Deprecated OpenAI Model
**Problem**: Code used `gpt-4-vision-preview` which is deprecated, causing "OpenAI API error: Not Found".

**Solution**:
- Updated to use `gpt-4o` model which supports vision tasks
- Model is actively maintained and more cost-effective
- Maintains same functionality with better performance

**Files Changed**:
- `apps/functions/_internals/ai.ts` (line 93) - Updated model name

#### 6. Missing Owner Field in Old Jobs
**Problem**: Jobs created before trigger update didn't have `owner` field, causing "null value in column owner violates not-null constraint" errors.

**Solution**:
- Added fallback logic to extract owner from storage_path
- Format: `{user_id}/{filename}` - extracts first part as owner
- Maintains backwards compatibility with old job format

**Files Changed**:
- `apps/functions/worker-pull/index.ts` (lines 152, 207, 266) - Added owner extraction fallback for all job types

### Added

#### New Utility Scripts
- `scripts/trigger-worker.sh` - Manually trigger worker to process single job
- `scripts/trigger-cron.sh` - Manually trigger cron to process multiple jobs
- Both scripts include proper error handling and status reporting

#### Enhanced Documentation
- Updated `README.md` with comprehensive troubleshooting section
- Added debugging tools and commands
- Documented common issues and solutions
- Updated `scripts/README.md` with new trigger scripts

### Testing

All fixes have been tested and verified:
- ✅ Worker function deploys successfully (no BOOT_ERROR)
- ✅ Jobs process correctly (status: "done")
- ✅ Media assets created in database
- ✅ Draft cards created with AI descriptions
- ✅ Thumbnails generated and stored
- ✅ OpenAI API calls successful with gpt-4o model

### Migration Guide

For existing deployments, follow these steps to apply the fixes:

1. **Update codebase**: Pull latest changes from repository

2. **Redeploy Edge Functions**:
   ```bash
   npx supabase functions deploy worker-pull ingest-webhook
   ```

3. **Update Storage Trigger**:
   - Go to Supabase Dashboard > SQL Editor
   - Copy contents of `supabase/setup-storage-trigger.sql`
   - Run the SQL to recreate the trigger

4. **Test the Pipeline**:
   ```bash
   export JOB_WORKER_SECRET='your_secret'
   export SUPABASE_SERVICE_ROLE_KEY='your_service_role_key'
   ./scripts/trigger-worker.sh
   ```

5. **Process Existing Queued Jobs**:
   ```bash
   # Process all queued jobs
   ./scripts/trigger-cron.sh 10 1000
   ```

6. **Verify Results**:
   ```sql
   -- Check job status
   SELECT id, type, status, error FROM jobs ORDER BY updated_at DESC LIMIT 10;

   -- Check created assets
   SELECT * FROM media_assets ORDER BY created_at DESC LIMIT 5;

   -- Check created cards
   SELECT * FROM cards WHERE is_active = false ORDER BY created_at DESC LIMIT 5;
   ```

### Breaking Changes

None. All changes are backwards compatible.

### Dependencies

**Updated**:
- `@supabase/supabase-js`: v2.39.3 → v2.86.0 (mobile app) - Fixes storage owner type handling

### Known Issues

None currently. The image processing pipeline is fully functional.

### Contributors

- Fixed by: Claude Code
- Reported by: navneetrai
- Date: November 27, 2025

---

## [Previous Versions]

### Initial Release
- Expo React Native mobile app
- Supabase backend integration
- Edge Functions for background processing
- Media upload and storage
- AI-powered card generation
- Quiz functionality
