import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/hooks/useAuth';

interface CreateDeckModalProps {
  visible: boolean;
  onClose: () => void;
  onDeckCreated?: () => void;
}

export function CreateDeckModal({ visible, onClose, onDeckCreated }: CreateDeckModalProps) {
  const { supabase } = useSupabase();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public' | 'unlisted'>('private');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a deck title');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'You must be signed in to create a deck');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('decks')
        .insert({
          title: title.trim(),
          description: description.trim(),
          visibility,
          owner: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Success', 'Deck created successfully!');
      setTitle('');
      setDescription('');
      setVisibility('private');
      onDeckCreated?.();
      onClose();
    } catch (error: any) {
      console.error('Error creating deck:', error);
      Alert.alert('Error', error.message || 'Failed to create deck');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle('');
      setDescription('');
      setVisibility('private');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-gray-900 rounded-t-3xl shadow-lg max-h-[90%]">
            {/* Header */}
            <View className="flex-row justify-between items-center p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                Create New Deck
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                disabled={loading}
                className="p-2"
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="px-6 py-4">
              {/* Title Input */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g., Spanish Vocabulary"
                  placeholderTextColor="#9ca3af"
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
                  editable={!loading}
                />
              </View>

              {/* Description Input */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What's this deck about?"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white min-h-[80px]"
                  editable={!loading}
                  textAlignVertical="top"
                />
              </View>

              {/* Visibility Selector */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Visibility
                </Text>
                <View className="space-y-2">
                  {[
                    {
                      value: 'private' as const,
                      label: 'Private',
                      icon: 'lock-closed-outline' as const,
                      description: 'Only you can see this deck',
                    },
                    {
                      value: 'unlisted' as const,
                      label: 'Unlisted',
                      icon: 'link-outline' as const,
                      description: 'Anyone with the link can view',
                    },
                    {
                      value: 'public' as const,
                      label: 'Public',
                      icon: 'globe-outline' as const,
                      description: 'Everyone can find and view this deck',
                    },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setVisibility(option.value)}
                      disabled={loading}
                      className={`flex-row items-center p-4 rounded-lg border-2 ${
                        visibility === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                      <View
                        className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                          visibility === option.value
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {visibility === option.value && (
                          <View className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </View>
                      <Ionicons
                        name={option.icon}
                        size={20}
                        color={visibility === option.value ? '#3b82f6' : '#6b7280'}
                      />
                      <View className="flex-1 ml-3">
                        <Text
                          className={`font-medium ${
                            visibility === option.value
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {option.label}
                        </Text>
                        <Text className="text-xs text-gray-500 dark:text-gray-400">
                          {option.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row space-x-3 mb-4">
                <Button
                  onPress={handleClose}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  <Text className="text-gray-700 dark:text-gray-300">Cancel</Text>
                </Button>
                <Button
                  onPress={handleCreate}
                  className="flex-1"
                  loading={loading}
                  disabled={loading || !title.trim()}
                >
                  <Ionicons name="add-circle-outline" size={20} color="white" />
                  <Text className="ml-2 text-white">Create Deck</Text>
                </Button>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
