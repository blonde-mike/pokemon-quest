'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PixelSprite from '@/components/game/PixelSprite'
import { POKEBALL } from '@/lib/pixel/sprites'

type Props = Readonly<{ notice: string | null }>

export default function LoginForm({ notice }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState<'in' | 'up' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(notice)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const valid = email.includes('@') && password.length >= 6

  const handleSignUp = async () => {
    setLoading('up')
    setError(null)
    setInfo(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/auth/setup`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(null)
    } else if (data.session) {
      router.push('/auth/setup')
      router.refresh()
    } else {
      setInfo('Check your email for a confirmation link. It drops you straight into the game.')
      setLoading(null)
    }
  }

  const handleSignIn = async () => {
    setLoading('in')
    setError(null)
    setInfo(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(null)
    } else {
      router.push('/game')
      router.refresh()
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f0f1a] p-4">
      <div className="pixel-panel w-full max-w-md p-8">
        <div className="mb-6 flex items-center justify-center gap-4">
          <PixelSprite sprite={POKEBALL} scale={3} />
          <h1 className="font-pixel text-center text-lg leading-7 text-[#1b1b2f]">
            POKEMON
            <br />
            QUEST
          </h1>
          <PixelSprite sprite={POKEBALL} scale={3} />
        </div>

        <p className="font-pixel mb-6 text-center text-[10px] leading-5 text-[#555566]">
          Sign in to continue your journey, or sign up to begin one.
        </p>

        {error && (
          <div className="font-pixel mb-4 border-3 border-[#d7263d] bg-[#ffe3e6] p-3 text-[10px] leading-5 text-[#8f1626]">
            {error}
          </div>
        )}
        {info && (
          <div className="font-pixel mb-4 border-3 border-[#2d6fb0] bg-[#e3f1ff] p-3 text-[10px] leading-5 text-[#1b3f66]">
            {info}
          </div>
        )}

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault()
            if (valid && !loading) void handleSignIn()
          }}
        >
          <div>
            <label htmlFor="email" className="font-pixel mb-2 block text-[10px] text-[#1b1b2f]">
              EMAIL
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pixel-input"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="font-pixel mb-2 block text-[10px] text-[#1b1b2f]">
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pixel-input"
              minLength={6}
              required
            />
            <p className="font-pixel mt-2 text-[8px] text-[#555566]">At least 6 characters.</p>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={!valid || loading !== null}
              className="pixel-button flex-1 bg-[#2d6fb0]"
            >
              {loading === 'in' ? '...' : 'Sign in'}
            </button>
            <button
              type="button"
              onClick={() => void handleSignUp()}
              disabled={!valid || loading !== null}
              className="pixel-button flex-1 bg-[#2f7a3a]"
            >
              {loading === 'up' ? '...' : 'Sign up'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
