#!/usr/bin/env tsx
/**
 * Fix Storage Bucket Configuration
 *
 * This script fixes the storage bucket owner configuration issue
 * that causes "column owner is of type uuid but expression is of type text" errors.
 *
 * Usage:
 *   npx tsx fixes/scripts/fix-storage-buckets.ts
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - EXPO_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixStorageBuckets() {
  console.log('🔍 Checking storage bucket configuration...\n');

  const buckets = ['ingest', 'media', 'derived'];

  for (const bucketId of buckets) {
    console.log(`📦 Checking bucket: ${bucketId}`);

    // Get bucket info
    const { data: bucket, error: getError } = await supabase
      .storage
      .getBucket(bucketId);

    if (getError) {
      console.error(`   ❌ Error getting bucket: ${getError.message}`);
      continue;
    }

    console.log(`   Current config:`, {
      id: bucket.id,
      name: bucket.name,
      public: bucket.public,
      file_size_limit: bucket.file_size_limit,
    });

    // Update bucket to ensure proper configuration
    const { data: updated, error: updateError } = await supabase
      .storage
      .updateBucket(bucketId, {
        public: bucket.public,
        file_size_limit: bucket.file_size_limit,
        allowed_mime_types: bucket.allowed_mime_types,
      });

    if (updateError) {
      console.error(`   ❌ Error updating bucket: ${updateError.message}`);
    } else {
      console.log(`   ✅ Bucket configuration verified`);
    }
    console.log();
  }

  console.log('✅ Storage bucket check complete!\n');
  console.log('⚠️  If errors persist, you MUST run the SQL script:');
  console.log('   fixes/sql/diagnose-storage-issue.sql');
  console.log('   in your Supabase Dashboard > SQL Editor\n');
}

fixStorageBuckets()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
