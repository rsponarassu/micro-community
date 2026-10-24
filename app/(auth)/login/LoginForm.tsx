'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { signIn, type AuthFormState } from '@/app/actions/auth'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'

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

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (state?.message && !state.success) {
      if (state.message.toLowerCase().includes('email logins are disabled')) {
        toast.error('Email logins are disabled in Supabase', {
          description: 'Enable it in Supabase Dashboard: Auth ➔ Providers ➔ Email ➔ Turn ON Enable Email provider.',
          duration: 8000,
        })
      } else if (state.message.toLowerCase().includes('email not confirmed')) {
        toast.error('Email not confirmed in Supabase', {
          description: 'Please confirm your email or run fix-auth.sql in Supabase SQL editor.',
        })
      } else if (state.message.toLowerCase().includes('invalid login credentials')) {
        toast.error('Invalid email or password', {
          description: 'Please verify your credentials or create an account first.',
        })
      } else {
        toast.error(state.message)
      }
    } else if (state?.errors) {
      const firstError = Object.values(state.errors)[0]?.[0]
      if (firstError) {
        toast.error(firstError)
      }
    }
  }, [state])

  function handleFillDemo() {
    setEmail('alex@microcommunity.com')
    setPassword('Password123')
    toast.info('Filled credentials: alex@microcommunity.com / Password123')
  }

  const [copied, setCopied] = useState(false)
  function copySql() {
    navigator.clipboard.writeText('UPDATE auth.users SET email_confirmed_at = now();')
    setCopied(true)
    toast.success('SQL copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Quick fill banner */}
      <div className="p-3.5 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-between text-xs">
        <div>
          <div className="flex items-center gap-1.5 text-foreground font-semibold">
            <Sparkles className="w-4 h-4 text-brand shrink-0" />
            <span>Demo Test Account</span>
          </div>
          <span className="text-[11px] text-muted">alex@microcommunity.com / Password123</span>
        </div>
        <button
          type="button"
          onClick={handleFillDemo}
          className="px-3 py-1.5 rounded-lg bg-brand text-white font-medium hover:bg-brand-dark transition-colors shadow-xs"
        >
          Fill Demo User
        </button>
      </div>

      <form action={action} className="space-y-4">
        {nextPath && (
          <input type="hidden" name="next" value={nextPath} />
        )}

        {state?.message && !state.success && (
          <div
            className="p-3.5 rounded-xl text-xs space-y-2"
            style={{
              background: 'hsl(0 84% 96%)',
              color: 'var(--color-error)',
              border: '1px solid hsl(0 84% 88%)',
            }}
            role="alert"
          >
            <div className="font-semibold flex items-center gap-1.5">
              <span>⚠️</span>
              <span>{state.message}</span>
            </div>
            {state.message.toLowerCase().includes('email logins are disabled') && (
              <div className="pt-2 border-t border-red-200 text-[11px] space-y-2 text-slate-800">
                <p className="font-semibold text-red-600">The Email Provider is turned OFF in your Supabase project.</p>
                <div className="bg-white/80 p-2.5 rounded-lg border border-red-100 space-y-1 text-[11px]">
                  <p className="font-medium text-slate-900">How to enable it (10 seconds):</p>
                  <ol className="list-decimal pl-4 space-y-0.5 text-slate-700">
                    <li>Open <strong>Supabase Dashboard</strong></li>
                    <li>Go to <strong>Authentication</strong> ➔ <strong>Providers</strong> ➔ <strong>Email</strong></li>
                    <li>Turn the top switch <strong>&quot;Enable Email provider&quot;</strong> to <strong>ON</strong> (green)</li>
                    <li>(Optional) Turn <strong>&quot;Confirm email&quot;</strong> to <strong>OFF</strong></li>
                    <li>Click <strong>Save</strong> at the bottom</li>
                  </ol>
                </div>
              </div>
            )}
            {state.message.toLowerCase().includes('email not confirmed') && (
              <div className="pt-2 border-t border-red-200 text-[11px] space-y-1.5 text-slate-800">
                <p className="font-medium">To fix this in your Supabase project (choose one):</p>
                <div className="flex items-center gap-2 bg-white/80 p-2 rounded-lg font-mono text-[10px] border border-red-100">
                  <span className="flex-1 truncate">UPDATE auth.users SET email_confirmed_at = now();</span>
                  <button
                    type="button"
                    onClick={copySql}
                    className="px-2 py-0.5 rounded bg-brand text-white font-sans text-[10px] shrink-0"
                  >
                    {copied ? 'Copied!' : 'Copy SQL'}
                  </button>
                </div>
                <p className="text-[10px] text-muted">Or in Supabase: <strong>Auth ➔ Providers ➔ Email ➔ Turn OFF Confirm email</strong></p>
              </div>
            )}
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
    </div>
  )
}
