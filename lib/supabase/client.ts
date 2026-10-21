import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // next.config.ts exposes SUPABASE_* vars as NEXT_PUBLIC_* for browser access
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase environment variables.\n' +
      'Set either:\n' +
      '  SUPABASE_URL + SUPABASE_ANON_KEY (Vercel integration)\n' +
      '  or NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY\n' +
      'Check your .env.local file.'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
