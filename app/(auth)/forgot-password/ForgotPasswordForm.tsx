'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { forgotPassword, type AuthFormState } from '@/app/actions/auth'

export default function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    forgotPassword,
    undefined
  )

  if (state?.success) {
    return (
      <div className="p-4 rounded-lg text-sm text-center"
        style={{ background: 'hsl(142 71% 93%)', color: 'hsl(142 71% 25%)' }} role="status">
        <p className="font-semibold mb-1">📧 Email sent!</p>
        <p>{state.message}</p>
        <Link href="/login" className="inline-block mt-3 font-medium underline"
          style={{ color: 'hsl(142 71% 25%)' }}>
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
      {state?.message && (
        <div className="p-3 rounded-lg text-sm"
          style={{ background: 'hsl(0 84% 95%)', color: 'var(--color-error)', border: '1px solid hsl(0 84% 85%)' }}
          role="alert">
          {state.message}
        </div>
      )}
      <div>
        <label htmlFor="forgot-email" className="block text-sm font-medium mb-1.5"
          style={{ color: 'var(--color-text-secondary)' }}>
          Email address
        </label>
        <input id="forgot-email" name="email" type="email" required placeholder="name@example.com"
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
          style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')} />
        {state?.errors?.email && (
          <p className="text-sm mt-1" style={{ color: 'var(--color-error)' }}>{state.errors.email[0]}</p>
        )}
      </div>
      <button type="submit" disabled={pending}
        className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60"
        style={{ background: 'var(--color-brand)' }}>
        {pending ? 'Sending…' : 'Send Reset Link'}
      </button>
      <p className="text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
        <Link href="/login" className="hover:underline" style={{ color: 'var(--color-brand)' }}>Back to login</Link>
      </p>
    </form>
  )
}
