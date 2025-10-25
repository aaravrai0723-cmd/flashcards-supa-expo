import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export function getFileMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    
    // Videos
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'webm': 'video/webm',
    'mkv': 'video/x-matroska',
    
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'rtf': 'application/rtf',
    
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'm4a': 'audio/mp4',
    'aac': 'audio/aac',
    'ogg': 'audio/ogg',
  };
  
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function isVideoFile(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

export function isPdfFile(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}

export function isAudioFile(mimeType: string): boolean {
  return mimeType.startsWith('audio/');
}

export function getFileSizeString(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

export function validateFileSize(bytes: number, maxSizeMB: number = 100): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return bytes <= maxBytes;
}

export function validateFileType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimeType);
}

export async function getFileInfo(uri: string) {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) {
      throw new Error('File does not exist');
    }
    
    return {
      uri: info.uri,
      size: info.size || 0,
      exists: info.exists,
      isDirectory: info.isDirectory,
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    throw error;
  }
}

export function createStoragePath(userId: string, filename: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const ext = filename.split('.').pop();
  const safeFilename = `${timestamp}-${randomId}.${ext}`;
  
  return `${userId}/${safeFilename}`;
}

export function getSignedUrlPath(storagePath: string): string {
  // Remove the user ID prefix for signed URL generation
  return storagePath.split('/').slice(1).join('/');
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60));
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function getVideoThumbnailUrl(videoUrl: string, timestamp: number = 0): string {
  // This would typically be handled by a video processing service
  // For now, return a placeholder
  return `${videoUrl}?t=${timestamp}`;
}

export function getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    // This would typically use an image processing library
    // For now, return default dimensions
    resolve({ width: 1920, height: 1080 });
  });
}

export function isAccessibilityEnabled(): boolean {
  // Check if accessibility features are enabled
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export function getAccessibilityLabel(mediaType: string, altText?: string): string {
  if (altText) {
    return altText;
  }
  
  switch (mediaType) {
    case 'image':
      return 'Image content';
    case 'video':
      return 'Video content';
    case 'audio':
      return 'Audio content';
    default:
      return 'Media content';
  }
}

export function getCaptionsAvailableLabel(): string {
  return 'Captions available';
}
