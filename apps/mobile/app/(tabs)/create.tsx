import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/hooks/useSupabase';
import { useRealtimeJobs } from '@/hooks/useRealtimeJobs';
import { getFileMimeType, isImageFile, isVideoFile, isPdfFile, createStoragePath } from '@/utils/media';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface UploadedFile {
  uri: string;
  name: string;
  size: number;
  type: string;
  mimeType: string;
}

export default function CreateScreen() {
  const { user, loading } = useAuth();
  const { supabase } = useSupabase();
  const { getProcessingJobs } = useRealtimeJobs();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [processingJobs, setProcessingJobs] = useState<any[]>([]);

  // Show auth required screen if not logged in
  if (!loading && !user) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="lock-closed-outline" size={64} color="#6b7280" />
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-6 text-center">
            Sign In Required
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 mt-3 text-center">
            You need to sign in to upload media and create flashcards
          </Text>
          <View className="mt-8 w-full max-w-sm">
            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Please restart the app or navigate to sign in
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as ImagePicker.MediaType[],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const files = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          size: asset.fileSize || 0,
          type: 'image',
          mimeType: getFileMimeType(asset.fileName || 'image.jpg'),
        }));
        
        setUploadedFiles(prev => [...prev, ...files]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'] as ImagePicker.MediaType[],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const files = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.fileName || `video_${Date.now()}.mp4`,
          size: asset.fileSize || 0,
          type: 'video',
          mimeType: getFileMimeType(asset.fileName || 'video.mp4'),
        }));
        
        setUploadedFiles(prev => [...prev, ...files]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick videos');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled) {
        const files = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.name,
          size: asset.size || 0,
          type: 'document',
          mimeType: getFileMimeType(asset.name),
        }));
        
        setUploadedFiles(prev => [...prev, ...files]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick documents');
    }
  };

  const uploadFile = async (file: UploadedFile) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated. Please sign in and try again.');
      }

      const storagePath = createStoragePath(user.id, file.name);
      console.log('Uploading file:', { userId: user.id, storagePath, mimeType: file.mimeType });

      // Verify auth session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Authentication session invalid. Please sign in again.');
      }
      console.log('Auth session valid:', { userId: session.user.id });

      // Read file from local URI as base64
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: 'base64',
      });

      // Convert base64 to binary for upload
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Upload to Supabase Storage
      // The storage trigger will automatically create the ingest_file record and job
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ingest')
        .upload(storagePath, bytes.buffer, {
          contentType: file.mimeType,
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error details:', uploadError);
        throw uploadError;
      }
      console.log('Upload successful - processing will start automatically:', uploadData);

      // Note: The database trigger handles creating ingest_files and jobs records automatically
      return { uploadData };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      Alert.alert('No files', 'Please select files to upload');
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = uploadedFiles.map(file => uploadFile(file));
      const results = await Promise.all(uploadPromises);
      
      Alert.alert(
        'Upload Successful',
        `Successfully uploaded ${results.length} files. Processing has started.`
      );
      
      setUploadedFiles([]);
    } catch (error) {
      Alert.alert('Upload Failed', error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (mimeType: string) => {
    if (isImageFile(mimeType)) return 'image-outline';
    if (isVideoFile(mimeType)) return 'videocam-outline';
    if (isPdfFile(mimeType)) return 'document-text-outline';
    return 'document-outline';
  };

  const getFileTypeColor = (mimeType: string) => {
    if (isImageFile(mimeType)) return 'text-green-600';
    if (isVideoFile(mimeType)) return 'text-blue-600';
    if (isPdfFile(mimeType)) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="flex-1">
        <View className="p-6 pb-4">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            Upload Media
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 mt-1">
            Upload images, videos, or PDFs to generate flashcards
          </Text>
        </View>

        <ScrollView className="flex-1 px-6">
          {/* Upload Options */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Choose Media Type
            </Text>
            <View className="flex-row space-x-3">
              <Button
                onPress={pickImage}
                variant="outline"
                className="flex-1"
              >
                <Ionicons name="image-outline" size={20} color="#3b82f6" />
                <Text className="ml-2 text-blue-600">Images</Text>
              </Button>
              <Button
                onPress={pickVideo}
                variant="outline"
                className="flex-1"
              >
                <Ionicons name="videocam-outline" size={20} color="#3b82f6" />
                <Text className="ml-2 text-blue-600">Videos</Text>
              </Button>
              <Button
                onPress={pickDocument}
                variant="outline"
                className="flex-1"
              >
                <Ionicons name="document-text-outline" size={20} color="#3b82f6" />
                <Text className="ml-2 text-blue-600">PDFs</Text>
              </Button>
            </View>
          </View>

          {/* Selected Files */}
          {uploadedFiles.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Selected Files ({uploadedFiles.length})
              </Text>
              <View className="space-y-3">
                {uploadedFiles.map((file, index) => (
                  <Card key={index} className="p-4">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <Ionicons 
                          name={getFileIcon(file.mimeType)} 
                          size={24} 
                          color="#6b7280" 
                        />
                        <View className="ml-3 flex-1">
                          <Text className="font-medium text-gray-900 dark:text-white">
                            {file.name}
                          </Text>
                          <Text className={`text-sm ${getFileTypeColor(file.mimeType)}`}>
                            {file.type.toUpperCase()} • {(file.size / 1024 / 1024).toFixed(1)} MB
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeFile(index)}
                        className="p-2"
                      >
                        <Ionicons name="close-circle" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </Card>
                ))}
              </View>
              
              <Button
                onPress={handleUpload}
                loading={uploading}
                className="mt-4"
                disabled={uploading}
              >
                <Ionicons name="cloud-upload-outline" size={20} color="white" />
                <Text className="ml-2 text-white">
                  {uploading ? 'Uploading...' : 'Upload & Process'}
                </Text>
              </Button>
            </View>
          )}

          {/* Processing Status */}
          {processingJobs.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Processing Status
              </Text>
              <View className="space-y-3">
                {processingJobs.map((job, index) => (
                  <Card key={index} className="p-4">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Ionicons name="sync" size={20} color="#3b82f6" />
                        <Text className="ml-3 text-gray-900 dark:text-white">
                          {job.type.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                      <Tag variant="warning" size="sm">
                        {job.status.toUpperCase()}
                      </Tag>
                    </View>
                  </Card>
                ))}
              </View>
            </View>
          )}

          {/* Instructions */}
          <Card className="p-4 mb-6">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              How it works
            </Text>
            <View className="space-y-2">
              <Text className="text-gray-600 dark:text-gray-400">
                1. Select images, videos, or PDFs from your device
              </Text>
              <Text className="text-gray-600 dark:text-gray-400">
                2. Files are uploaded to our secure storage
              </Text>
              <Text className="text-gray-600 dark:text-gray-400">
                3. AI processes your content to extract key information
              </Text>
              <Text className="text-gray-600 dark:text-gray-400">
                4. Flashcards are automatically generated and added to your deck
              </Text>
            </View>
          </Card>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
