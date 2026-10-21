import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseEnv } from '@/lib/supabase/env'

// Routes that need a signed-in user. /auth/setup is included on purpose:
// it is the in-game intro for signed-in users who have no trainer yet.
const PROTECTED_PREFIXES = ['/game', '/battle', '/trade', '/auth/setup']

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const { url, key } = getSupabaseEnv()

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user && isProtected(pathname)) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Signed-in users skip the login screen. /game decides whether they still
  // need the intro (no profile yet) and sends them to /auth/setup. The setup
  // page sends users who already have a profile back to /game. No loop.
  if (user && pathname === '/auth/login') {
    return NextResponse.redirect(new URL('/game', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
