import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { 
  verifyWebhookSignatureAsync, 
  createServiceRoleClient, 
  getRequiredEnv,
  validateFileUpload,
  log,
  createResponse,
  createErrorResponse,
  JOB_TYPES
} from '../_internals/utils.ts';

// Webhook handler for storage uploads
serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405);
    }

    // Get webhook secret from environment
    const webhookSecret = getRequiredEnv('FILE_PROCESSING_WEBHOOK_SECRET');
    
    // Verify webhook signature
    const signature = req.headers.get('x-webhook-signature');
    if (!signature) {
      log('error', 'Missing webhook signature');
      return createErrorResponse('Missing signature', 401);
    }

    // Get request body
    const body = await req.text();
    
    // Verify signature
    const isValid = await verifyWebhookSignatureAsync(body, signature, webhookSecret);
    if (!isValid) {
      log('error', 'Invalid webhook signature');
      return createErrorResponse('Invalid signature', 401);
    }

    // Parse webhook payload
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      log('error', 'Invalid JSON payload', { error: error.message });
      return createErrorResponse('Invalid JSON payload', 400);
    }

    log('info', 'Processing webhook payload', { 
      type: payload.type,
      record: payload.record 
    });

    // Handle storage upload events
    if (payload.type === 'INSERT' && payload.table === 'objects') {
      await handleStorageUpload(payload.record);
    } else {
      log('info', 'Ignoring non-storage event', { type: payload.type, table: payload.table });
    }

    return createResponse({ status: 'accepted' }, 202);

  } catch (error) {
    log('error', 'Webhook processing failed', { error: error.message });
    return createErrorResponse('Internal server error', 500);
  }
});

// Handle storage upload event
async function handleStorageUpload(record: any) {
  try {
    const supabase = createServiceRoleClient();
    
    // Extract file information from storage record
    const {
      bucket_id,
      name: storagePath,
      metadata
    } = record;

    // Only process files uploaded to 'ingest' bucket
    if (bucket_id !== 'ingest') {
      log('info', 'Ignoring non-ingest bucket upload', { bucket_id });
      return;
    }

    // Extract file metadata
    const mimeType = metadata?.mimetype || 'application/octet-stream';
    const fileSize = metadata?.size ? parseInt(metadata.size) : 0;
    
    // Validate file upload
    const validation = validateFileUpload(mimeType, fileSize);
    if (!validation.valid) {
      log('error', 'File validation failed', { 
        storagePath, 
        mimeType, 
        fileSize, 
        error: validation.error 
      });
      return;
    }

    // Parse storage path to get user ID
    const pathParts = storagePath.split('/');
    if (pathParts.length < 2) {
      log('error', 'Invalid storage path format', { storagePath });
      return;
    }
    
    const owner = pathParts[0]; // User ID from path

    // Determine job type based on content type
    let jobType: string;
    if (mimeType.startsWith('image/')) {
      jobType = JOB_TYPES.INGEST_IMAGE;
    } else if (mimeType.startsWith('video/')) {
      jobType = JOB_TYPES.INGEST_VIDEO;
    } else if (mimeType === 'application/pdf') {
      jobType = JOB_TYPES.INGEST_PDF;
    } else {
      log('error', 'Unsupported file type for processing', { mimeType, storagePath });
      return;
    }

    // Create ingest file record
    const { data: ingestFile, error: ingestError } = await supabase
      .from('ingest_files')
      .insert({
        owner,
        source: 'upload',
        storage_path: storagePath,
        mime_type: mimeType,
        meta: {
          original_metadata: metadata,
          uploaded_at: new Date().toISOString()
        }
      })
      .select('id')
      .single();

    if (ingestError) {
      log('error', 'Failed to create ingest file record', { 
        error: ingestError.message, 
        storagePath 
      });
      return;
    }

    // Create processing job
    const { error: jobError } = await supabase
      .from('jobs')
      .insert({
        type: jobType,
        status: 'queued',
        input: {
          ingest_file_id: ingestFile.id,
          storage_path: storagePath,
          mime_type: mimeType,
          file_size: fileSize,
          owner,
          metadata
        },
        created_by: owner
      });

    if (jobError) {
      log('error', 'Failed to create processing job', { 
        error: jobError.message, 
        storagePath,
        jobType 
      });
      return;
    }

    log('info', 'Successfully created processing job', { 
      storagePath, 
      jobType, 
      ingestFileId: ingestFile.id,
      owner 
    });

  } catch (error) {
    log('error', 'Failed to handle storage upload', { 
      error: error.message, 
      record 
    });
  }
}

// Alternative handler for direct file processing requests
export async function handleDirectUpload(
  storagePath: string,
  mimeType: string,
  owner: string,
  metadata: any = {}
) {
  try {
    const supabase = createServiceRoleClient();
    
    // Validate file upload
    const fileSize = metadata?.size ? parseInt(metadata.size) : 0;
    const validation = validateFileUpload(mimeType, fileSize);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Determine job type
    let jobType: string;
    if (mimeType.startsWith('image/')) {
      jobType = JOB_TYPES.INGEST_IMAGE;
    } else if (mimeType.startsWith('video/')) {
      jobType = JOB_TYPES.INGEST_VIDEO;
    } else if (mimeType === 'application/pdf') {
      jobType = JOB_TYPES.INGEST_PDF;
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    // Create ingest file record
    const { data: ingestFile, error: ingestError } = await supabase
      .from('ingest_files')
      .insert({
        owner,
        source: 'upload',
        storage_path: storagePath,
        mime_type: mimeType,
        meta: {
          ...metadata,
          uploaded_at: new Date().toISOString()
        }
      })
      .select('id')
      .single();

    if (ingestError) {
      throw new Error(`Failed to create ingest file record: ${ingestError.message}`);
    }

    // Create processing job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        type: jobType,
        status: 'queued',
        input: {
          ingest_file_id: ingestFile.id,
          storage_path: storagePath,
          mime_type: mimeType,
          file_size: fileSize,
          owner,
          metadata
        },
        created_by: owner
      })
      .select('id')
      .single();

    if (jobError) {
      throw new Error(`Failed to create processing job: ${jobError.message}`);
    }

    log('info', 'Successfully created processing job', { 
      storagePath, 
      jobType, 
      jobId: job.id,
      ingestFileId: ingestFile.id 
    });

    return {
      jobId: job.id,
      ingestFileId: ingestFile.id,
      status: 'queued'
    };

  } catch (error) {
    log('error', 'Failed to handle direct upload', { 
      error: error.message, 
      storagePath,
      mimeType,
      owner 
    });
    throw error;
  }
}
