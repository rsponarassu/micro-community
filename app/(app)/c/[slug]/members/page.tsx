import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Avatar from '@/app/components/ui/Avatar'
import Badge from '@/app/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import MemberActions from './MemberActions'

interface MembersPageProps {
  params: Promise<{ slug: string }>
}

export default async function MembersPage({ params }: MembersPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: rawCommunity } = await supabase
    .from('communities')
    .select('id, name')
    .eq('slug', slug)
    .single()

  if (!rawCommunity) notFound()
  const community = rawCommunity as { id: string; name: string }

  // Check caller role
  let callerRole: 'owner' | 'moderator' | null = null
  if (user) {
    const { data: callerMem } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', community.id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (callerMem?.role === 'owner' || callerMem?.role === 'moderator') {
      callerRole = callerMem.role
    }
  }

  // Fetch active memberships
  const { data: rawMembers } = await supabase
    .from('community_members')
    .select('user_id, role, joined_at')
    .eq('community_id', community.id)
    .eq('status', 'active')
    .order('joined_at', { ascending: true })

  const members = (rawMembers ?? []) as {
    user_id: string
    role: 'owner' | 'moderator' | 'member'
    joined_at: string
  }[]

  // Fetch profiles for these members
  const userIds = members.map((m) => m.user_id)
  let profileMap: Record<string, { username: string; display_name: string | null; avatar_url: string | null; bio: string | null }> = {}

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, bio')
      .in('id', userIds)

    const list = profiles as { id: string; username: string; display_name: string | null; avatar_url: string | null; bio: string | null }[] | null
    if (list) {
      profileMap = list.reduce<Record<string, { username: string; display_name: string | null; avatar_url: string | null; bio: string | null }>>((acc, p) => {
        acc[p.id] = p
        return acc
      }, {})
    }
  }

  // Sort: owner first, then moderator, then member
  const rolePriority = { owner: 0, moderator: 1, member: 2 }
  const sortedMembers = [...members].sort(
    (a, b) => rolePriority[a.role] - rolePriority[b.role]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Community Members</h2>
          <p className="text-xs text-muted">
            {members.length} {members.length === 1 ? 'member' : 'members'} in {community.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sortedMembers.map((m) => {
          const profile = profileMap[m.user_id]
          const isSelf = user?.id === m.user_id

          return (
            <div
              key={m.user_id}
              className="card p-4 border border-border bg-surface flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  src={profile?.avatar_url}
                  name={profile?.display_name || profile?.username || 'Member'}
                  size={40}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground truncate">
                      {profile?.display_name || profile?.username || 'Member'}
                    </span>
                    {m.role === 'owner' && <Badge variant="brand">Owner</Badge>}
                    {m.role === 'moderator' && <Badge variant="default">Mod</Badge>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted truncate">
                    {profile?.username && <span>@{profile.username}</span>}
                    <span>•</span>
                    <span>Joined {formatDate(m.joined_at)}</span>
                  </div>
                </div>
              </div>

              {!isSelf && callerRole && (
                <MemberActions
                  communityId={community.id}
                  targetUserId={m.user_id}
                  currentRole={m.role}
                  callerRole={callerRole}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
