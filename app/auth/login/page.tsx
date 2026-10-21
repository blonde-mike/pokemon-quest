import LoginForm from '@/components/auth/LoginForm'

// Reads searchParams, so it cannot be part of the static shell.
export const instant = false

type Props = Readonly<{
  searchParams: Promise<{ error?: string }>
}>

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams
  const notice =
    error === 'confirm'
      ? 'That confirmation link did not work. Sign in, or sign up again.'
      : null

  return <LoginForm notice={notice} />
}
