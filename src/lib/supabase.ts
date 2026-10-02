import 'expo-sqlite/localStorage/install';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

/**
 * Supabase client. Only the publishable key belongs here (EXPO_PUBLIC_* is bundled into the app).
 * Secrets live in Supabase Edge Function env. See .env.example.
 *
 * Null when the env vars are missing, so the app still runs (in demo mode) before a project exists.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase: SupabaseClient | null =
  url && publishableKey
    ? createClient(url, publishableKey, {
        auth: {
          storage: localStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

if (supabase) {
  // Refresh tokens only while the app is in the foreground.
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
