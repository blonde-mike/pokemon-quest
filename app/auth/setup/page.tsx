import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import IntroGame from '@/components/game/IntroGame'

// Reads the session cookie, so it cannot be part of the static shell.
export const instant = false

export default async function SetupPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (profile) {
    redirect('/game')
  }

  return <IntroGame />
}
