import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/hooks/useSupabase';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Deck {
  id: number;
  title: string;
  description: string;
  cards_count?: number;
}

interface QuizQuestion {
  id: number;
  type: 'mcq' | 'tf' | 'short' | 'hotspot';
  question: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  media_url?: string;
  hotspot_data?: any;
}

interface QuizResult {
  correct: number;
  total: number;
  percentage: number;
  timeSpent: number;
}

export default function QuizScreen() {
  const { user } = useAuth();
  const { supabase } = useSupabase();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeckSelector, setShowDeckSelector] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

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
          cards(count)
        `)
        .eq('owner', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedDecks = data?.map(deck => ({
        ...deck,
        cards_count: deck.cards?.[0]?.count || 0,
      })).filter(deck => deck.cards_count > 0) || [];

      setDecks(formattedDecks);
    } catch (error) {
      console.error('Error fetching decks:', error);
    }
  };

  const startQuiz = async (deck: Deck) => {
    setLoading(true);
    try {
      // Fetch random cards from the deck
      const { data: cards, error } = await supabase
        .from('cards')
        .select('id, prompt_text, answer_text')
        .eq('deck_id', deck.id)
        .order('random()')
        .limit(10);

      if (error) throw error;
      if (!cards || cards.length === 0) {
        throw new Error('No cards available in this deck yet.');
      }

      // Convert cards to quiz questions
      const quizQuestions: QuizQuestion[] = cards.map(card => ({
        id: card.id,
        type: 'short',
        question: card.prompt_text,
        correct_answer: card.answer_text || '',
      }));

      setQuestions(quizQuestions);
      setSelectedDeck(deck);
      setCurrentQuestion(0);
      setAnswers({});
      setQuizStarted(true);
      setShowDeckSelector(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to start quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: answer,
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    const correct = questions.filter((q, index) => 
      answers[index] === q.correct_answer
    ).length;
    
    const result: QuizResult = {
      correct,
      total: questions.length,
      percentage: Math.round((correct / questions.length) * 100),
      timeSpent: 0, // TODO: Implement timer
    };
    
    setQuizResult(result);
    setShowResults(true);
  };

  const resetQuiz = () => {
    setQuestions([]);
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setQuizResult(null);
    setQuizStarted(false);
    setSelectedDeck(null);
  };

  const renderQuestion = () => {
    if (!questions.length || currentQuestion >= questions.length) return null;
    
    const question = questions[currentQuestion];
    const userAnswer = answers[currentQuestion];

    return (
      <View className="flex-1">
        <View className="mb-6">
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            Question {currentQuestion + 1} of {questions.length}
          </Text>
          <View className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
            <View 
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </View>
        </View>

        <Card className="p-6 mb-6">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {question.question}
          </Text>
          
          {question.media_url && (
            <View className="mb-4">
              <Image
                source={{ uri: question.media_url }}
                className="w-full h-48 rounded-lg"
                resizeMode="cover"
                accessibilityLabel="Question image"
              />
            </View>
          )}

          {question.type === 'mcq' && question.options && (
            <View className="space-y-3">
              {question.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleAnswer(option)}
                  className={`p-4 rounded-lg border ${
                    userAnswer === option
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <Text className={`${
                    userAnswer === option
                      ? 'text-blue-900 dark:text-blue-100'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {question.type === 'tf' && (
            <View className="flex-row space-x-4">
              <Button
                onPress={() => handleAnswer('true')}
                variant={userAnswer === 'true' ? 'default' : 'outline'}
                className="flex-1"
              >
                True
              </Button>
              <Button
                onPress={() => handleAnswer('false')}
                variant={userAnswer === 'false' ? 'default' : 'outline'}
                className="flex-1"
              >
                False
              </Button>
            </View>
          )}

          {question.type === 'short' && (
            <View>
              <Text className="text-gray-600 dark:text-gray-400 mb-2">
                Type your answer below
              </Text>
              <TextInput
                placeholder="Your answer..."
                value={userAnswer || ''}
                onChangeText={handleAnswer}
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                multiline
              />
            </View>
          )}

          {question.type === 'hotspot' && (
            <View>
              <Text className="text-gray-600 dark:text-gray-400 mb-2">
                Tap on the correct area in the image
              </Text>
              <TouchableOpacity className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg items-center justify-center">
                <Text className="text-gray-500 dark:text-gray-400">
                  Hotspot interaction would be implemented here
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        <Button
          onPress={nextQuestion}
          disabled={!userAnswer}
          className="w-full"
        >
          {currentQuestion === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
        </Button>
      </View>
    );
  };

  const renderResults = () => {
    if (!quizResult) return null;

    return (
      <View className="flex-1 justify-center">
        <Card className="p-8 text-center">
          <Ionicons 
            name={quizResult.percentage >= 70 ? 'trophy' : 'school'} 
            size={64} 
            color={quizResult.percentage >= 70 ? '#10b981' : '#6b7280'} 
          />
          <Text className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
            {quizResult.percentage}%
          </Text>
          <Text className="text-lg text-gray-600 dark:text-gray-400 mt-2">
            {quizResult.correct} out of {quizResult.total} correct
          </Text>
          
          <View className="mt-6 space-y-3">
            <Button onPress={resetQuiz} className="w-full">
              <Ionicons name="refresh" size={20} color="white" />
              <Text className="ml-2 text-white">Try Again</Text>
            </Button>
            <Button onPress={() => setShowDeckSelector(true)} variant="outline" className="w-full">
              <Ionicons name="library" size={20} color="#3b82f6" />
              <Text className="ml-2 text-blue-600">Choose Different Deck</Text>
            </Button>
          </View>
        </Card>
      </View>
    );
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="flex-1">
        {!quizStarted ? (
          <View className="flex-1 justify-center p-6">
            <View className="text-center mb-8">
              <Ionicons name="school-outline" size={64} color="#3b82f6" />
              <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
                Quick Quiz
              </Text>
              <Text className="text-gray-600 dark:text-gray-400 mt-2">
                Test your knowledge with a 10-question quiz
              </Text>
            </View>

            <Button
              onPress={() => setShowDeckSelector(true)}
              className="w-full"
              size="lg"
            >
              <Ionicons name="play" size={24} color="white" />
              <Text className="ml-2 text-white text-lg">Start Quiz</Text>
            </Button>
          </View>
        ) : showResults ? (
          renderResults()
        ) : (
          <View className="flex-1 p-6">
            {renderQuestion()}
          </View>
        )}

        {/* Deck Selector Modal */}
        <Modal
          visible={showDeckSelector}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
            <View className="flex-row justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                Choose a Deck
              </Text>
              <TouchableOpacity onPress={() => setShowDeckSelector(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView className="flex-1 p-6">
              {decks.length > 0 ? (
                <View className="space-y-4">
                  {decks.map((deck) => (
                    <TouchableOpacity
                      key={deck.id}
                      onPress={() => startQuiz(deck)}
                      disabled={loading}
                    >
                      <Card className="p-4">
                        <View className="flex-row justify-between items-center">
                          <View className="flex-1">
                            <Text className="font-semibold text-gray-900 dark:text-white">
                              {deck.title}
                            </Text>
                            <Text className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                              {deck.description}
                            </Text>
                            <Text className="text-gray-500 dark:text-gray-400 text-xs mt-2">
                              {deck.cards_count} cards
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                        </View>
                      </Card>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View className="flex-1 justify-center items-center py-12">
                  <Ionicons name="library-outline" size={48} color="#9ca3af" />
                  <Text className="text-gray-500 dark:text-gray-400 text-lg font-medium mt-4">
                    No decks available
                  </Text>
                  <Text className="text-gray-400 dark:text-gray-500 text-center mt-2">
                    Create a deck with cards to start quizzing
                  </Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
