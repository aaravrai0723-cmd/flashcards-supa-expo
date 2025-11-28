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
    const redirectUrl = 'flashcards://auth/callback';
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    if (error) throw error;
  };

  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    const redirectUrl = 'flashcards://auth/callback';

    console.log('Starting OAuth flow for provider:', provider);

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

    if (data.url) {
      console.log('Opening OAuth URL in browser');

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl
      );

      console.log('WebBrowser result:', result);

      if (result.type === 'cancel') {
        throw new Error('Authentication was cancelled');
      }

      if (result.type === 'success' && result.url) {
        console.log('Processing OAuth callback URL');

        // Extract tokens from the URL
        const url = new URL(result.url);
        let access_token = null;
        let refresh_token = null;

        // Try hash first (OAuth tokens are typically in the hash)
        if (url.hash) {
          const hashParams = new URLSearchParams(url.hash.substring(1));
          access_token = hashParams.get('access_token');
          refresh_token = hashParams.get('refresh_token');
        }

        // Fallback to query params
        if (!access_token) {
          access_token = url.searchParams.get('access_token');
          refresh_token = url.searchParams.get('refresh_token');
        }

        console.log('Extracted tokens:', {
          hasAccessToken: !!access_token,
          hasRefreshToken: !!refresh_token,
        });

        if (access_token && refresh_token) {
          // Set the session
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (sessionError) {
            console.error('Error setting session:', sessionError);
            throw sessionError;
          }

          console.log('Session established successfully:', sessionData.session?.user.id);
        } else {
          // Check for errors in the URL
          const error = url.searchParams.get('error');
          const errorDescription = url.searchParams.get('error_description');
          if (error) {
            throw new Error(errorDescription || error);
          }
          throw new Error('No tokens received from OAuth provider');
        }
      }
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
