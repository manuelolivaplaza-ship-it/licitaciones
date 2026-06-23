import { createBrowserClient } from '@supabase/ssr';

export function isSupabaseConfigured(): boolean {
  if (typeof window === 'undefined') {
    // Server-side environment checks
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return !!(url && key && !url.includes('placeholder-project') && !key.includes('placeholder-anon-key'));
  }
  
  // Client-side environment checks
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && key && !url.includes('placeholder-project') && !key.includes('placeholder-anon-key'));
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
  return createBrowserClient(url, key);
}

