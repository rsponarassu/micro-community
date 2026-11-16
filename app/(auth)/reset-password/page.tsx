import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ResetPasswordForm from './ResetPasswordForm'

export const metadata: Metadata = { title: 'Set New Password' }

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string }>
}) {
  const { code } = await searchParams

  // If Supabase redirects directly to /reset-password?code=...
  // exchange the code for a session on the server before rendering the form
  if (code) {
    try {
      const supabase = await createClient()
      await supabase.auth.exchangeCodeForSession(code)
    } catch (err) {
      console.error('[ResetPasswordPage Session Exchange Error]', err)
    }
  }

  return (
    <div className="card p-7 sm:p-8 animate-slide-up rounded-3xl border border-border/80 bg-surface/90 backdrop-blur-md shadow-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Set a new password
        </h1>
        <p className="text-xs text-muted mt-1">
          Choose a strong password with at least 8 characters.
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  )
}
