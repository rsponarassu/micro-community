import type { Metadata } from 'next'
import ResetPasswordForm from './ResetPasswordForm'

export const metadata: Metadata = { title: 'Set New Password' }

export default function ResetPasswordPage() {
  return (
    <div className="card p-8 animate-slide-up">
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
        Set a new password
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
        Choose a strong password for your account
      </p>
      <ResetPasswordForm />
    </div>
  )
}
