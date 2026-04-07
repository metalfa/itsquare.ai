import { createClient } from '@supabase/supabase-js'

/**
 * Admin Supabase client with service role key for server-side operations
 * that don't require user authentication (webhooks, cron jobs, etc.)
 * 
 * WARNING: This bypasses RLS - use with caution
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for admin client')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
