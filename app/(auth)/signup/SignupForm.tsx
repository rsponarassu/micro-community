'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUp, type AuthFormState } from '@/app/actions/auth'

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null
  return (
    <p className="text-sm mt-1" style={{ color: 'var(--color-error)' }} role="alert">
      {errors[0]}
    </p>
  )
}

export default function SignupForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    signUp,
    undefined
  )

  if (state?.success) {
    return (
      <div
        className="p-4 rounded-lg text-sm text-center"
        style={{ background: 'hsl(142 71% 93%)', color: 'hsl(142 71% 25%)' }}
        role="status"
      >
        <p className="font-semibold mb-1">🎉 Account created!</p>
        <p>{state.message}</p>
        <Link
          href="/login"
          className="inline-block mt-3 font-medium underline"
          style={{ color: 'hsl(142 71% 25%)' }}
        >
          Go to login
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
      {state?.message && !state.success && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{
            background: 'hsl(0 84% 95%)',
            color: 'var(--color-error)',
            border: '1px solid hsl(0 84% 85%)',
          }}
          role="alert"
        >
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="signup-email" className="block text-sm font-medium mb-1.5"
          style={{ color: 'var(--color-text-secondary)' }}>
          Email address
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="name@example.com"
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
          style={{
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
        />
        <FieldError errors={state?.errors?.email} />
      </div>

      <div>
        <label htmlFor="signup-password" className="block text-sm font-medium mb-1.5"
          style={{ color: 'var(--color-text-secondary)' }}>
          Password
        </label>
        <input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="At least 8 characters"
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
          style={{
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
        />
        {state?.errors?.password ? (
          <ul className="mt-1.5 space-y-0.5" style={{ color: 'var(--color-error)' }}>
            {state.errors.password.map((err) => (
              <li key={err} className="text-xs flex items-center gap-1">
                <span>•</span> {err}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
            At least 8 characters with a letter and a number
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: 'var(--color-brand)' }}
        onMouseEnter={(e) => !pending && (e.currentTarget.style.background = 'var(--color-brand-dark)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-brand)')}
      >
        {pending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Creating account…
          </span>
        ) : (
          'Create Account'
        )}
      </button>

      <p className="text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
        Already have an account?{' '}
        <Link href="/login" className="font-medium hover:underline" style={{ color: 'var(--color-brand)' }}>
          Sign in
        </Link>
      </p>
    </form>
  )
}
