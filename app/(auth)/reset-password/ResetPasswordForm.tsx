'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { resetPassword } from '@/app/actions/auth'
import { toast } from 'sonner'
import { sound } from '@/lib/sound'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [pending, setPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function validate(val: string): string | null {
    if (!val || val.length < 8) return 'Password must be at least 8 characters.'
    if (!/[a-zA-Z]/.test(val)) return 'Password must contain at least one letter.'
    if (!/[0-9]/.test(val)) return 'Password must contain at least one number.'
    return null
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMessage(null)

    const valErr = validate(password)
    if (valErr) {
      sound.playError()
      setErrorMessage(valErr)
      toast.error(valErr)
      return
    }

    sound.playClick()
    setPending(true)

    try {
      const supabase = createClient()

      // First attempt: client-side update (captures URL hash recovery tokens & existing sessions)
      const { error: clientError } = await supabase.auth.updateUser({
        password,
      })

      if (!clientError) {
        sound.playSuccess()
        toast.success('Password updated successfully! Welcome back.')
        router.push('/login?toast=custom&msg=Password+updated+successfully!+Please+log+in.')
        return
      }

      // Second attempt: server action fallback (if session was established via server cookies)
      const formData = new FormData()
      formData.append('password', password)
      const res = await resetPassword(undefined, formData)

      if (res?.errors?.password?.[0]) {
        sound.playError()
        setErrorMessage(res.errors.password[0])
        toast.error(res.errors.password[0])
        return
      }

      if (res?.message && !res.success) {
        sound.playError()
        const msg = res.message.includes('Auth session missing')
          ? 'Your password reset link has expired or is invalid. Please request a new one.'
          : res.message
        setErrorMessage(msg)
        toast.error(msg)
        return
      }

      sound.playSuccess()
      toast.success('Password updated successfully!')
      router.push('/login?toast=custom&msg=Password+updated+successfully!+Please+log+in.')
    } catch (err: unknown) {
      sound.playError()
      const msg = err instanceof Error ? err.message : 'An error occurred while resetting your password.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div
          role="alert"
          className="rounded-[var(--radius-md)] border px-3 py-2 text-xs"
          style={{
            background: 'var(--color-danger-subtle)',
            borderColor: 'var(--color-danger)',
            color: 'var(--color-danger)',
          }}
        >
          {errorMessage}
        </div>
      )}

      <div>
        <label htmlFor="reset-password" className="label">
          New Password
        </label>
        <div className="relative">
          <input
            id="reset-password"
            name="password"
            type={passwordVisible ? 'text' : 'password'}
            required
            autoComplete="new-password"
            placeholder="At least 8 characters, letters & numbers"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field pr-16"
          />
          <button
            type="button"
            onClick={() => setPasswordVisible((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-foreground transition-colors"
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
          >
            {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="hint mt-1.5 text-[11px] text-muted">
          Must be 8+ characters and contain at least one letter and one number.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary w-full justify-center py-2.5 text-sm font-semibold shadow-md disabled:opacity-60"
      >
        {pending ? (
          <span className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Updating Password…
          </span>
        ) : (
          'Set New Password'
        )}
      </button>
    </form>
  )
}
