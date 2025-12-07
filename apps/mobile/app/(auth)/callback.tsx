import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSupabase } from '@/hooks/useSupabase';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { supabase } = useSupabase();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract tokens from URL parameters
        const access_token = params.access_token as string;
        const refresh_token = params.refresh_token as string;
        const error = params.error as string;
        const error_description = params.error_description as string;

        if (error) {
          console.error('OAuth error:', error_description || error);
          // Redirect back to sign-in with error
          router.replace({
            pathname: '/(auth)/sign-in',
            params: { error: error_description || error }
          });
          return;
        }

        if (access_token && refresh_token) {
          // Set the session
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (sessionError) {
            console.error('Error setting session:', sessionError);
            router.replace({
              pathname: '/(auth)/sign-in',
              params: { error: 'Failed to authenticate' }
            });
            return;
          }

          // Successfully authenticated - redirect to home
          console.log('Successfully authenticated via OAuth');
          router.replace('/(tabs)');
        } else {
          console.error('No tokens received');
          router.replace({
            pathname: '/(auth)/sign-in',
            params: { error: 'No authentication tokens received' }
          });
        }
      } catch (err) {
        console.error('Callback error:', err);
        router.replace({
          pathname: '/(auth)/sign-in',
          params: { error: 'Authentication failed' }
        });
      }
    };

    handleCallback();
  }, [params]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#0000ff" />
      <Text className="mt-4 text-gray-600">Completing sign in...</Text>
    </View>
  );
}
