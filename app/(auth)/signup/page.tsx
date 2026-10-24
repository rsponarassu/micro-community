import type { Metadata } from 'next'
import SignupForm from './SignupForm'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create a new Micro Community account.',
}

export default function SignupPage() {
  return (
    <div className="card p-8 animate-slide-up">
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
        Join the community
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
        Create an account to connect with your communities
      </p>
      <SignupForm />
    </div>
  )
}
