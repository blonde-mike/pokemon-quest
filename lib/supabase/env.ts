// Server-side env resolution. Supports the Vercel Supabase integration names
// and the NEXT_PUBLIC_ convention. Browser code must use lib/supabase/client.ts,
// which references NEXT_PUBLIC_* literally so Next can inline them.
export function getSupabaseEnv(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables. Set SUPABASE_URL and SUPABASE_ANON_KEY ' +
        '(or NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY).'
    )
  }
  return { url, key }
}
