#!/usr/bin/env node
/**
 * Seed script for remote Supabase database
 * Reads the seed.sql file and executes it using the service role key
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

async function seedRemoteDatabase() {
  // Load environment variables
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - EXPO_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nMake sure these are set in your .env.local file');
    process.exit(1);
  }

  // Create Supabase client with service role (bypasses RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Read seed file
  const seedPath = join(process.cwd(), 'supabase', 'seed.sql');
  let seedSQL: string;

  try {
    seedSQL = readFileSync(seedPath, 'utf-8');
  } catch (error) {
    console.error(`❌ Failed to read seed file at ${seedPath}`);
    console.error(error);
    process.exit(1);
  }

  console.log('🌱 Starting database seeding...\n');

  // Split SQL into individual statements (basic splitting by semicolon)
  const statements = seedSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    if (!statement) continue;

    try {
      const { error } = await supabase.rpc('exec_sql', {
        query: statement
      }) as any;

      if (error) {
        // Try direct execution via REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ query: statement }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        successCount++;
        console.log(`✓ Executed statement ${successCount}`);
      } else {
        successCount++;
        console.log(`✓ Executed statement ${successCount}`);
      }
    } catch (error: any) {
      errorCount++;
      console.error(`✗ Failed to execute statement:`, error.message);
      console.error(`  SQL: ${statement.substring(0, 100)}...`);
    }
  }

  console.log('\n📊 Seeding Summary:');
  console.log(`   ✓ Successful: ${successCount}`);
  console.log(`   ✗ Failed: ${errorCount}`);

  if (errorCount === 0) {
    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Database seeding completed with errors');
    console.log('   Note: Some errors may be expected (e.g., duplicate key violations)');
    process.exit(0);
  }
}

seedRemoteDatabase().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
