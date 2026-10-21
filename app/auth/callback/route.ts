import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Supabase email-confirmation links land here with ?code=... (PKCE).
// Exchange the code for a session cookie, then continue into the game.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/game'
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/game'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=confirm`)
}
