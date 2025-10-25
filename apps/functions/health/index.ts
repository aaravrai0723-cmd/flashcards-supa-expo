import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { 
  createServiceRoleClient, 
  log,
  createResponse,
  createErrorResponse,
  retryWithBackoff
} from '../_internals/utils.ts';

// Health check endpoint for monitoring system status
serve(async (req) => {
  try {
    const url = new URL(req.url);
    const checkType = url.searchParams.get('type') || 'basic';
    
    let healthData;
    
    switch (checkType) {
      case 'basic':
        healthData = await performBasicHealthCheck();
        break;
      case 'detailed':
        healthData = await performDetailedHealthCheck();
        break;
      case 'queue':
        healthData = await performQueueHealthCheck();
        break;
      case 'storage':
        healthData = await performStorageHealthCheck();
        break;
      default:
        return createErrorResponse('Invalid health check type', 400);
    }
    
    const status = healthData.healthy ? 200 : 503;
    return createResponse(healthData, status);
    
  } catch (error) {
    log('error', 'Health check failed', { error: error.message });
    return createErrorResponse('Health check failed', 500);
  }
});

// Basic health check - database connectivity
async function performBasicHealthCheck(): Promise<any> {
  const startTime = Date.now();
  
  try {
    const supabase = createServiceRoleClient();
    
    // Test database connectivity
    const { data, error } = await supabase
      .from('jobs')
      .select('count')
      .limit(1);
    
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    
    const responseTime = Date.now() - startTime;
    
    return {
      healthy: true,
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: 'healthy',
          responseTime: `${responseTime}ms`
        }
      },
      uptime: process.uptime ? `${Math.floor(process.uptime())}s` : 'unknown'
    };
    
  } catch (error) {
    return {
      healthy: false,
      timestamp: new Date().toISOString(),
      error: error.message,
      checks: {
        database: {
          status: 'unhealthy',
          error: error.message
        }
      }
    };
  }
}

// Detailed health check - all components
async function performDetailedHealthCheck(): Promise<any> {
  const startTime = Date.now();
  const checks = {};
  
  try {
    const supabase = createServiceRoleClient();
    
    // Database check
    const dbCheck = await retryWithBackoff(async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      return { status: 'healthy', responseTime: Date.now() - startTime };
    }, 3, 1000);
    
    checks['database'] = dbCheck;
    
    // Job queue check
    const queueCheck = await checkJobQueue(supabase);
    checks['job_queue'] = queueCheck;
    
    // Storage check
    const storageCheck = await checkStorageBuckets(supabase);
    checks['storage'] = storageCheck;
    
    // Environment check
    const envCheck = checkEnvironmentVariables();
    checks['environment'] = envCheck;
    
    const allHealthy = Object.values(checks).every((check: any) => check.status === 'healthy');
    
    return {
      healthy: allHealthy,
      timestamp: new Date().toISOString(),
      checks,
      summary: {
        totalChecks: Object.keys(checks).length,
        healthyChecks: Object.values(checks).filter((c: any) => c.status === 'healthy').length,
        responseTime: `${Date.now() - startTime}ms`
      }
    };
    
  } catch (error) {
    return {
      healthy: false,
      timestamp: new Date().toISOString(),
      error: error.message,
      checks
    };
  }
}

// Queue-specific health check
async function performQueueHealthCheck(): Promise<any> {
  try {
    const supabase = createServiceRoleClient();
    
    // Get queue statistics
    const { data: queueStats } = await supabase
      .from('jobs')
      .select('status, type, count')
      .order('status, type');
    
    const { data: recentJobs } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    const { data: stuckJobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'processing')
      .lt('updated_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()); // 10 minutes ago
    
    const summary = {
      total: 0,
      byStatus: {} as Record<string, number>,
      byType: {} as Record<string, number>
    };
    
    queueStats?.forEach(stat => {
      summary.total += stat.count;
      summary.byStatus[stat.status] = (summary.byStatus[stat.status] || 0) + stat.count;
      summary.byType[stat.type] = (summary.byType[stat.type] || 0) + stat.count;
    });
    
    const healthy = stuckJobs?.length === 0 && (summary.byStatus['failed'] || 0) < 10;
    
    return {
      healthy,
      timestamp: new Date().toISOString(),
      queue: {
        summary,
        recentJobs: recentJobs?.length || 0,
        stuckJobs: stuckJobs?.length || 0,
        oldestQueued: recentJobs?.[0]?.created_at
      }
    };
    
  } catch (error) {
    return {
      healthy: false,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

// Storage-specific health check
async function performStorageHealthCheck(): Promise<any> {
  try {
    const supabase = createServiceRoleClient();
    
    // Check storage buckets
    const buckets = ['media', 'derived', 'ingest'];
    const bucketChecks = {};
    
    for (const bucket of buckets) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .list('', { limit: 1 });
        
        bucketChecks[bucket] = {
          status: error ? 'unhealthy' : 'healthy',
          error: error?.message
        };
      } catch (error) {
        bucketChecks[bucket] = {
          status: 'unhealthy',
          error: error.message
        };
      }
    }
    
    const allHealthy = Object.values(bucketChecks).every((check: any) => check.status === 'healthy');
    
    return {
      healthy: allHealthy,
      timestamp: new Date().toISOString(),
      storage: bucketChecks
    };
    
  } catch (error) {
    return {
      healthy: false,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

// Helper functions
async function checkJobQueue(supabase: any): Promise<any> {
  try {
    const { data: queuedJobs } = await supabase
      .from('jobs')
      .select('count')
      .eq('status', 'queued');
    
    const { data: processingJobs } = await supabase
      .from('jobs')
      .select('count')
      .eq('status', 'processing');
    
    const { data: failedJobs } = await supabase
      .from('jobs')
      .select('count')
      .eq('status', 'failed')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours
    
    return {
      status: 'healthy',
      queued: queuedJobs?.[0]?.count || 0,
      processing: processingJobs?.[0]?.count || 0,
      failed: failedJobs?.[0]?.count || 0
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

async function checkStorageBuckets(supabase: any): Promise<any> {
  try {
    const buckets = ['media', 'derived', 'ingest'];
    const results = {};
    
    for (const bucket of buckets) {
      try {
        await supabase.storage.from(bucket).list('', { limit: 1 });
        results[bucket] = { status: 'healthy' };
      } catch (error) {
        results[bucket] = { status: 'unhealthy', error: error.message };
      }
    }
    
    const allHealthy = Object.values(results).every((r: any) => r.status === 'healthy');
    
    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      buckets: results
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

function checkEnvironmentVariables(): any {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'FILE_PROCESSING_WEBHOOK_SECRET',
    'JOB_WORKER_SECRET'
  ];
  
  const optionalVars = [
    'OPENAI_API_KEY',
    'GOOGLE_AI_API_KEY',
    'ANTHROPIC_API_KEY',
    'VISION_PROVIDER'
  ];
  
  const missing = requiredVars.filter(varName => !Deno.env.get(varName));
  const present = requiredVars.filter(varName => Deno.env.get(varName));
  
  return {
    status: missing.length === 0 ? 'healthy' : 'unhealthy',
    required: {
      present: present.length,
      missing: missing.length,
      missingVars: missing
    },
    optional: {
      present: optionalVars.filter(varName => Deno.env.get(varName)).length,
      total: optionalVars.length
    }
  };
}

// Metrics endpoint
export async function getMetrics(): Promise<any> {
  try {
    const supabase = createServiceRoleClient();
    
    // Get job metrics
    const { data: jobMetrics } = await supabase
      .from('jobs')
      .select('status, type, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    // Get media asset metrics
    const { data: mediaMetrics } = await supabase
      .from('media_assets')
      .select('type, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    // Get card metrics
    const { data: cardMetrics } = await supabase
      .from('cards')
      .select('is_active, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    return {
      timestamp: new Date().toISOString(),
      period: '24h',
      jobs: {
        total: jobMetrics?.length || 0,
        byStatus: groupBy(jobMetrics || [], 'status'),
        byType: groupBy(jobMetrics || [], 'type')
      },
      media: {
        total: mediaMetrics?.length || 0,
        byType: groupBy(mediaMetrics || [], 'type')
      },
      cards: {
        total: cardMetrics?.length || 0,
        active: cardMetrics?.filter(c => c.is_active).length || 0,
        drafts: cardMetrics?.filter(c => !c.is_active).length || 0
      }
    };
    
  } catch (error) {
    throw new Error(`Failed to get metrics: ${error.message}`);
  }
}

function groupBy(array: any[], key: string): Record<string, number> {
  return array.reduce((groups, item) => {
    const value = item[key];
    groups[value] = (groups[value] || 0) + 1;
    return groups;
  }, {});
}
