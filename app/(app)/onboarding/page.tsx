import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingForm from './OnboardingForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Complete Your Profile | Micro Community',
  description: 'Set your handle and profile info to start participating in communities.',
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // If profile is already complete, redirect to discover
  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url')
    .eq('id', user.id)
    .single()

  const profile = rawProfile as {
    username: string | null
    display_name: string | null
    avatar_url: string | null
  } | null

  // If user already has a customized username (and not default placeholder), go straight to discover
  // We allow user to edit, or if they haven't set their handle yet
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-lg bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome to the Platform</h1>
          <p className="text-sm text-muted mt-2">
            Choose your community handle and tell others a little about yourself before exploring groups.
          </p>
        </div>

        <OnboardingForm
          userId={user.id}
          initialDisplayName={profile?.display_name ?? ''}
          initialUsername={profile?.username ?? ''}
          initialAvatarUrl={profile?.avatar_url ?? ''}
        />
      </div>
    </div>
  )
}
