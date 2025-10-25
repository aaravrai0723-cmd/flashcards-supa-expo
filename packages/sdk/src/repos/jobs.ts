import { getSupabaseClient } from '../client';
import type { Tables, Database } from '../types/database';

type Job = Tables<'jobs'>;
type JobInsert = Database['public']['Tables']['jobs']['Insert'];
type JobUpdate = Database['public']['Tables']['jobs']['Update'];
type IngestFile = Tables<'ingest_files'>;
type IngestFileInsert = Database['public']['Tables']['ingest_files']['Insert'];

export class JobsRepository {
  private client = getSupabaseClient();

  /**
   * Get all jobs for the current user
   */
  async getMyJobs(): Promise<Job[]> {
    const { data, error } = await this.client
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch jobs: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get jobs by status
   */
  async getJobsByStatus(status: 'queued' | 'processing' | 'done' | 'failed'): Promise<Job[]> {
    const { data, error } = await this.client
      .from('jobs')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch jobs by status: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get jobs by type
   */
  async getJobsByType(type: 'ingest_image' | 'ingest_video' | 'ingest_pdf' | 'ai_generate_cards'): Promise<Job[]> {
    const { data, error } = await this.client
      .from('jobs')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch jobs by type: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single job by ID
   */
  async getJobById(id: number): Promise<Job | null> {
    const { data, error } = await this.client
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Job not found
      }
      throw new Error(`Failed to fetch job: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new job
   */
  async createJob(job: JobInsert): Promise<Job> {
    const { data, error } = await this.client
      .from('jobs')
      .insert(job)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create job: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a job
   */
  async updateJob(id: number, updates: JobUpdate): Promise<Job> {
    const { data, error } = await this.client
      .from('jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update job: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a job
   */
  async deleteJob(id: number): Promise<void> {
    const { error } = await this.client
      .from('jobs')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete job: ${error.message}`);
    }
  }

  /**
   * Mark a job as processing
   */
  async markJobAsProcessing(id: number): Promise<Job> {
    return this.updateJob(id, { status: 'processing' });
  }

  /**
   * Mark a job as completed
   */
  async markJobAsCompleted(id: number, output: any): Promise<Job> {
    return this.updateJob(id, { 
      status: 'done', 
      output 
    });
  }

  /**
   * Mark a job as failed
   */
  async markJobAsFailed(id: number, error: string): Promise<Job> {
    return this.updateJob(id, { 
      status: 'failed', 
      error 
    });
  }

  /**
   * Get next queued job of a specific type (for background processing)
   */
  async getNextQueuedJob(type?: 'ingest_image' | 'ingest_video' | 'ingest_pdf' | 'ai_generate_cards'): Promise<Job | null> {
    let queryBuilder = this.client
      .from('jobs')
      .select('*')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(1);

    if (type) {
      queryBuilder = queryBuilder.eq('type', type);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to fetch next queued job: ${error.message}`);
    }

    return data?.[0] || null;
  }

  /**
   * Create an image ingestion job
   */
  async createImageIngestionJob(input: {
    storagePath: string;
    mimeType: string;
    metadata?: any;
  }): Promise<Job> {
    return this.createJob({
      type: 'ingest_image',
      status: 'queued',
      input: {
        storage_path: input.storagePath,
        mime_type: input.mimeType,
        metadata: input.metadata,
      },
    });
  }

  /**
   * Create a video ingestion job
   */
  async createVideoIngestionJob(input: {
    storagePath: string;
    mimeType: string;
    metadata?: any;
  }): Promise<Job> {
    return this.createJob({
      type: 'ingest_video',
      status: 'queued',
      input: {
        storage_path: input.storagePath,
        mime_type: input.mimeType,
        metadata: input.metadata,
      },
    });
  }

  /**
   * Create a PDF ingestion job
   */
  async createPdfIngestionJob(input: {
    storagePath: string;
    mimeType: string;
    metadata?: any;
  }): Promise<Job> {
    return this.createJob({
      type: 'ingest_pdf',
      status: 'queued',
      input: {
        storage_path: input.storagePath,
        mime_type: input.mimeType,
        metadata: input.metadata,
      },
    });
  }

  /**
   * Create an AI card generation job
   */
  async createAiCardGenerationJob(input: {
    deckId: number;
    prompt: string;
    count?: number;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    bloomLevel?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  }): Promise<Job> {
    return this.createJob({
      type: 'ai_generate_cards',
      status: 'queued',
      input: {
        deck_id: input.deckId,
        prompt: input.prompt,
        count: input.count || 1,
        difficulty: input.difficulty,
        bloom_level: input.bloomLevel,
      },
    });
  }

  /**
   * Ingest Files Repository Methods
   */

  /**
   * Get all ingest files for the current user
   */
  async getMyIngestFiles(): Promise<IngestFile[]> {
    const { data, error } = await this.client
      .from('ingest_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch ingest files: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single ingest file by ID
   */
  async getIngestFileById(id: number): Promise<IngestFile | null> {
    const { data, error } = await this.client
      .from('ingest_files')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Ingest file not found
      }
      throw new Error(`Failed to fetch ingest file: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new ingest file record
   */
  async createIngestFile(ingestFile: IngestFileInsert): Promise<IngestFile> {
    const { data, error } = await this.client
      .from('ingest_files')
      .insert(ingestFile)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create ingest file: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an ingest file
   */
  async updateIngestFile(id: number, updates: Partial<IngestFileInsert>): Promise<IngestFile> {
    const { data, error } = await this.client
      .from('ingest_files')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update ingest file: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete an ingest file
   */
  async deleteIngestFile(id: number): Promise<void> {
    const { error } = await this.client
      .from('ingest_files')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete ingest file: ${error.message}`);
    }
  }

  /**
   * Get logical job status for a user (aggregated view)
   */
  async getJobStatusSummary(): Promise<{
    total: number;
    queued: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const { data, error } = await this.client
      .from('jobs')
      .select('status');

    if (error) {
      throw new Error(`Failed to fetch job status summary: ${error.message}`);
    }

    const summary = {
      total: data.length,
      queued: data.filter(job => job.status === 'queued').length,
      processing: data.filter(job => job.status === 'processing').length,
      completed: data.filter(job => job.status === 'done').length,
      failed: data.filter(job => job.status === 'failed').length,
    };

    return summary;
  }

  /**
   * Retry a failed job
   */
  async retryJob(id: number): Promise<Job> {
    return this.updateJob(id, { 
      status: 'queued',
      error: null 
    });
  }

  /**
   * Cancel a job (mark as failed with cancellation message)
   */
  async cancelJob(id: number): Promise<Job> {
    return this.updateJob(id, { 
      status: 'failed',
      error: 'Job cancelled by user' 
    });
  }

  /**
   * Enqueue an ingest job for file processing
   */
  async enqueueIngestJob(
    storagePath: string,
    mimeType: string,
    meta: any = {}
  ): Promise<{ jobId: number; ingestFileId: number; status: string }> {
    try {
      // Validate file type
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
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      // Determine job type based on MIME type
      let jobType: 'ingest_image' | 'ingest_video' | 'ingest_pdf';
      if (mimeType.startsWith('image/')) {
        jobType = 'ingest_image';
      } else if (mimeType.startsWith('video/')) {
        jobType = 'ingest_video';
      } else if (mimeType === 'application/pdf') {
        jobType = 'ingest_pdf';
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      // Create ingest file record
      const ingestFile = await this.createIngestFile({
        storage_path: storagePath,
        mime_type: mimeType,
        meta: {
          ...meta,
          uploaded_at: new Date().toISOString()
        }
      });

      // Create processing job
      const job = await this.createJob({
        type: jobType,
        status: 'queued',
        input: {
          ingest_file_id: ingestFile.id,
          storage_path: storagePath,
          mime_type: mimeType,
          meta
        }
      });

      return {
        jobId: job.id,
        ingestFileId: ingestFile.id,
        status: job.status
      };

    } catch (error) {
      throw new Error(`Failed to enqueue ingest job: ${error.message}`);
    }
  }
}

// Export singleton instance
export const jobsRepo = new JobsRepository();
