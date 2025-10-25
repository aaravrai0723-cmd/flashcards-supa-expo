import { getSupabaseClient } from '../client';
import type { Tables, Database } from '../types/database';

type MediaAsset = Tables<'media_assets'>;
type MediaAssetInsert = Database['public']['Tables']['media_assets']['Insert'];
type MediaAssetUpdate = Database['public']['Tables']['media_assets']['Update'];

export class MediaRepository {
  private client = getSupabaseClient();

  /**
   * Get all media assets for the current user
   */
  async getMyMediaAssets(): Promise<MediaAsset[]> {
    const { data, error } = await this.client
      .from('media_assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch media assets: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single media asset by ID
   */
  async getMediaAssetById(id: number): Promise<MediaAsset | null> {
    const { data, error } = await this.client
      .from('media_assets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Media asset not found
      }
      throw new Error(`Failed to fetch media asset: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new media asset record
   */
  async createMediaAsset(mediaAsset: MediaAssetInsert): Promise<MediaAsset> {
    const { data, error } = await this.client
      .from('media_assets')
      .insert(mediaAsset)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create media asset: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a media asset
   */
  async updateMediaAsset(id: number, updates: MediaAssetUpdate): Promise<MediaAsset> {
    const { data, error } = await this.client
      .from('media_assets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update media asset: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a media asset
   */
  async deleteMediaAsset(id: number): Promise<void> {
    const { error } = await this.client
      .from('media_assets')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete media asset: ${error.message}`);
    }
  }

  /**
   * Get media assets by type
   */
  async getMediaAssetsByType(type: 'image' | 'video' | 'pdf'): Promise<MediaAsset[]> {
    const { data, error } = await this.client
      .from('media_assets')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch media assets by type: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Search media assets by alt text or other fields
   */
  async searchMediaAssets(query: string, type?: 'image' | 'video' | 'pdf'): Promise<MediaAsset[]> {
    let queryBuilder = this.client
      .from('media_assets')
      .select('*')
      .or(`alt_text.ilike.%${query}%,source_url.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (type) {
      queryBuilder = queryBuilder.eq('type', type);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to search media assets: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Upload a file to storage and create a media asset record
   */
  async uploadFile(
    file: File | Blob,
    fileName: string,
    bucket: 'media' | 'derived' | 'ingest' = 'media',
    metadata?: Partial<MediaAssetInsert>
  ): Promise<{ path: string; mediaAsset: MediaAsset }> {
    const fileExt = fileName.split('.').pop();
    const filePath = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Upload file to storage
    const { error: uploadError } = await this.client.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Determine media type from MIME type
    let mediaType: 'image' | 'video' | 'pdf' = 'image';
    if (file instanceof File) {
      if (file.type.startsWith('video/')) {
        mediaType = 'video';
      } else if (file.type === 'application/pdf') {
        mediaType = 'pdf';
      }
    }

    // Create media asset record
    const mediaAssetData: MediaAssetInsert = {
      type: mediaType,
      storage_path: filePath,
      mime_type: file instanceof File ? file.type : 'application/octet-stream',
      ...metadata,
    };

    const mediaAsset = await this.createMediaAsset(mediaAssetData);

    return { path: filePath, mediaAsset };
  }

  /**
   * Get a signed URL for a media asset
   */
  async getSignedUrl(storagePath: string, bucket: 'media' | 'derived' | 'ingest' = 'media', expiresIn = 3600): Promise<string> {
    const { data, error } = await this.client.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * Get a public URL for a media asset (if bucket is public)
   */
  getPublicUrl(storagePath: string, bucket: 'media' | 'derived' | 'ingest' = 'media'): string {
    const { data } = this.client.storage
      .from(bucket)
      .getPublicUrl(storagePath);

    return data.publicUrl;
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(storagePath: string, bucket: 'media' | 'derived' | 'ingest' = 'media'): Promise<void> {
    const { error } = await this.client.storage
      .from(bucket)
      .remove([storagePath]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Download a file from storage
   */
  async downloadFile(storagePath: string, bucket: 'media' | 'derived' | 'ingest' = 'media'): Promise<Blob> {
    const { data, error } = await this.client.storage
      .from(bucket)
      .download(storagePath);

    if (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }

    return data;
  }

  /**
   * Get file info from storage
   */
  async getFileInfo(storagePath: string, bucket: 'media' | 'derived' | 'ingest' = 'media') {
    const { data, error } = await this.client.storage
      .from(bucket)
      .list('', {
        search: storagePath,
      });

    if (error) {
      throw new Error(`Failed to get file info: ${error.message}`);
    }

    return data?.[0] || null;
  }

  /**
   * List files in a storage bucket
   */
  async listFiles(bucket: 'media' | 'derived' | 'ingest' = 'media', folder = '', limit = 100): Promise<any[]> {
    const { data, error } = await this.client.storage
      .from(bucket)
      .list(folder, {
        limit,
        offset: 0,
      });

    if (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Copy a file within storage
   */
  async copyFile(
    sourcePath: string,
    destinationPath: string,
    sourceBucket: 'media' | 'derived' | 'ingest' = 'media',
    destinationBucket?: 'media' | 'derived' | 'ingest'
  ): Promise<void> {
    const targetBucket = destinationBucket || sourceBucket;
    
    const { error } = await this.client.storage
      .from(sourceBucket)
      .copy(sourcePath, destinationPath);

    if (error) {
      throw new Error(`Failed to copy file: ${error.message}`);
    }

    // If copying to a different bucket, we need to download and upload
    if (destinationBucket && destinationBucket !== sourceBucket) {
      const file = await this.downloadFile(sourcePath, sourceBucket);
      await this.uploadFile(file, destinationPath, destinationBucket);
    }
  }

  /**
   * Move a file within storage
   */
  async moveFile(
    sourcePath: string,
    destinationPath: string,
    bucket: 'media' | 'derived' | 'ingest' = 'media'
  ): Promise<void> {
    // Copy first
    await this.copyFile(sourcePath, destinationPath, bucket);
    
    // Then delete original
    await this.deleteFile(sourcePath, bucket);
  }
}

// Export singleton instance
export const mediaRepo = new MediaRepository();
