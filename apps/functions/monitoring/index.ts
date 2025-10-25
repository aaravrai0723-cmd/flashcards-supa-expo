import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { 
  createServiceRoleClient, 
  getRequiredEnv,
  log,
  createResponse,
  createErrorResponse
} from '../_internals/utils.ts';
import { QueueManager } from '../_internals/rate-limiter.ts';

// Monitoring endpoint for system metrics and alerts
serve(async (req) => {
  try {
    const url = new URL(req.url);
    const endpoint = url.pathname.split('/').pop();
    
    switch (endpoint) {
      case 'metrics':
        return await getMetrics();
      case 'alerts':
        return await getAlerts();
      case 'dashboard':
        return await getDashboard();
      case 'cleanup':
        return await performCleanup();
      default:
        return createErrorResponse('Invalid monitoring endpoint', 400);
    }
    
  } catch (error) {
    log('error', 'Monitoring request failed', { error: error.message });
    return createErrorResponse('Monitoring request failed', 500);
  }
});

// Get comprehensive system metrics
async function getMetrics(): Promise<Response> {
  try {
    const supabase = createServiceRoleClient();
    const queueManager = new QueueManager();
    
    // Get time range (default to last 24 hours)
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Job metrics
    const { data: jobMetrics } = await supabase
      .from('jobs')
      .select('status, type, created_at, updated_at')
      .gte('created_at', yesterday.toISOString());
    
    // Media asset metrics
    const { data: mediaMetrics } = await supabase
      .from('media_assets')
      .select('type, created_at')
      .gte('created_at', yesterday.toISOString());
    
    // Card metrics
    const { data: cardMetrics } = await supabase
      .from('cards')
      .select('is_active, created_at, deck_id')
      .gte('created_at', yesterday.toISOString());
    
    // Deck metrics
    const { data: deckMetrics } = await supabase
      .from('decks')
      .select('visibility, created_at')
      .gte('created_at', yesterday.toISOString());
    
    // Queue status
    const queueStatus = await queueManager.getQueueStatus();
    const queueHealth = await queueManager.getQueueHealth();
    
    // Processing performance
    const processingTimes = calculateProcessingTimes(jobMetrics || []);
    
    // Error analysis
    const errorAnalysis = analyzeErrors(jobMetrics || []);
    
    // User activity
    const userActivity = analyzeUserActivity(jobMetrics || [], mediaMetrics || []);
    
    const metrics = {
      timestamp: now.toISOString(),
      period: '24h',
      jobs: {
        total: jobMetrics?.length || 0,
        byStatus: groupBy(jobMetrics || [], 'status'),
        byType: groupBy(jobMetrics || [], 'type'),
        processingTimes,
        errorAnalysis
      },
      media: {
        total: mediaMetrics?.length || 0,
        byType: groupBy(mediaMetrics || [], 'type')
      },
      cards: {
        total: cardMetrics?.length || 0,
        active: cardMetrics?.filter(c => c.is_active).length || 0,
        drafts: cardMetrics?.filter(c => !c.is_active).length || 0,
        byDeck: groupBy(cardMetrics || [], 'deck_id')
      },
      decks: {
        total: deckMetrics?.length || 0,
        byVisibility: groupBy(deckMetrics || [], 'visibility')
      },
      queue: {
        status: queueStatus,
        health: queueHealth
      },
      users: userActivity,
      system: {
        uptime: process.uptime ? `${Math.floor(process.uptime())}s` : 'unknown',
        memory: process.memoryUsage ? {
          rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
        } : null
      }
    };
    
    return createResponse(metrics);
    
  } catch (error) {
    log('error', 'Failed to get metrics', { error: error.message });
    return createErrorResponse('Failed to get metrics', 500);
  }
}

// Get system alerts and warnings
async function getAlerts(): Promise<Response> {
  try {
    const supabase = createServiceRoleClient();
    const queueManager = new QueueManager();
    
    const alerts = [];
    
    // Check for stuck jobs
    const { data: stuckJobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'processing')
      .lt('updated_at', new Date(Date.now() - 30 * 60 * 1000).toISOString());
    
    if (stuckJobs && stuckJobs.length > 0) {
      alerts.push({
        type: 'warning',
        severity: 'high',
        message: `${stuckJobs.length} jobs stuck in processing state`,
        details: {
          jobIds: stuckJobs.map(j => j.id),
          oldestStuck: stuckJobs.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())[0]
        }
      });
    }
    
    // Check for high failure rate
    const { data: recentJobs } = await supabase
      .from('jobs')
      .select('status, created_at')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
    
    if (recentJobs && recentJobs.length > 0) {
      const failedJobs = recentJobs.filter(j => j.status === 'failed');
      const failureRate = failedJobs.length / recentJobs.length;
      
      if (failureRate > 0.1) { // 10% failure rate threshold
        alerts.push({
          type: 'error',
          severity: 'high',
          message: `High failure rate: ${Math.round(failureRate * 100)}%`,
          details: {
            totalJobs: recentJobs.length,
            failedJobs: failedJobs.length,
            failureRate
          }
        });
      }
    }
    
    // Check queue health
    const queueHealth = await queueManager.getQueueHealth();
    if (!queueHealth.healthy) {
      alerts.push({
        type: 'warning',
        severity: 'medium',
        message: 'Queue health issues detected',
        details: queueHealth
      });
    }
    
    // Check for long queue times
    const { data: oldQueuedJobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'queued')
      .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());
    
    if (oldQueuedJobs && oldQueuedJobs.length > 0) {
      alerts.push({
        type: 'warning',
        severity: 'medium',
        message: `${oldQueuedJobs.length} jobs queued for over 10 minutes`,
        details: {
          oldestQueued: oldQueuedJobs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]
        }
      });
    }
    
    // Check storage usage (placeholder)
    alerts.push({
      type: 'info',
      severity: 'low',
      message: 'Storage usage monitoring not implemented',
      details: {
        note: 'Implement storage usage monitoring for production'
      }
    });
    
    return createResponse({
      timestamp: new Date().toISOString(),
      alerts,
      summary: {
        total: alerts.length,
        bySeverity: {
          high: alerts.filter(a => a.severity === 'high').length,
          medium: alerts.filter(a => a.severity === 'medium').length,
          low: alerts.filter(a => a.severity === 'low').length
        }
      }
    });
    
  } catch (error) {
    log('error', 'Failed to get alerts', { error: error.message });
    return createErrorResponse('Failed to get alerts', 500);
  }
}

// Get dashboard data
async function getDashboard(): Promise<Response> {
  try {
    const supabase = createServiceRoleClient();
    
    // Get recent activity
    const { data: recentJobs } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    const { data: recentMedia } = await supabase
      .from('media_assets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    const { data: recentCards } = await supabase
      .from('cards')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Get hourly activity for the last 24 hours
    const hourlyActivity = await getHourlyActivity(supabase);
    
    // Get top users by activity
    const topUsers = await getTopUsers(supabase);
    
    // Get system health summary
    const healthSummary = await getHealthSummary(supabase);
    
    return createResponse({
      timestamp: new Date().toISOString(),
      recentActivity: {
        jobs: recentJobs || [],
        media: recentMedia || [],
        cards: recentCards || []
      },
      hourlyActivity,
      topUsers,
      health: healthSummary
    });
    
  } catch (error) {
    log('error', 'Failed to get dashboard data', { error: error.message });
    return createErrorResponse('Failed to get dashboard data', 500);
  }
}

// Perform system cleanup
async function performCleanup(): Promise<Response> {
  try {
    const supabase = createServiceRoleClient();
    const queueManager = new QueueManager();
    
    const cleanupResults = {
      timestamp: new Date().toISOString(),
      operations: []
    };
    
    // Cleanup stuck jobs
    const stuckJobsCleaned = await queueManager.cleanupStuckJobs();
    cleanupResults.operations.push({
      operation: 'cleanup_stuck_jobs',
      count: stuckJobsCleaned,
      status: 'completed'
    });
    
    // Cleanup old completed jobs (older than 7 days)
    const { data: oldJobs } = await supabase
      .from('jobs')
      .select('id')
      .in('status', ['done', 'failed'])
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    if (oldJobs && oldJobs.length > 0) {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .in('id', oldJobs.map(j => j.id));
      
      if (!error) {
        cleanupResults.operations.push({
          operation: 'cleanup_old_jobs',
          count: oldJobs.length,
          status: 'completed'
        });
      } else {
        cleanupResults.operations.push({
          operation: 'cleanup_old_jobs',
          count: 0,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    // Cleanup orphaned media assets (no associated cards)
    const { data: orphanedMedia } = await supabase
      .from('media_assets')
      .select('id')
      .not('id', 'in', `(SELECT DISTINCT media_asset_id FROM card_media WHERE media_asset_id IS NOT NULL)`);
    
    if (orphanedMedia && orphanedMedia.length > 0) {
      // Note: In production, you might want to be more careful about deleting media assets
      // This is just an example of cleanup logic
      cleanupResults.operations.push({
        operation: 'cleanup_orphaned_media',
        count: orphanedMedia.length,
        status: 'skipped',
        note: 'Orphaned media cleanup skipped for safety'
      });
    }
    
    log('info', 'System cleanup completed', cleanupResults);
    
    return createResponse(cleanupResults);
    
  } catch (error) {
    log('error', 'Cleanup failed', { error: error.message });
    return createErrorResponse('Cleanup failed', 500);
  }
}

// Helper functions
function groupBy(array: any[], key: string): Record<string, number> {
  return array.reduce((groups, item) => {
    const value = item[key];
    groups[value] = (groups[value] || 0) + 1;
    return groups;
  }, {});
}

function calculateProcessingTimes(jobs: any[]): any {
  const completedJobs = jobs.filter(j => j.status === 'done' && j.updated_at);
  
  if (completedJobs.length === 0) {
    return { average: 0, median: 0, min: 0, max: 0 };
  }
  
  const times = completedJobs.map(job => {
    const created = new Date(job.created_at).getTime();
    const updated = new Date(job.updated_at).getTime();
    return (updated - created) / 1000; // Convert to seconds
  });
  
  times.sort((a, b) => a - b);
  
  return {
    average: Math.round(times.reduce((sum, time) => sum + time, 0) / times.length),
    median: Math.round(times[Math.floor(times.length / 2)]),
    min: Math.round(Math.min(...times)),
    max: Math.round(Math.max(...times)),
    count: times.length
  };
}

function analyzeErrors(jobs: any[]): any {
  const failedJobs = jobs.filter(j => j.status === 'failed');
  
  if (failedJobs.length === 0) {
    return { total: 0, byType: {}, byError: {} };
  }
  
  return {
    total: failedJobs.length,
    byType: groupBy(failedJobs, 'type'),
    byError: groupBy(failedJobs, 'error')
  };
}

function analyzeUserActivity(jobs: any[], mediaAssets: any[]): any {
  const userJobCounts = groupBy(jobs, 'created_by');
  const userMediaCounts = groupBy(mediaAssets, 'owner');
  
  const allUsers = new Set([
    ...Object.keys(userJobCounts),
    ...Object.keys(userMediaCounts)
  ]);
  
  return Array.from(allUsers).map(userId => ({
    userId,
    jobs: userJobCounts[userId] || 0,
    mediaAssets: userMediaCounts[userId] || 0,
    totalActivity: (userJobCounts[userId] || 0) + (userMediaCounts[userId] || 0)
  })).sort((a, b) => b.totalActivity - a.totalActivity).slice(0, 10);
}

async function getHourlyActivity(supabase: any): Promise<any[]> {
  const { data: hourlyJobs } = await supabase
    .from('jobs')
    .select('created_at')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  
  // Group by hour
  const hourlyCounts: Record<number, number> = {};
  
  hourlyJobs?.forEach(job => {
    const hour = new Date(job.created_at).getHours();
    hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
  });
  
  return Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: hourlyCounts[i] || 0
  }));
}

async function getTopUsers(supabase: any): Promise<any[]> {
  const { data: userActivity } = await supabase
    .from('jobs')
    .select('created_by, type')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
  
  const userCounts: Record<string, Record<string, number>> = {};
  
  userActivity?.forEach(job => {
    if (!userCounts[job.created_by]) {
      userCounts[job.created_by] = {};
    }
    userCounts[job.created_by][job.type] = (userCounts[job.created_by][job.type] || 0) + 1;
  });
  
  return Object.entries(userCounts)
    .map(([userId, counts]) => ({
      userId,
      totalJobs: Object.values(counts).reduce((sum, count) => sum + count, 0),
      byType: counts
    }))
    .sort((a, b) => b.totalJobs - a.totalJobs)
    .slice(0, 10);
}

async function getHealthSummary(supabase: any): Promise<any> {
  const { data: queueStatus } = await supabase
    .from('jobs')
    .select('status, count')
    .order('status');
  
  const { data: recentErrors } = await supabase
    .from('jobs')
    .select('error')
    .eq('status', 'failed')
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
  
  return {
    queue: {
      queued: queueStatus?.find(s => s.status === 'queued')?.count || 0,
      processing: queueStatus?.find(s => s.status === 'processing')?.count || 0,
      done: queueStatus?.find(s => s.status === 'done')?.count || 0,
      failed: queueStatus?.find(s => s.status === 'failed')?.count || 0
    },
    recentErrors: recentErrors?.length || 0,
    healthScore: calculateHealthScore(queueStatus || [], recentErrors?.length || 0)
  };
}

function calculateHealthScore(queueStatus: any[], recentErrors: number): number {
  const queued = queueStatus.find(s => s.status === 'queued')?.count || 0;
  const processing = queueStatus.find(s => s.status === 'processing')?.count || 0;
  const failed = queueStatus.find(s => s.status === 'failed')?.count || 0;
  
  let score = 100;
  
  // Penalize for high queue
  if (queued > 50) score -= 20;
  else if (queued > 20) score -= 10;
  
  // Penalize for stuck jobs
  if (processing > 10) score -= 15;
  
  // Penalize for failures
  if (recentErrors > 10) score -= 25;
  else if (recentErrors > 5) score -= 15;
  
  return Math.max(0, score);
}
