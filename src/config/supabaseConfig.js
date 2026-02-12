import Constants from 'expo-constants';

const extra = Constants?.expoConfig?.extra ?? {};

export const SUPABASE_PROJECT_REF =
    process.env.EXPO_PUBLIC_SUPABASE_PROJECT_REF ||
    extra.supabaseProjectRef ||
    'wlcrbwansdbzanpovztq';

export const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;
export const API_BASE_URL = `${SUPABASE_URL}/functions/v1`;
export const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`;

export const SUPABASE_ANON_KEY =
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    extra.supabaseAnonKey ||
    '';

if (!SUPABASE_ANON_KEY) {
    console.warn('SUPABASE_ANON_KEY is missing. Set EXPO_PUBLIC_SUPABASE_ANON_KEY or expo.extra.supabaseAnonKey.');
}
