import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const envVars = {
    hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
    hasSupabaseServiceRole: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    hasSupabaseAnonKey: !!Deno.env.get('SUPABASE_ANON_KEY'),
    hasOpenAI: !!Deno.env.get('OPENAI_API_KEY'),
    hasWorkerSecret: !!Deno.env.get('JOB_WORKER_SECRET'),
    hasCronSecret: !!Deno.env.get('CRON_SECRET'),
    // Show first few chars of each to verify they're set
    supabaseUrl: Deno.env.get('SUPABASE_URL')?.substring(0, 30) + '...',
  };

  return new Response(
    JSON.stringify({ envVars, timestamp: new Date().toISOString() }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
