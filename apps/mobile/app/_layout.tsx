import { useAuth } from '@/hooks/useAuth';
import { Redirect, Stack } from 'expo-router';
import { useEffect } from 'react';

export default function RootLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <Stack>
      {session ? (
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      )}
    </Stack>
  );
}
