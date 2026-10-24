import type { Metadata } from 'next'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Micro Community account.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  return (
    <div className="card p-8 animate-slide-up">
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
        Welcome back
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
        Sign in to continue to your communities
      </p>
      <LoginForm nextPath={next} />
    </div>
  )
}
