import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import AdminJoinRequests from './AdminJoinRequests'
import AdminReportsQueue, { type ReportItem } from './AdminReportsQueue'
import { updateCommunity } from '@/app/actions/communities'
import Badge from '@/app/components/ui/Badge'

interface AdminPageProps {
  params: Promise<{ slug: string }>
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: rawCommunity } = await supabase
    .from('communities')
    .select('id, name, slug, description, category, is_private, icon_url, cover_url')
    .eq('slug', slug)
    .single()

  if (!rawCommunity) notFound()

  const community = rawCommunity as {
    id: string
    name: string
    slug: string
    description: string | null
    category: string | null
    is_private: boolean
    icon_url: string | null
    cover_url: string | null
  }

  // Check mod/owner permissions
  const { data: rawMem } = await supabase
    .from('community_members')
    .select('role')
    .eq('community_id', community.id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  const mem = rawMem as { role: 'owner' | 'moderator' | 'member' } | null
  if (!mem || (mem.role !== 'owner' && mem.role !== 'moderator')) {
    redirect(`/c/${community.slug}`)
  }

  // Fetch pending members
  const { data: rawPending } = await supabase
    .from('community_members')
    .select('user_id, joined_at')
    .eq('community_id', community.id)
    .eq('status', 'pending')

  const pendingList = (rawPending ?? []) as { user_id: string; joined_at: string }[]
  const pendingUserIds = pendingList.map((p) => p.user_id)

  let pendingProfiles: {
    userId: string
    displayName: string | null
    username: string
    avatarUrl: string | null
    joinedAt: string
  }[] = []

  if (pendingUserIds.length > 0) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', pendingUserIds)

    const pList = (profs ?? []) as { id: string; username: string; display_name: string | null; avatar_url: string | null }[]
    const profMap = pList.reduce<Record<string, { username: string; display_name: string | null; avatar_url: string | null }>>((acc, p) => {
      acc[p.id] = p
      return acc
    }, {})

    pendingProfiles = pendingList.map((p) => ({
      userId: p.user_id,
      joinedAt: p.joined_at,
      username: profMap[p.user_id]?.username ?? 'user',
      displayName: profMap[p.user_id]?.display_name ?? null,
      avatarUrl: profMap[p.user_id]?.avatar_url ?? null,
    }))
  }

  // Fetch open reports
  const { data: rawReports } = await supabase
    .from('reports')
    .select('id, reporter_id, target_type, target_id, reason, status, created_at')
    .eq('community_id', community.id)
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  const reports = (rawReports ?? []) as ReportItem[]

  const updateAction = updateCommunity.bind(null, community.id)

  return (
    <div className="space-y-8">
      {/* Pending Membership Approvals */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Pending Join Requests</h2>
            <p className="text-xs text-muted">
              Approve or decline requests from users waiting to join this private community.
            </p>
          </div>
          <Badge variant={pendingProfiles.length > 0 ? 'brand' : 'default'}>
            {pendingProfiles.length} Pending
          </Badge>
        </div>

        <AdminJoinRequests
          communityId={community.id}
          pendingMembers={pendingProfiles}
        />
      </div>

      {/* Reports Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Content Moderation & Reports</h2>
            <p className="text-xs text-muted">
              Review flagged posts and comments, hide offensive content, or unmask anonymous bad actors.
            </p>
          </div>
          <Badge variant={reports.length > 0 ? 'error' : 'default'}>
            {reports.length} Open
          </Badge>
        </div>

        <AdminReportsQueue
          communityId={community.id}
          initialReports={reports}
        />
      </div>

      {/* Edit Community Settings */}
      {mem.role === 'owner' && (
        <div className="card p-6 border border-border bg-surface space-y-4">
          <h2 className="text-lg font-bold text-foreground">Edit Community Details</h2>
          <form action={updateAction} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wider">
                Name
              </label>
              <input
                name="name"
                defaultValue={community.name}
                required
                className="w-full px-3.5 py-2 rounded-lg bg-surface-raised border border-border text-foreground text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wider">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                defaultValue={community.description ?? ''}
                className="w-full px-3.5 py-2 rounded-lg bg-surface-raised border border-border text-foreground text-sm resize-none"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand hover:bg-brand-hover text-white transition-colors"
            >
              Save Community Changes
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
