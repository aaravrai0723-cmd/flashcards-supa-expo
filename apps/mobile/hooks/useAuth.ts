import { useSupabase } from './useSupabase';
import { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

export function useAuth() {
  const { supabase } = useSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string) => {
    const redirectUrl = Linking.createURL('auth/callback');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    if (error) throw error;
  };

  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    try {
      const redirectUrl = Linking.createURL('auth/callback');

      console.log('Starting OAuth flow for provider:', provider);
      console.log('Redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error('OAuth error:', error);
        throw error;
      }

      if (!data?.url) {
        throw new Error('No OAuth URL returned');
      }

      console.log('Opening OAuth URL:', data.url);

      // Use openAuthSessionAsync with callbackUrl matching redirect
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl,
        {
          // iOS specific options
          preferEphemeralSession: true, // Don't save cookies
        }
      );

      console.log('WebBrowser result:', JSON.stringify(result, null, 2));

      if (result.type === 'success' && result.url) {
        console.log('Success! Processing callback URL...');

        // Parse the URL to extract tokens
        const url = new URL(result.url);
        const params = new URLSearchParams(url.hash.substring(1) || url.search);

        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (sessionError) throw sessionError;

          console.log('✅ Authentication successful!');
          return;
        }

        const error = params.get('error_description') || params.get('error');
        throw new Error(error || 'No tokens received');
      }

      if (result.type === 'cancel') {
        throw new Error('Authentication cancelled');
      }

      throw new Error('Unexpected authentication result');
    } catch (err) {
      console.error('OAuth error:', err);
      throw err;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    session,
    user,
    loading,
    signInWithEmail,
    signInWithOAuth,
    signOut,
  };
}
