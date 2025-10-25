import { createServiceRoleClient, log } from './utils.ts';

// Rate limiting configuration
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

// Rate limit result
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// Default rate limit configurations
export const RATE_LIMITS = {
  // Webhook endpoints - more restrictive
  webhook: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyGenerator: (req: Request) => {
      // Rate limit by IP
      const ip = req.headers.get('x-forwarded-for') || 
                 req.headers.get('x-real-ip') || 
                 'unknown';
      return `webhook:${ip}`;
    }
  },
  
  // Worker endpoints - moderate limits
  worker: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    keyGenerator: (req: Request) => {
      // Rate limit by worker secret
      const auth = req.headers.get('authorization');
      return `worker:${auth}`;
    }
  },
  
  // Cron endpoints - very restrictive
  cron: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    keyGenerator: (req: Request) => {
      // Rate limit by cron secret
      const auth = req.headers.get('authorization');
      return `cron:${auth}`;
    }
  },
  
  // Health check endpoints - generous limits
  health: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200,
    keyGenerator: (req: Request) => {
      const ip = req.headers.get('x-forwarded-for') || 'unknown';
      return `health:${ip}`;
    }
  }
};

// In-memory rate limit store (for single instance)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Database-based rate limit store (for distributed systems)
export class DatabaseRateLimiter {
  private supabase: any;
  
  constructor() {
    this.supabase = createServiceRoleClient();
  }
  
  async checkRateLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    try {
      const now = Date.now();
      const windowStart = now - config.windowMs;
      
      // Get current rate limit data
      const { data: existing } = await this.supabase
        .from('rate_limits')
        .select('*')
        .eq('key', key)
        .gte('created_at', new Date(windowStart).toISOString())
        .order('created_at', { ascending: false });
      
      const currentCount = existing?.length || 0;
      const remaining = Math.max(0, config.maxRequests - currentCount);
      
      if (currentCount >= config.maxRequests) {
        const oldestRequest = existing?.[existing.length - 1];
        const resetTime = oldestRequest ? 
          new Date(oldestRequest.created_at).getTime() + config.windowMs : 
          now + config.windowMs;
        
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter: Math.ceil((resetTime - now) / 1000)
        };
      }
      
      // Record this request
      await this.supabase
        .from('rate_limits')
        .insert({
          key,
          created_at: new Date().toISOString()
        });
      
      return {
        allowed: true,
        remaining: remaining - 1,
        resetTime: now + config.windowMs
      };
      
    } catch (error) {
      log('error', 'Rate limit check failed', { error: error.message, key });
      // Fail open - allow request if rate limiting fails
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs
      };
    }
  }
  
  async cleanup(): Promise<void> {
    try {
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      
      await this.supabase
        .from('rate_limits')
        .delete()
        .lt('created_at', cutoffTime.toISOString());
      
      log('info', 'Rate limit cleanup completed');
    } catch (error) {
      log('error', 'Rate limit cleanup failed', { error: error.message });
    }
  }
}

// In-memory rate limiter (for single instance deployments)
export class MemoryRateLimiter {
  checkRateLimit(
    key: string,
    config: RateLimitConfig
  ): RateLimitResult {
    const now = Date.now();
    const existing = rateLimitStore.get(key);
    
    if (!existing || now > existing.resetTime) {
      // Reset or create new entry
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs
      };
    }
    
    if (existing.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: existing.resetTime,
        retryAfter: Math.ceil((existing.resetTime - now) / 1000)
      };
    }
    
    // Increment count
    existing.count++;
    rateLimitStore.set(key, existing);
    
    return {
      allowed: true,
      remaining: config.maxRequests - existing.count,
      resetTime: existing.resetTime
    };
  }
  
  cleanup(): void {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
      if (now > data.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }
}

// Rate limiting middleware
export function createRateLimitMiddleware(config: RateLimitConfig) {
  const limiter = new MemoryRateLimiter(); // Use memory limiter for simplicity
  
  return async (req: Request): Promise<RateLimitResult> => {
    const key = config.keyGenerator ? 
      config.keyGenerator(req) : 
      `default:${req.headers.get('x-forwarded-for') || 'unknown'}`;
    
    return limiter.checkRateLimit(key, config);
  };
}

// Queue management utilities
export class QueueManager {
  private supabase: any;
  
  constructor() {
    this.supabase = createServiceRoleClient();
  }
  
  async getQueueStatus(): Promise<any> {
    try {
      const { data: status } = await this.supabase
        .from('jobs')
        .select('status, type, count')
        .order('status, type');
      
      const summary = {
        total: 0,
        byStatus: {} as Record<string, number>,
        byType: {} as Record<string, number>
      };
      
      status?.forEach(stat => {
        summary.total += stat.count;
        summary.byStatus[stat.status] = (summary.byStatus[stat.status] || 0) + stat.count;
        summary.byType[stat.type] = (summary.byType[stat.type] || 0) + stat.count;
      });
      
      return summary;
    } catch (error) {
      log('error', 'Failed to get queue status', { error: error.message });
      throw error;
    }
  }
  
  async getQueueHealth(): Promise<any> {
    try {
      const { data: stuckJobs } = await this.supabase
        .from('jobs')
        .select('*')
        .eq('status', 'processing')
        .lt('updated_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());
      
      const { data: failedJobs } = await this.supabase
        .from('jobs')
        .select('*')
        .eq('status', 'failed')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
      
      const { data: queuedJobs } = await this.supabase
        .from('jobs')
        .select('*')
        .eq('status', 'queued')
        .order('created_at', { ascending: true });
      
      return {
        healthy: stuckJobs?.length === 0 && (failedJobs?.length || 0) < 10,
        stuckJobs: stuckJobs?.length || 0,
        failedJobs: failedJobs?.length || 0,
        queuedJobs: queuedJobs?.length || 0,
        oldestQueued: queuedJobs?.[0]?.created_at
      };
    } catch (error) {
      log('error', 'Failed to get queue health', { error: error.message });
      throw error;
    }
  }
  
  async cleanupStuckJobs(): Promise<number> {
    try {
      const stuckThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes
      
      const { data: stuckJobs } = await this.supabase
        .from('jobs')
        .select('id')
        .eq('status', 'processing')
        .lt('updated_at', stuckThreshold.toISOString());
      
      if (stuckJobs && stuckJobs.length > 0) {
        const { error } = await this.supabase
          .from('jobs')
          .update({ 
            status: 'failed',
            error: 'Job stuck in processing state - automatically failed'
          })
          .in('id', stuckJobs.map(j => j.id));
        
        if (error) {
          throw new Error(`Failed to cleanup stuck jobs: ${error.message}`);
        }
        
        log('info', 'Cleaned up stuck jobs', { count: stuckJobs.length });
        return stuckJobs.length;
      }
      
      return 0;
    } catch (error) {
      log('error', 'Failed to cleanup stuck jobs', { error: error.message });
      throw error;
    }
  }
  
  async prioritizeJobs(priorityRules: Array<{
    condition: string;
    priority: number;
  }>): Promise<void> {
    try {
      // This would require adding a priority column to the jobs table
      // For now, we'll just log the intention
      log('info', 'Job prioritization requested', { rules: priorityRules.length });
      
      // TODO: Implement job prioritization logic
      // This could involve updating job records with priority scores
      // and modifying the worker-pull query to order by priority
      
    } catch (error) {
      log('error', 'Failed to prioritize jobs', { error: error.message });
      throw error;
    }
  }
}

// Circuit breaker for external services
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private resetTimeout: number = 30000 // 30 seconds
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime < this.timeout) {
        throw new Error('Circuit breaker is open');
      }
      this.state = 'half-open';
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
  
  getState(): string {
    return this.state;
  }
  
  getFailures(): number {
    return this.failures;
  }
}
