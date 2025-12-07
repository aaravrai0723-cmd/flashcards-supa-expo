import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { 
  createServiceRoleClient, 
  getRequiredEnv,
  log,
  createResponse,
  createErrorResponse,
  retryWithBackoff
} from '../_internals/utils.ts';

// Cron tick endpoint for triggering job processing
serve(async (req) => {
  try {
    // Verify cron secret from custom header
    const cronSecret = Deno.env.get('CRON_SECRET');
    if (cronSecret) {
      const providedSecret = getCronSecretFromHeaders(req.headers);
      if (!providedSecret || providedSecret !== cronSecret) {
        log('error', 'Invalid cron authentication', { hasAuthHeader: !!req.headers.get('authorization'), hasCronHeader: !!req.headers.get('x-cron-secret') });
        return createErrorResponse('Unauthorized', 401);
      }
    }

    // Get query parameters
    const url = new URL(req.url);
    const iterations = parseInt(url.searchParams.get('iterations') || '1');
    const delay = parseInt(url.searchParams.get('delay') || '1000');

    log('info', 'Cron tick started', { iterations, delay });

    const results = await processJobsMultiple(iterations, delay);
    
    return createResponse({
      success: true,
      iterations,
      results,
      summary: {
        totalProcessed: results.reduce((sum, r) => sum + r.processed, 0),
        totalJobs: results.length
      }
    });

  } catch (error) {
    log('error', 'Cron tick failed', { error: error.message });
    return createErrorResponse('Internal server error', 500);
  }
});

// Process multiple job iterations
async function processJobsMultiple(iterations: number, delay: number): Promise<any[]> {
  const results = [];
  
  for (let i = 0; i < iterations; i++) {
    try {
      log('info', 'Processing iteration', { iteration: i + 1, total: iterations });
      
      // Call the worker-pull function
      const result = await callWorkerPull();
      results.push(result);
      
      // Add delay between iterations (except for the last one)
      if (i < iterations - 1 && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
    } catch (error) {
      log('error', 'Iteration failed', { iteration: i + 1, error: error.message });
      results.push({ processed: 0, jobs: [], error: error.message });
    }
  }
  
  return results;
}

// Call the worker-pull function
async function callWorkerPull(): Promise<any> {
  const workerUrl = getWorkerPullUrl();
  const workerSecret = getRequiredEnv('JOB_WORKER_SECRET');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('APP_SUPABASE_SERVICE_ROLE_KEY');
  
  try {
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'x-worker-secret': workerSecret,
        'Content-Type': 'application/json',
        ...(serviceRoleKey ? { Authorization: `Bearer ${serviceRoleKey}` } : {})
      }
    });
    
    if (!response.ok) {
      throw new Error(`Worker pull failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
    
  } catch (error) {
    log('error', 'Worker pull call failed', { error: error.message, workerUrl });
    throw error;
  }
}

// Get worker pull URL
function getWorkerPullUrl(): string {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('APP_SUPABASE_URL') || getRequiredEnv('SUPABASE_URL');
  const projectRef = supabaseUrl.split('//')[1].split('.')[0];
  return `${supabaseUrl}/functions/v1/worker-pull`;
}

// Accept cron secret via either custom header or Bearer token (to match docs)
function getCronSecretFromHeaders(headers: Headers): string | null {
  const cronHeader = headers.get('x-cron-secret');
  if (cronHeader) return cronHeader;

  const authHeader = headers.get('authorization');
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer\s+(.*)$/i);
  return match ? match[1].trim() : null;
}

// Health check endpoint
export async function healthCheck(): Promise<Response> {
  try {
    const supabase = createServiceRoleClient();
    
    // Check database connectivity
    const { data, error } = await supabase
      .from('jobs')
      .select('count')
      .limit(1);
    
    if (error) {
      throw new Error(`Database check failed: ${error.message}`);
    }
    
    // Check job queue status
    const { data: queuedJobs } = await supabase
      .from('jobs')
      .select('count')
      .eq('status', 'queued');
    
    const { data: processingJobs } = await supabase
      .from('jobs')
      .select('count')
      .eq('status', 'processing');
    
    return createResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      queue: {
        queued: queuedJobs?.[0]?.count || 0,
        processing: processingJobs?.[0]?.count || 0
      }
    });
    
  } catch (error) {
    log('error', 'Health check failed', { error: error.message });
    return createErrorResponse('Health check failed', 500);
  }
}

// Manual job processing trigger (for testing/debugging)
export async function triggerJobProcessing(iterations: number = 1): Promise<any> {
  log('info', 'Manual job processing triggered', { iterations });
  return await processJobsMultiple(iterations, 0);
}

// Get job queue statistics
export async function getQueueStats(): Promise<any> {
  try {
    const supabase = createServiceRoleClient();
    
    const { data: stats } = await supabase
      .from('jobs')
      .select('status, type, count')
      .order('status, type');
    
    const summary = {
      total: 0,
      byStatus: {} as Record<string, number>,
      byType: {} as Record<string, number>
    };
    
    stats?.forEach(stat => {
      summary.total += stat.count;
      summary.byStatus[stat.status] = (summary.byStatus[stat.status] || 0) + stat.count;
      summary.byType[stat.type] = (summary.byType[stat.type] || 0) + stat.count;
    });
    
    return summary;
    
  } catch (error) {
    log('error', 'Failed to get queue stats', { error: error.message });
    throw error;
  }
}

// Cleanup old jobs (optional maintenance function)
export async function cleanupOldJobs(olderThanDays: number = 30): Promise<any> {
  try {
    const supabase = createServiceRoleClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const { data, error } = await supabase
      .from('jobs')
      .delete()
      .in('status', ['done', 'failed'])
      .lt('created_at', cutoffDate.toISOString())
      .select('count');
    
    if (error) {
      throw new Error(`Cleanup failed: ${error.message}`);
    }
    
    const deletedCount = data?.[0]?.count || 0;
    log('info', 'Job cleanup completed', { deletedCount, olderThanDays });
    
    return { deletedCount, olderThanDays };
    
  } catch (error) {
    log('error', 'Job cleanup failed', { error: error.message });
    throw error;
  }
}
