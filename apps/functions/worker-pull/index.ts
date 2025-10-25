import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { 
  createServiceRoleClient, 
  getRequiredEnv,
  log,
  createResponse,
  createErrorResponse,
  retryWithBackoff,
  JOB_TYPES,
  JOB_STATUS
} from '../_internals/utils.ts';
import { processImage, processVideo, processPDF } from '../_internals/media.ts';
import { createAIClient, GeneratedCard } from '../_internals/ai.ts';

// Worker endpoint for processing jobs
serve(async (req) => {
  try {
    // Verify worker secret
    const workerSecret = getRequiredEnv('JOB_WORKER_SECRET');
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || authHeader !== `Bearer ${workerSecret}`) {
      log('error', 'Invalid worker authentication');
      return createErrorResponse('Unauthorized', 401);
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405);
    }

    // Process jobs
    const result = await processJobs();
    
    return createResponse(result);

  } catch (error) {
    log('error', 'Worker processing failed', { error: error.message });
    return createErrorResponse('Internal server error', 500);
  }
});

// Main job processing function
async function processJobs(): Promise<{ processed: number; jobs: any[] }> {
  const supabase = createServiceRoleClient();
  const processedJobs = [];

  try {
    // Get next queued job atomically
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', JOB_STATUS.QUEUED)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // No jobs available
        log('info', 'No queued jobs found');
        return { processed: 0, jobs: [] };
      }
      throw fetchError;
    }

    log('info', 'Processing job', { jobId: job.id, type: job.type });

    // Mark job as processing
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ 
        status: JOB_STATUS.PROCESSING,
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);

    if (updateError) {
      throw new Error(`Failed to update job status: ${updateError.message}`);
    }

    try {
      // Process job based on type
      let result;
      switch (job.type) {
        case JOB_TYPES.INGEST_IMAGE:
          result = await processImageJob(job);
          break;
        case JOB_TYPES.INGEST_VIDEO:
          result = await processVideoJob(job);
          break;
        case JOB_TYPES.INGEST_PDF:
          result = await processPDFJob(job);
          break;
        case JOB_TYPES.AI_GENERATE_CARDS:
          result = await processAICardGenerationJob(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      // Mark job as completed
      await supabase
        .from('jobs')
        .update({ 
          status: JOB_STATUS.DONE,
          output: result,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      log('info', 'Job completed successfully', { jobId: job.id, type: job.type });
      processedJobs.push({ id: job.id, type: job.type, status: 'done', result });

    } catch (processingError) {
      // Mark job as failed
      await supabase
        .from('jobs')
        .update({ 
          status: JOB_STATUS.FAILED,
          error: processingError.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      log('error', 'Job processing failed', { 
        jobId: job.id, 
        type: job.type, 
        error: processingError.message 
      });
      
      processedJobs.push({ id: job.id, type: job.type, status: 'failed', error: processingError.message });
    }

    return { processed: 1, jobs: processedJobs };

  } catch (error) {
    log('error', 'Job processing error', { error: error.message });
    throw error;
  }
}

// Process image ingestion job
async function processImageJob(job: any): Promise<any> {
  const supabase = createServiceRoleClient();
  const { input } = job;
  
  try {
    log('info', 'Processing image job', { jobId: job.id, storagePath: input.storage_path });

    // Process the image
    const result = await processImage(input.storage_path);
    
    // Create media asset record
    const mediaAssetId = await createMediaAssetRecord(
      input.storage_path,
      'image',
      input.mime_type,
      input.owner,
      {
        width_px: result.metadata.width,
        height_px: result.metadata.height,
        alt_text: result.description.description,
        source_url: result.originalUrl
      }
    );

    // Create a draft card with AI-generated prompt
    const cardId = await createDraftCard(
      input.owner, // Using owner as a placeholder deck ID - in production, you'd have a default deck
      `Label the key parts of this image: ${result.description.description}`,
      mediaAssetId,
      {
        title: `Image Analysis - ${new Date().toLocaleDateString()}`,
        bloom_level: 'analyze',
        difficulty: 'intermediate',
        language_code: 'en'
      }
    );

    return {
      mediaAssetId,
      cardId,
      description: result.description,
      thumbnailUrl: result.thumbnailUrl,
      metadata: result.metadata
    };

  } catch (error) {
    log('error', 'Image job processing failed', { jobId: job.id, error: error.message });
    throw error;
  }
}

// Process video ingestion job
async function processVideoJob(job: any): Promise<any> {
  const supabase = createServiceRoleClient();
  const { input } = job;
  
  try {
    log('info', 'Processing video job', { jobId: job.id, storagePath: input.storage_path });

    // Process the video
    const result = await processVideo(input.storage_path);
    
    // Create media asset record for the video
    const mediaAssetId = await createMediaAssetRecord(
      input.storage_path,
      'video',
      input.mime_type,
      input.owner,
      {
        width_px: result.metadata.width,
        height_px: result.metadata.height,
        duration_seconds: result.metadata.duration,
        captions_path: result.captionsUrl,
        transcript_path: result.transcriptUrl,
        source_url: result.originalUrl
      }
    );

    // Create draft card for video analysis
    const keyframeDescriptions = result.keyframes.map(kf => kf.description.description).join('; ');
    const cardId = await createDraftCard(
      input.owner,
      `What's the next step in this video sequence? Key moments: ${keyframeDescriptions}`,
      mediaAssetId,
      {
        title: `Video Analysis - ${new Date().toLocaleDateString()}`,
        bloom_level: 'understand',
        difficulty: 'intermediate',
        language_code: 'en'
      }
    );

    return {
      mediaAssetId,
      cardId,
      keyframes: result.keyframes,
      captionsUrl: result.captionsUrl,
      transcriptUrl: result.transcriptUrl,
      metadata: result.metadata
    };

  } catch (error) {
    log('error', 'Video job processing failed', { jobId: job.id, error: error.message });
    throw error;
  }
}

// Process PDF ingestion job
async function processPDFJob(job: any): Promise<any> {
  const supabase = createServiceRoleClient();
  const { input } = job;
  
  try {
    log('info', 'Processing PDF job', { jobId: job.id, storagePath: input.storage_path });

    // Process the PDF
    const result = await processPDF(input.storage_path);
    
    const mediaAssets = [];
    const cards = [];

    // Create media assets and cards for each page
    for (const page of result.pages) {
      // Create media asset for page image
      const mediaAssetId = await createMediaAssetRecord(
        page.imageUrl,
        'image',
        'image/jpeg',
        input.owner,
        {
          alt_text: `PDF page ${page.pageNumber} content`,
          source_url: page.imageUrl
        }
      );

      mediaAssets.push(mediaAssetId);

      // Create draft card for the page
      const cardId = await createDraftCard(
        input.owner,
        `Analyze the content on page ${page.pageNumber}: ${page.summary}`,
        mediaAssetId,
        {
          title: `PDF Page ${page.pageNumber}`,
          bloom_level: 'analyze',
          difficulty: 'intermediate',
          language_code: 'en'
        }
      );

      cards.push(cardId);
    }

    return {
      mediaAssets,
      cards,
      pages: result.pages,
      metadata: result.metadata
    };

  } catch (error) {
    log('error', 'PDF job processing failed', { jobId: job.id, error: error.message });
    throw error;
  }
}

// Process AI card generation job
async function processAICardGenerationJob(job: any): Promise<any> {
  const supabase = createServiceRoleClient();
  const { input } = job;
  
  try {
    log('info', 'Processing AI card generation job', { jobId: job.id });

    const aiClient = createAIClient();
    
    // Get media assets if provided
    let content = '';
    if (input.media_asset_ids && input.media_asset_ids.length > 0) {
      const { data: mediaAssets } = await supabase
        .from('media_assets')
        .select('*')
        .in('id', input.media_asset_ids);

      if (mediaAssets) {
        // Generate content descriptions for AI
        const descriptions = await Promise.all(
          mediaAssets.map(async (asset) => {
            if (asset.type === 'image') {
              const imageUrl = await getMediaAssetUrl(asset.storage_path);
              const description = await aiClient.describeImage(imageUrl);
              return `${asset.type}: ${description.description}`;
            }
            return `${asset.type}: ${asset.alt_text || 'No description'}`;
          })
        );
        content = descriptions.join('\n\n');
      }
    }

    // Generate cards using AI
    const generatedCards = await aiClient.generateCards(content, {
      strategy: input.strategy || 'mcq',
      difficulty: input.difficulty || 'intermediate',
      bloomLevel: input.bloom_level || 'understand',
      context: input.context,
      learningObjective: input.learning_objective
    });

    // Create actual cards in the database
    const createdCards = [];
    for (const cardData of generatedCards) {
      const { data: card, error: cardError } = await supabase
        .from('cards')
        .insert({
          deck_id: input.deck_id,
          title: `AI Generated Card - ${new Date().toLocaleDateString()}`,
          prompt_text: cardData.prompt,
          answer_text: cardData.answer,
          bloom_level: cardData.bloomLevel,
          difficulty: cardData.difficulty,
          language_code: 'en',
          is_active: true
        })
        .select('id')
        .single();

      if (cardError) {
        log('error', 'Failed to create AI generated card', { error: cardError.message });
        continue;
      }

      createdCards.push(card.id);

      // Link media assets if provided
      if (input.media_asset_ids && input.media_asset_ids.length > 0) {
        await supabase
          .from('card_media')
          .insert(
            input.media_asset_ids.map((mediaAssetId: number) => ({
              card_id: card.id,
              media_asset_id: mediaAssetId,
              role: 'primary'
            }))
          );
      }
    }

    return {
      generatedCount: generatedCards.length,
      createdCards,
      strategy: input.strategy,
      difficulty: input.difficulty
    };

  } catch (error) {
    log('error', 'AI card generation job failed', { jobId: job.id, error: error.message });
    throw error;
  }
}

// Helper functions
async function createMediaAssetRecord(
  storagePath: string,
  type: 'image' | 'video' | 'pdf',
  mimeType: string,
  owner: string,
  metadata: any = {}
): Promise<number> {
  const supabase = createServiceRoleClient();
  
  const { data, error } = await supabase
    .from('media_assets')
    .insert({
      type,
      storage_path: storagePath,
      mime_type: mimeType,
      owner,
      ...metadata
    })
    .select('id')
    .single();
  
  if (error) {
    throw new Error(`Failed to create media asset record: ${error.message}`);
  }
  
  return data.id;
}

async function createDraftCard(
  deckId: number | string,
  prompt: string,
  mediaAssetId?: number,
  metadata: any = {}
): Promise<number> {
  const supabase = createServiceRoleClient();
  
  // If deckId is a string (owner), create or find a default deck
  let actualDeckId = deckId;
  if (typeof deckId === 'string') {
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .select('id')
      .eq('owner', deckId)
      .eq('title', 'Auto-generated Deck')
      .single();

    if (deckError && deckError.code === 'PGRST116') {
      // Create default deck
      const { data: newDeck, error: createError } = await supabase
        .from('decks')
        .insert({
          owner: deckId,
          title: 'Auto-generated Deck',
          description: 'Automatically created deck for processed content',
          visibility: 'private'
        })
        .select('id')
        .single();

      if (createError) {
        throw new Error(`Failed to create default deck: ${createError.message}`);
      }
      actualDeckId = newDeck.id;
    } else if (deckError) {
      throw new Error(`Failed to find default deck: ${deckError.message}`);
    } else {
      actualDeckId = deck.id;
    }
  }
  
  const { data, error } = await supabase
    .from('cards')
    .insert({
      deck_id: actualDeckId,
      prompt_text: prompt,
      answer_text: 'Draft - needs completion',
      is_active: false, // Mark as draft
      ...metadata
    })
    .select('id')
    .single();
  
  if (error) {
    throw new Error(`Failed to create draft card: ${error.message}`);
  }
  
  // Link media asset if provided
  if (mediaAssetId) {
    await supabase
      .from('card_media')
      .insert({
        card_id: data.id,
        media_asset_id: mediaAssetId,
        role: 'primary'
      });
  }
  
  return data.id;
}

async function getMediaAssetUrl(storagePath: string, bucket: string = 'media'): Promise<string> {
  const supabase = createServiceRoleClient();
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, 3600);
  
  if (error) {
    throw new Error(`Failed to get signed URL: ${error.message}`);
  }
  
  return data.signedUrl;
}
