import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  return new Response(
    JSON.stringify({ message: 'Test function works!', timestamp: new Date().toISOString() }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
