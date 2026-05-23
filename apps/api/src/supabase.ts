import { SupabaseClient, createClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export const getSupabaseAuthClient = () => {
  if (client) return client;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be configured.');
  }

  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return client;
};
