import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export const getSupabaseBrowserClient = () => {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase browser environment variables are missing.');
  }

  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      detectSessionInUrl: false,
    },
  });
  return client;
};
