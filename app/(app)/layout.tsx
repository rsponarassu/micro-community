import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'
import AppShell from '@/app/components/layout/AppShell'
import { isNextInternalError } from '@/lib/utils'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user: User | null = null
  let profile: { username: string; display_name: string | null; avatar_url: string | null } | null = null
  let joinedCommunities: { id: string; name: string; slug: string; icon_url: string | null }[] = []
  let unreadCount = 0

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null

    if (user) {
      // Fetch profile for sidebar/nav
      const { data: rawProfile } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url')
        .eq('id', user.id)
        .single()
      profile = rawProfile as typeof profile

      // Fetch joined communities for sidebar
      const { data: memberships } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('joined_at', { ascending: false })
        .limit(20)

      const communityIds = (memberships ?? []).map((m) => (m as { community_id: string }).community_id)

      if (communityIds.length > 0) {
        const { data: comms } = await supabase
          .from('communities')
          .select('id, name, slug, icon_url')
          .in('id', communityIds)
          .limit(20)
        if (comms) joinedCommunities = comms as typeof joinedCommunities
      }

      // Fetch unread notification count
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      unreadCount = count ?? 0
    }
  } catch (err) {
    if (isNextInternalError(err)) throw err
    // High-concurrency resiliency shield: log and fallback safely without crashing
    console.error('[AppLayout Resilient Shield]', err)
  }

  return (
    <AppShell
      user={user}
      profile={profile}
      joinedCommunities={joinedCommunities}
      unreadCount={unreadCount}
    >
      {children}
    </AppShell>
  )
}
