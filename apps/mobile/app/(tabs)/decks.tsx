import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/hooks/useSupabase';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Deck {
  id: number;
  title: string;
  description: string;
  visibility: string;
  created_at: string;
  cards_count?: number;
  subjects: string[];
  grade_levels: string[];
}

export default function DecksScreen() {
  const { user } = useAuth();
  const { supabase } = useSupabase();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDecks = async () => {
    if (!user?.id) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('decks')
        .select(`
          id,
          title,
          description,
          visibility,
          created_at,
          cards(count),
          subjects:deck_subjects(subject:subjects(name)),
          grade_levels:deck_grade_levels(grade_level:grade_levels(label))
        `)
        .eq('owner', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedDecks = data?.map(deck => ({
        ...deck,
        cards_count: deck.cards?.[0]?.count || 0,
        subjects: deck.subjects?.map((s: any) => s.subject.name) || [],
        grade_levels: deck.grade_levels?.map((g: any) => g.grade_level.label) || [],
      })) || [];

      setDecks(formattedDecks);
    } catch (error) {
      console.error('Error fetching decks:', error);
      Alert.alert('Error', 'Failed to load decks');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDecks();
    setRefreshing(false);
  };

  const handleCreateDeck = () => {
    // Navigate to create deck modal or screen
    Alert.alert(
      'Create Deck',
      'This would open a modal to create a new deck',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Create', onPress: () => {
          // TODO: Implement deck creation
          console.log('Create deck');
        }}
      ]
    );
  };

  const handleDeckPress = (deck: Deck) => {
    // Navigate to deck detail
    console.log('Deck pressed:', deck);
  };

  useEffect(() => {
    fetchDecks().finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="flex-1">
        <View className="flex-row justify-between items-center p-6 pb-4">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            My Decks
          </Text>
          <Button onPress={handleCreateDeck} size="sm">
            <Ionicons name="add" size={16} color="white" />
            <Text className="ml-1 text-white">New</Text>
          </Button>
        </View>

        <ScrollView
          className="flex-1 px-6"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loading ? (
            <View className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                  <View className="animate-pulse">
                    <View className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <View className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
                    <View className="flex-row space-x-2">
                      <View className="h-6 bg-gray-200 rounded-full w-16" />
                      <View className="h-6 bg-gray-200 rounded-full w-20" />
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          ) : decks.length > 0 ? (
            <View className="space-y-4">
              {decks.map((deck) => (
                <TouchableOpacity
                  key={deck.id}
                  onPress={() => handleDeckPress(deck)}
                >
                  <Card className="p-4">
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                          {deck.title}
                        </Text>
                        <Text className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                          {deck.description}
                        </Text>
                      </View>
                      <View className="flex-row items-center space-x-2">
                        <Tag
                          variant={deck.visibility === 'public' ? 'success' : 'secondary'}
                          size="sm"
                        >
                          {deck.visibility}
                        </Tag>
                        <Text className="text-gray-500 dark:text-gray-400 text-sm">
                          {deck.cards_count || 0} cards
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row flex-wrap gap-2 mb-3">
                      {deck.subjects.slice(0, 3).map((subject, index) => (
                        <Tag key={index} variant="default" size="sm">
                          {subject}
                        </Tag>
                      ))}
                      {deck.subjects.length > 3 && (
                        <Tag variant="secondary" size="sm">
                          +{deck.subjects.length - 3} more
                        </Tag>
                      )}
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-500 dark:text-gray-400 text-xs">
                        Created {new Date(deck.created_at).toLocaleDateString()}
                      </Text>
                      <View className="flex-row items-center space-x-2">
                        <TouchableOpacity className="p-1">
                          <Ionicons name="eye-outline" size={16} color="#6b7280" />
                        </TouchableOpacity>
                        <TouchableOpacity className="p-1">
                          <Ionicons name="share-outline" size={16} color="#6b7280" />
                        </TouchableOpacity>
                        <TouchableOpacity className="p-1">
                          <Ionicons name="ellipsis-horizontal" size={16} color="#6b7280" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="flex-1 justify-center items-center py-12">
              <Ionicons name="library-outline" size={64} color="#9ca3af" />
              <Text className="text-gray-500 dark:text-gray-400 text-lg font-medium mt-4">
                No decks yet
              </Text>
              <Text className="text-gray-400 dark:text-gray-500 text-center mt-2">
                Create your first deck to start learning
              </Text>
              <Button onPress={handleCreateDeck} className="mt-6">
                <Ionicons name="add" size={20} color="white" />
                <Text className="ml-2 text-white">Create Deck</Text>
              </Button>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
