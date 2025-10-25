import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeJobs } from '@/hooks/useRealtimeJobs';
import { useSupabase } from '@/hooks/useSupabase';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Deck {
  id: number;
  title: string;
  description: string;
  visibility: string;
  created_at: string;
  cards_count: number;
}

interface Job {
  id: number;
  type: string;
  status: string;
  created_at: string;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { supabase } = useSupabase();
  const { jobs } = useRealtimeJobs();
  
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecentDecks = async () => {
    try {
      const { data, error } = await supabase
        .from('decks')
        .select('id, title, description, visibility, created_at, cards_count')
        .eq('owner', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setDecks(data || []);
    } catch (error) {
      console.error('Error fetching decks:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecentDecks();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchRecentDecks().finally(() => setLoading(false));
  }, []);

  const recentJobs = jobs?.slice(0, 3) || [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-6">
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.email?.split('@')[0]}!
            </Text>
            <Text className="text-gray-600 dark:text-gray-400 mt-1">
              Ready to learn something new?
            </Text>
          </View>

          {/* Quick Actions */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </Text>
            <View className="flex-row space-x-3">
              <Button
                onPress={() => router.push('/(tabs)/decks')}
                className="flex-1"
                variant="outline"
              >
                <Ionicons name="library-outline" size={20} color="#3b82f6" />
                <Text className="ml-2 text-blue-600">My Decks</Text>
              </Button>
              <Button
                onPress={() => router.push('/(tabs)/create')}
                className="flex-1"
              >
                <Ionicons name="add-circle-outline" size={20} color="white" />
                <Text className="ml-2 text-white">Upload Media</Text>
              </Button>
            </View>
            <Button
              onPress={() => router.push('/(tabs)/quiz')}
              className="mt-3"
              variant="outline"
            >
              <Ionicons name="school-outline" size={20} color="#3b82f6" />
              <Text className="ml-2 text-blue-600">Quick Quiz</Text>
            </Button>
          </View>

          {/* Recent Decks */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Decks
              </Text>
              <Button
                onPress={() => router.push('/(tabs)/decks')}
                variant="ghost"
                className="p-0"
              >
                <Text className="text-blue-600">View All</Text>
              </Button>
            </View>
            
            {loading ? (
              <View className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4">
                    <View className="animate-pulse">
                      <View className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <View className="h-3 bg-gray-200 rounded w-1/2" />
                    </View>
                  </Card>
                ))}
              </View>
            ) : decks.length > 0 ? (
              <View className="space-y-3">
                {decks.map((deck) => (
                  <Card key={deck.id} className="p-4">
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-900 dark:text-white">
                          {deck.title}
                        </Text>
                        <Text className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                          {deck.description}
                        </Text>
                        <View className="flex-row items-center mt-2">
                          <View className={`px-2 py-1 rounded-full ${
                            deck.visibility === 'public' 
                              ? 'bg-green-100 dark:bg-green-900' 
                              : 'bg-gray-100 dark:bg-gray-800'
                          }`}>
                            <Text className={`text-xs ${
                              deck.visibility === 'public'
                                ? 'text-green-800 dark:text-green-200'
                                : 'text-gray-800 dark:text-gray-200'
                            }`}>
                              {deck.visibility}
                            </Text>
                          </View>
                          <Text className="text-gray-500 dark:text-gray-400 text-xs ml-2">
                            {deck.cards_count} cards
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            ) : (
              <Card className="p-6 text-center">
                <Ionicons name="library-outline" size={48} color="#9ca3af" />
                <Text className="text-gray-500 dark:text-gray-400 mt-2">
                  No decks yet. Create your first deck!
                </Text>
                <Button
                  onPress={() => router.push('/(tabs)/decks')}
                  className="mt-4"
                  variant="outline"
                >
                  Create Deck
                </Button>
              </Card>
            )}
          </View>

          {/* Job Status */}
          {recentJobs.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Processing Status
              </Text>
              <View className="space-y-3">
                {recentJobs.map((job) => (
                  <Card key={job.id} className="p-4">
                    <View className="flex-row justify-between items-center">
                      <View>
                        <Text className="font-medium text-gray-900 dark:text-white">
                          {job.type.replace('_', ' ').toUpperCase()}
                        </Text>
                        <Text className="text-gray-600 dark:text-gray-400 text-sm">
                          {new Date(job.created_at).toLocaleString()}
                        </Text>
                      </View>
                      <View className={`px-3 py-1 rounded-full ${
                        job.status === 'done' 
                          ? 'bg-green-100 dark:bg-green-900' 
                          : job.status === 'failed'
                          ? 'bg-red-100 dark:bg-red-900'
                          : 'bg-yellow-100 dark:bg-yellow-900'
                      }`}>
                        <Text className={`text-xs font-medium ${
                          job.status === 'done'
                            ? 'text-green-800 dark:text-green-200'
                            : job.status === 'failed'
                            ? 'text-red-800 dark:text-red-200'
                            : 'text-yellow-800 dark:text-yellow-200'
                        }`}>
                          {job.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
