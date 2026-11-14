'use client'

import { useActionState, useEffect } from 'react'
import { resetPassword, type AuthFormState } from '@/app/actions/auth'
import { toast } from 'sonner'

export default function ResetPasswordForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    resetPassword,
    undefined
  )

  useEffect(() => {
    if (state?.message && !state.success) {
      toast.error(state.message)
    } else if (state?.errors?.password?.[0]) {
      toast.error(state.errors.password[0])
    }
  }, [state])

  return (
    <form action={action} className="space-y-4">
      {state?.message && (
        <div className="rounded-[var(--radius-md)] border p-3 text-sm"
          style={{ background: 'var(--color-danger-subtle)', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
          role="alert">
          {state.message}
        </div>
      )}
      <div>
        <label htmlFor="reset-password" className="block text-sm font-medium mb-1.5"
          style={{ color: 'var(--color-text-secondary)' }}>
          New password
        </label>
        <input id="reset-password" name="password" type="password" required
          placeholder="At least 8 characters"
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
          style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')} />
        {state?.errors?.password && (
          <ul className="mt-1.5 space-y-0.5" style={{ color: 'var(--color-error)' }}>
            {state.errors.password.map((err) => (
              <li key={err} className="text-xs">• {err}</li>
            ))}
          </ul>
        )}
      </div>
      <button type="submit" disabled={pending}
        className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60"
        style={{ background: 'var(--color-brand)' }}>
        {pending ? 'Updating…' : 'Set New Password'}
      </button>
    </form>
  )
}
