import { useAuth } from '@/hooks/useAuth';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '@/hooks/useSupabase';
import '../global.css';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { session, loading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  useEffect(() => {
    console.log('Auth State:', {
      hasSession: !!session,
      hasUser: !!user,
      userId: user?.id,
      loading
    });
  }, [session, user, loading]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const currentSegment = segments[0];
    const inAuthGroup = currentSegment === '(auth)';
    const inTabsGroup = currentSegment === '(tabs)';
    const inDeckDetail = currentSegment === 'decks';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (session && (inAuthGroup || (!inAuthGroup && !inTabsGroup && !inDeckDetail))) {
      // If user is authenticated and either in auth screens or nowhere specific, go to home
      router.replace('/(tabs)');
    }
  }, [session, loading, segments, router]);

  // Handle deep linking for OAuth callback
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      console.log('Deep link received:', url);

      // Check if it's an auth callback
      if (url.includes('auth/callback')) {
        console.log('Auth callback detected');

        const parsedUrl = new URL(url);

        // Try extracting from hash first (OAuth)
        let access_token = null;
        let refresh_token = null;

        if (parsedUrl.hash) {
          console.log('Extracting from hash:', parsedUrl.hash);
          const hash = parsedUrl.hash.substring(1);
          const hashParams = new URLSearchParams(hash);
          access_token = hashParams.get('access_token');
          refresh_token = hashParams.get('refresh_token');
        }

        // If not in hash, try query params (magic link)
        if (!access_token && parsedUrl.search) {
          console.log('Extracting from query params:', parsedUrl.search);
          const searchParams = new URLSearchParams(parsedUrl.search);
          access_token = searchParams.get('access_token');
          refresh_token = searchParams.get('refresh_token');
        }

        console.log('Tokens extracted:', {
          hasAccessToken: !!access_token,
          hasRefreshToken: !!refresh_token
        });

        if (access_token && refresh_token) {
          // Set the session using the tokens from the callback
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (!error && data.session) {
            console.log('Successfully set session from deep link:', data.session.user.id);
          } else {
            console.error('Error setting session:', error);
          }
        } else {
          console.log('No tokens found in URL, checking for error');
          // Check for error in URL
          const errorParam = parsedUrl.searchParams.get('error');
          const errorDescription = parsedUrl.searchParams.get('error_description');
          if (errorParam) {
            console.error('Auth error:', errorParam, errorDescription);
          }
        }
      }
    };

    // Handle initial URL (when app is opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial URL:', url);
        handleDeepLink({ url });
      }
    });

    // Listen for deep link events while app is running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="decks/[id]" options={{ title: 'Deck Detail' }} />
    </Stack>
  );
}
