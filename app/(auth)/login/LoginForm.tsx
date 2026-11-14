'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { signIn, type AuthFormState } from '@/app/actions/auth'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null
  return (
    <p className="mt-1 text-xs text-danger" role="alert">
      {errors[0]}
    </p>
  )
}

/** Maps provider errors to copy a member can act on, without leaking setup details. */
function friendlyAuthError(message: string) {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Email or password is incorrect.'
  if (m.includes('email not confirmed')) return 'Please confirm your email address first.'
  if (m.includes('email logins are disabled')) return 'Email sign-in is currently unavailable.'
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.'
  }
  return message
}

export default function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signIn, undefined)
  const [passwordVisible, setPasswordVisible] = useState(false)

  useEffect(() => {
    if (state?.errors) {
      const firstError = Object.values(state.errors).flat()[0]
      if (firstError) toast.error(firstError)
    } else if (state?.message && !state.success) {
      toast.error(friendlyAuthError(state.message))
    }
  }, [state])

  return (
    <form action={action} className="space-y-4">
      {nextPath && <input type="hidden" name="next" value={nextPath} />}

      {state?.message && !state.success && (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border px-3 py-2 text-sm"
          style={{
            background: 'var(--color-danger-subtle)',
            borderColor: 'var(--color-danger)',
            color: 'var(--color-danger)',
          }}
        >
          {friendlyAuthError(state.message)}
        </p>
      )}

      <div>
        <label htmlFor="login-email" className="label">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="name@example.com"
          className="field"
        />
        <FieldError errors={state?.errors?.email} />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="login-password" className="label !mb-0">
            Password
          </label>
          <Link href="/forgot-password" className="text-xs text-brand hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            id="login-password"
            name="password"
            type={passwordVisible ? 'text' : 'password'}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="field pr-16"
          />
          <button
            type="button"
            onClick={() => setPasswordVisible((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-[11px] font-medium text-muted transition-colors hover:text-foreground"
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
          >
            {passwordVisible ? 'Hide' : 'Show'}
          </button>
        </div>
        <FieldError errors={state?.errors?.password} />
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary btn-lg btn-block">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          'Sign in'
        )}
      </button>

      <p className="text-center text-sm text-muted">
        New here?{' '}
        <Link href="/signup" className="font-medium text-brand hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  )
}
