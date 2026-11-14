import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '';
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = supabaseUrl
  ? createClient(supabaseUrl, supabaseAnon)
  : null as unknown as ReturnType<typeof createClient>;

/** True when the server can reach Supabase with the service role key. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Server-side client with service role (for admin operations)
export function createAdminClient() {
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '';
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  return createClient(url || 'https://placeholder.supabase.co', service || 'placeholder', {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
