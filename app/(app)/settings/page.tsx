import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsForm from './SettingsForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your profile, bio, avatar, and appearance.',
}

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/settings')

  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('username, display_name, bio, avatar_url')
    .eq('id', user.id)
    .single()

  const profile = rawProfile as {
    username: string
    display_name: string | null
    bio: string | null
    avatar_url: string | null
  } | null

  // A signed-in user without a handle has not finished onboarding yet.
  if (!profile?.username) redirect('/onboarding')

  return (
    <div className="page space-y-5">
      <header>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">
          Update your public profile, avatar, and appearance.
        </p>
      </header>

      <SettingsForm
        userId={user.id}
        email={user.email ?? ''}
        initialUsername={profile?.username ?? ''}
        initialDisplayName={profile?.display_name ?? ''}
        initialBio={profile?.bio ?? ''}
        initialAvatarUrl={profile?.avatar_url ?? ''}
      />
    </div>
  )
}
