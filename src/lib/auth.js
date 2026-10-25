import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();
export const ALLOWED_DOMAIN = 'hbplus.fit';

export function isAllowedEmail(email) {
  if (typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  const parts = normalized.split('@');
  return parts.length === 2 && parts[1] === ALLOWED_DOMAIN && parts[0].length > 0;
}

export async function signInWithGoogle() {
  const redirectTo = Platform.OS === 'web'
    ? window.location.origin
    : Linking.createURL('auth/callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: Platform.OS !== 'web',
      queryParams: { prompt: 'select_account' }
    }
  });
  if (error) throw error;

  if (Platform.OS !== 'web' && data?.url) {
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success' || !result.url) {
      if (result.type === 'cancel' || result.type === 'dismiss') return { cancelled: true };
      throw new Error('Google sign-in did not complete. Please try again.');
    }

    const callbackUrl = new URL(result.url);
    const authError = callbackUrl.searchParams.get('error_description') || callbackUrl.searchParams.get('error');
    if (authError) throw new Error(authError);
    const code = callbackUrl.searchParams.get('code');
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;
    } else if (callbackUrl.hash.includes('access_token')) {
      // Supports providers/configurations that return tokens in the URL fragment.
      const params = new URLSearchParams(callbackUrl.hash.replace(/^#/, ''));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (access_token && refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
        if (sessionError) throw sessionError;
      }
    }
  }
  return { cancelled: false };
}

export async function saveUserProfile(user) {
  if (!user?.id || !isAllowedEmail(user.email)) throw new Error('Only @hbplus.fit accounts are allowed.');
  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email.toLowerCase(),
    full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
    updated_at: new Date().toISOString()
  });
  if (error) throw error;
}
