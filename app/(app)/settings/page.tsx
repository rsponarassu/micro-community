import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsForm from './SettingsForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings | Micro Community',
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

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
        <p className="text-sm text-muted mt-0.5">
          Update your public profile, avatar, and application appearance.
        </p>
      </div>

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
