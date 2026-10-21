import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Browser can only access NEXT_PUBLIC_ prefixed variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase environment variables.\n' +
      'Browser requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.\n' +
      'Check your .env.local file.'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
