'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signIn, type AuthFormState } from '@/app/actions/auth'

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null
  return (
    <p className="text-sm mt-1" style={{ color: 'var(--color-error)' }} role="alert">
      {errors[0]}
    </p>
  )
}

export default function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    signIn,
    undefined
  )

  return (
    <form action={action} className="space-y-4">
      {nextPath && (
        <input type="hidden" name="next" value={nextPath} />
      )}

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
        <label
          htmlFor="login-email"
          className="block text-sm font-medium mb-1.5"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Email address
        </label>
        <input
          id="login-email"
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
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="login-password"
            className="block text-sm font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs hover:underline"
            style={{ color: 'var(--color-brand)' }}
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
          style={{
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
        />
        <FieldError errors={state?.errors?.password} />
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
            Signing in…
          </span>
        ) : (
          'Sign In'
        )}
      </button>

      <p className="text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium hover:underline" style={{ color: 'var(--color-brand)' }}>
          Create one
        </Link>
      </p>
    </form>
  )
}
