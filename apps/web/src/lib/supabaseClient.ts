import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

const readSupabaseEnv = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase browser environment variables are missing.');
  }

  return { supabaseUrl, supabaseAnonKey };
};

/**
 * The shared, app-wide browser client. Its session is persisted in
 * localStorage and drives the global authenticated state (see AuthProvider).
 * `detectSessionInUrl` is disabled so that recovery/confirmation tokens in the
 * URL are never silently turned into a logged-in session — those flows are
 * handled explicitly by the /reset-password and /verify pages.
 */
export const getSupabaseBrowserClient = () => {
  if (client) return client;

  const { supabaseUrl, supabaseAnonKey } = readSupabaseEnv();

  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      detectSessionInUrl: false,
    },
  });
  return client;
};

/**
 * Creates a throwaway Supabase client that is fully isolated from the shared
 * app session: it never persists, never auto-refreshes, and uses a unique
 * in-memory storage key. This is used by the password-reset flow so that a
 * recovery token can be exchanged and `updateUser({ password })` can be called
 * WITHOUT ever leaking into — or being contaminated by — the app's real
 * localStorage session. This is the core safeguard against the password-reset
 * link authenticating the wrong account.
 */
export const createIsolatedSupabaseClient = () => {
  const { supabaseUrl, supabaseAnonKey } = readSupabaseEnv();

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      detectSessionInUrl: false,
      persistSession: false,
      autoRefreshToken: false,
      // A unique storage key guarantees this client can never read or write the
      // shared `sb-<ref>-auth-token` entry, even if persistSession were on.
      storageKey: `haseeela-recovery-${Math.random().toString(36).slice(2)}`,
    },
  });
};
