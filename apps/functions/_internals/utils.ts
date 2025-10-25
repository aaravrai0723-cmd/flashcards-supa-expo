import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Database } from '../../../packages/sdk/src/types/database.ts';

// HMAC verification utility for webhooks
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Parse the signature header (format: "sha256=...")
    const [algorithm, hash] = signature.split('=');
    
    if (algorithm !== 'sha256') {
      console.error('Unsupported signature algorithm:', algorithm);
      return false;
    }

    // Create HMAC-SHA256 signature
    const encoder = new TextEncoder();
    const key = encoder.encode(secret);
    const data = encoder.encode(payload);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, data);
    const expectedHash = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return expectedHash === hash;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// Alternative HMAC verification using Web Crypto API
export async function verifyWebhookSignatureAsync(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const [algorithm, hash] = signature.split('=');
    
    if (algorithm !== 'sha256') {
      return false;
    }

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );
    
    const expectedHash = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return expectedHash === hash;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// Supabase client factory with service role
export function createServiceRoleClient(): ReturnType<typeof createClient<Database>> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Helper to get environment variable with validation
export function getRequiredEnv(key: string): string {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Helper to get environment variable with default
export function getEnv(key: string, defaultValue: string): string {
  return Deno.env.get(key) || defaultValue;
}

// Generate a secure random string
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomArray = new Uint8Array(length);
  crypto.getRandomValues(randomArray);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomArray[i] % chars.length];
  }
  
  return result;
}

// Validate file type and size
export function validateFileUpload(
  mimeType: string,
  fileSize: number,
  maxSizeBytes: number = 100 * 1024 * 1024 // 100MB default
): { valid: boolean; error?: string } {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'application/pdf'
  ];

  if (!allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `Unsupported file type: ${mimeType}`
    };
  }

  if (fileSize > maxSizeBytes) {
    return {
      valid: false,
      error: `File too large: ${fileSize} bytes (max: ${maxSizeBytes})`
    };
  }

  return { valid: true };
}

// Parse storage path to extract user ID and filename
export function parseStoragePath(storagePath: string): { userId: string; filename: string; folder?: string } {
  const parts = storagePath.split('/');
  
  if (parts.length < 2) {
    throw new Error('Invalid storage path format');
  }
  
  const userId = parts[0];
  const filename = parts[parts.length - 1];
  const folder = parts.length > 2 ? parts.slice(1, -1).join('/') : undefined;
  
  return { userId, filename, folder };
}

// Create storage path for user uploads
export function createStoragePath(userId: string, filename: string, folder?: string): string {
  const timestamp = Date.now();
  const randomId = generateSecureToken(8);
  const ext = filename.split('.').pop();
  const safeFilename = `${timestamp}-${randomId}.${ext}`;
  
  if (folder) {
    return `${userId}/${folder}/${safeFilename}`;
  }
  
  return `${userId}/${safeFilename}`;
}

// Retry utility with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Logging utility with structured format
export function log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(data && { data })
  };
  
  console.log(JSON.stringify(logEntry));
}

// HTTP response helpers
export function createResponse(
  data: any,
  status: number = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

export function createErrorResponse(
  message: string,
  status: number = 400,
  details?: any
): Response {
  return createResponse(
    { error: message, ...(details && { details }) },
    status
  );
}

// Job status helpers
export const JOB_STATUS = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  DONE: 'done',
  FAILED: 'failed'
} as const;

export const JOB_TYPES = {
  INGEST_IMAGE: 'ingest_image',
  INGEST_VIDEO: 'ingest_video',
  INGEST_PDF: 'ingest_pdf',
  AI_GENERATE_CARDS: 'ai_generate_cards'
} as const;
