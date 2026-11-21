import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.length > 0 &&
    !supabaseUrl.includes('your-project-id') &&
    typeof supabasePublishableKey === 'string' &&
    supabasePublishableKey.length > 0 &&
    !supabasePublishableKey.includes('your-supabase-publishable-key')
  );
};

export const getSupabaseConfigStatus = () => {
  return {
    isConfigured: isSupabaseConfigured(),
    hasUrl: Boolean(supabaseUrl && !supabaseUrl.includes('your-project-id')),
    hasKey: Boolean(supabasePublishableKey && !supabasePublishableKey.includes('your-supabase-publishable-key')),
    url: supabaseUrl || '',
  };
};

let passwordRecoveryUserId: string | null = null;

export const getPasswordRecoveryUserId = (): string | null =>
  passwordRecoveryUserId;

if (!isSupabaseConfigured()) {
  console.warn(
    '[Supabase Configuration] Missing or placeholder VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. Please verify .env settings.'
  );
}

export const supabase = createClient<any>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabasePublishableKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'cgb_tsad_supabase_auth_token',
    },
  }
);

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY') {
    passwordRecoveryUserId = session?.user.id ?? null;
  } else if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
    passwordRecoveryUserId = null;
  } else if (
    event === 'USER_UPDATED' &&
    session?.user.id === passwordRecoveryUserId
  ) {
    passwordRecoveryUserId = null;
  }
});
