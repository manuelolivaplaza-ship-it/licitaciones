import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Verifica si Supabase Admin Client está configurado con una clave de servicio real.
 */
export function isSupabaseAdminConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return !!(
    url && 
    key && 
    !url.includes('placeholder-project') && 
    !key.includes('placeholder-anon-key') &&
    key !== 'your-service-role-key-here' &&
    key !== ''
  );
}

/**
 * Crea un cliente de Supabase con el rol de servicio para bypass de RLS en tareas administrativas/cron.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';
  
  return createSupabaseClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}
