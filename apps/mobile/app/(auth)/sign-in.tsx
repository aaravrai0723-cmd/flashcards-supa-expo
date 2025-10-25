import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';
import { useState } from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithEmail, signInWithOAuth } = useAuth();

  const handleEmailSignIn = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(email);
      Alert.alert(
        'Check your email',
        'We sent you a magic link to sign in. Check your email and click the link.'
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    setLoading(true);
    try {
      await signInWithOAuth(provider);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1 justify-center px-6">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Flashcards
          </Text>
          <Text className="text-gray-600 dark:text-gray-400">
            Sign in to start learning with AI-powered flashcards
          </Text>
        </View>

        <View className="space-y-4">
          <Input
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Button
            onPress={handleEmailSignIn}
            loading={loading}
            className="w-full"
          >
            Send Magic Link
          </Button>

          <View className="flex-row items-center my-4">
            <View className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
            <Text className="mx-4 text-gray-500 dark:text-gray-400">or</Text>
            <View className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
          </View>

          <Button
            onPress={() => handleOAuthSignIn('google')}
            variant="outline"
            className="w-full"
            disabled={loading}
          >
            Continue with Google
          </Button>

          <Button
            onPress={() => handleOAuthSignIn('apple')}
            variant="outline"
            className="w-full"
            disabled={loading}
          >
            Continue with Apple
          </Button>
        </View>

        <View className="mt-8">
          <Text className="text-sm text-gray-600 dark:text-gray-400 text-center">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
