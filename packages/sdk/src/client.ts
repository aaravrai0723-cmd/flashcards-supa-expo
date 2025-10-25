import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types/database';

// Environment variables
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

// Singleton client instance
let supabaseClient: SupabaseClient<Database> | null = null;

/**
 * Get or create the Supabase client instance
 * This ensures we only create one client instance across the app
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        // Enable automatic session refresh
        autoRefreshToken: true,
        // Persist session in AsyncStorage for React Native
        persistSession: true,
        // Detect session from URL for OAuth flows
        detectSessionInUrl: true,
      },
      realtime: {
        // Enable real-time subscriptions
        params: {
          eventsPerSecond: 10,
        },
      },
      global: {
        headers: {
          'X-Client-Info': 'flashcards-app',
        },
      },
    });
  }
  
  return supabaseClient;
}

/**
 * Create a new Supabase client with custom options
 * Useful for server-side rendering or specific configurations
 */
export function createSupabaseClient(options?: {
  url?: string;
  key?: string;
  auth?: any;
}): SupabaseClient<Database> {
  const url = options?.url || SUPABASE_URL;
  const key = options?.key || SUPABASE_ANON_KEY;
  
  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      ...options?.auth,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        'X-Client-Info': 'flashcards-app',
      },
    },
  });
}

/**
 * Get the current user from the Supabase client
 */
export async function getCurrentUser() {
  const client = getSupabaseClient();
  const { data: { user }, error } = await client.auth.getUser();
  
  if (error) {
    throw new Error(`Failed to get current user: ${error.message}`);
  }
  
  return user;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const client = getSupabaseClient();
  const { error } = await client.auth.signOut();
  
  if (error) {
    throw new Error(`Failed to sign out: ${error.message}`);
  }
}

/**
 * Get the current session
 */
export async function getCurrentSession() {
  const client = getSupabaseClient();
  const { data: { session }, error } = await client.auth.getSession();
  
  if (error) {
    throw new Error(`Failed to get session: ${error.message}`);
  }
  
  return session;
}

// Export the client instance for direct access if needed
export const supabase = getSupabaseClient();

// Export types
export type { Database } from './types/database';
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
