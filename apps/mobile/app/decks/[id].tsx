import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/hooks/useSupabase';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

interface DeckDetail {
  id: number;
  title: string;
  description: string;
  visibility: string;
  created_at: string;
  cards_count: number;
  subjects: string[];
  grade_levels: string[];
}

interface DeckCard {
  id: number;
  title?: string | null;
  prompt_text: string;
  answer_text?: string | null;
  learning_objective?: string | null;
  bloom_level?: string | null;
  difficulty?: string | null;
  created_at: string;
}

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const deckId = useMemo(() => (id ? Number(id) : NaN), [id]);
  const { user, loading: authLoading } = useAuth();
  const { supabase } = useSupabase();

  const [deck, setDeck] = useState<DeckDetail | null>(null);
  const [cards, setCards] = useState<DeckCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDeckDetail = useCallback(async () => {
    if (!user?.id || !Number.isFinite(deckId)) {
      setDeck(null);
      setCards([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: deckData, error: deckError } = await supabase
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
        .eq('id', deckId)
        .eq('owner', user.id)
        .single();

      if (deckError) throw deckError;

      const formattedDeck: DeckDetail = {
        ...deckData,
        cards_count: deckData.cards?.[0]?.count || 0,
        subjects: deckData.subjects?.map((s: any) => s.subject.name) || [],
        grade_levels: deckData.grade_levels?.map((g: any) => g.grade_level.label) || [],
      };

      setDeck(formattedDeck);

      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('id, title, prompt_text, answer_text, learning_objective, bloom_level, difficulty, created_at')
        .eq('deck_id', deckId)
        .order('created_at', { ascending: false });

      if (cardsError) throw cardsError;

      setCards(cardsData || []);
    } catch (error) {
      console.error('Error loading deck details:', error);
      Alert.alert('Error', 'Failed to load deck details');
    } finally {
      setLoading(false);
    }
  }, [deckId, supabase, user?.id]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    fetchDeckDetail();
  }, [authLoading, fetchDeckDetail]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDeckDetail();
    setRefreshing(false);
  };

  if (!Number.isFinite(deckId)) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Text className="text-gray-600 dark:text-gray-300">Invalid deck</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView
        className="flex-1 px-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View className="py-10 space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <View className="animate-pulse space-y-3">
                  <View className="h-4 bg-gray-200 rounded w-3/4" />
                  <View className="h-3 bg-gray-200 rounded w-1/2" />
                  <View className="h-24 bg-gray-200 rounded" />
                </View>
              </Card>
            ))}
          </View>
        ) : deck ? (
          <View className="py-6 space-y-6">
            <Card className="p-5">
              <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                {deck.title}
              </Text>
              <Text className="text-gray-600 dark:text-gray-300 mt-2">
                {deck.description}
              </Text>
              <View className="flex-row items-center flex-wrap gap-2 mt-4">
                <Tag
                  variant={deck.visibility === 'public' ? 'success' : 'secondary'}
                  size="sm"
                >
                  {deck.visibility}
                </Tag>
                <Tag variant="secondary" size="sm">
                  {deck.cards_count} cards
                </Tag>
                <Tag variant="secondary" size="sm">
                  Created {new Date(deck.created_at).toLocaleDateString()}
                </Tag>
              </View>
              {deck.subjects.length > 0 && (
                <View className="mt-4">
                  <Text className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-2">
                    Subjects
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {deck.subjects.map((subject, index) => (
                      <Tag key={`${subject}-${index}`} variant="default" size="sm">
                        {subject}
                      </Tag>
                    ))}
                  </View>
                </View>
              )}
              {deck.grade_levels.length > 0 && (
                <View className="mt-4">
                  <Text className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-2">
                    Grade Levels
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {deck.grade_levels.map((grade, index) => (
                      <Tag key={`${grade}-${index}`} variant="secondary" size="sm">
                        {grade}
                      </Tag>
                    ))}
                  </View>
                </View>
              )}
            </Card>

            <View>
              <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Cards
              </Text>
              {cards.length > 0 ? (
                <View className="space-y-4">
                  {cards.map((card, index) => (
                    <Card key={card.id} className="p-4">
                      <View className="flex-row justify-between items-center">
                        <Text className="text-sm text-gray-500 dark:text-gray-400">
                          Card {index + 1}
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                          {card.bloom_level && (
                            <Tag variant="secondary" size="sm">
                              {card.bloom_level}
                            </Tag>
                          )}
                          {card.difficulty && (
                            <Tag variant="secondary" size="sm">
                              {card.difficulty}
                            </Tag>
                          )}
                        </View>
                      </View>
                      <Text className="text-lg font-semibold text-gray-900 dark:text-white mt-2">
                        {card.title || card.prompt_text}
                      </Text>
                      <Text className="text-gray-700 dark:text-gray-200 mt-2">
                        {card.prompt_text}
                      </Text>
                      {card.answer_text && (
                        <View className="mt-3">
                          <Text className="text-xs uppercase text-gray-500 dark:text-gray-400">
                            Answer
                          </Text>
                          <Text className="text-gray-800 dark:text-gray-100 mt-1">
                            {card.answer_text}
                          </Text>
                        </View>
                      )}
                      {card.learning_objective && (
                        <View className="mt-3">
                          <Text className="text-xs uppercase text-gray-500 dark:text-gray-400">
                            Learning Objective
                          </Text>
                          <Text className="text-gray-700 dark:text-gray-200 mt-1">
                            {card.learning_objective}
                          </Text>
                        </View>
                      )}
                    </Card>
                  ))}
                </View>
              ) : (
                <Card className="p-6 items-center">
                  <Text className="text-gray-500 dark:text-gray-400">
                    No cards yet. Upload media to generate flashcards.
                  </Text>
                </Card>
              )}
            </View>
          </View>
        ) : (
          <View className="py-20 items-center">
            <Text className="text-gray-500 dark:text-gray-400">
              Deck not found or you do not have access.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
