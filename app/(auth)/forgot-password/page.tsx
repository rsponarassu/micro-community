import type { Metadata } from 'next'
import ForgotPasswordForm from './ForgotPasswordForm'

export const metadata: Metadata = { title: 'Forgot Password' }

export default function ForgotPasswordPage() {
  return (
    <div className="card p-8 animate-slide-up">
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
        Reset your password
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
        Enter your email and we&apos;ll send a reset link
      </p>
      <ForgotPasswordForm />
    </div>
  )
}
