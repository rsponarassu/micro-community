import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/app/components/layout/AppShell'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile for sidebar/nav
  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url')
    .eq('id', user.id)
    .single()
  const profile = rawProfile as { username: string; display_name: string | null; avatar_url: string | null } | null

  // Fetch joined communities for sidebar (two-step to avoid nested join type issues)
  const { data: memberships } = await supabase
    .from('community_members')
    .select('community_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('joined_at', { ascending: false })
    .limit(20)

  const communityIds = (memberships ?? []).map((m) => (m as { community_id: string }).community_id)

  const joinedCommunities: { id: string; name: string; slug: string; icon_url: string | null }[] = []
  if (communityIds.length > 0) {
    const { data: comms } = await supabase
      .from('communities')
      .select('id, name, slug, icon_url')
      .in('id', communityIds)
      .limit(20)
    if (comms) joinedCommunities.push(...(comms as { id: string; name: string; slug: string; icon_url: string | null }[]))
  }

  // Fetch unread notification count
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return (
    <AppShell
      user={user}
      profile={profile ?? null}
      joinedCommunities={joinedCommunities}
      unreadCount={unreadCount ?? 0}
    >
      {children}
    </AppShell>
  )
}
