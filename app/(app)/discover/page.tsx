import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CommunityCard from '@/app/components/CommunityCard'

export const metadata: Metadata = {
  title: 'Discover Communities',
  description: 'Find and join communities that match your interests.',
}

const CATEGORIES = ['All', 'Academic', 'Social', 'Sports', 'Arts', 'Tech', 'Other']

type CommunityRow = {
  id: string
  name: string
  slug: string
  description: string | null
  category: string | null
  icon_url: string | null
  cover_url: string | null
  is_private: boolean
  created_at: string
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const { q, category } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('communities')
    .select('id, name, slug, description, category, icon_url, cover_url, is_private, created_at')
    .order('created_at', { ascending: false })
    .limit(40)

  if (q) {
    query = query.ilike('name', `%${q}%`)
  }
  if (category && category !== 'All') {
    query = query.eq('category', category)
  }

  const { data: rawCommunities, error } = await query
  // Cast needed because placeholder types don't fully satisfy Supabase's partial-select inference.
  // This will resolve automatically once real generated types are in place (M2).
  const communities = rawCommunities as CommunityRow[] | null

  // Fetch member counts for all returned communities in one query
  let memberCounts: Record<string, number> = {}
  if (communities && communities.length > 0) {
    const ids = communities.map((c) => c.id)
    const { data: rawCounts } = await supabase
      .from('community_members')
      .select('community_id')
      .in('community_id', ids)
      .eq('status', 'active')
    const counts = rawCounts as { community_id: string }[] | null
    if (counts) {
      memberCounts = counts.reduce<Record<string, number>>((acc, row) => {
        acc[row.community_id] = (acc[row.community_id] ?? 0) + 1
        return acc
      }, {})
    }
  }

  // Fetch current user's memberships to reflect join status
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userMemberships: Record<string, 'active' | 'pending' | 'banned'> = {}
  if (user && communities && communities.length > 0) {
    const ids = communities.map((c) => c.id)
    const { data: myMemberships } = await supabase
      .from('community_members')
      .select('community_id, status')
      .eq('user_id', user.id)
      .in('community_id', ids)

    const list = myMemberships as { community_id: string; status: 'active' | 'pending' | 'banned' }[] | null
    if (list) {
      list.forEach((m) => {
        userMemberships[m.community_id] = m.status
      })
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1 text-foreground">
            Discover Communities
          </h1>
          <p className="text-sm text-muted">
            Find and join focused groups that match your interests
          </p>
        </div>
        <Link
          href="/c/new"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-brand hover:bg-brand-hover text-white transition-colors shadow-xs shrink-0"
        >
          + Create Community
        </Link>
      </div>

      {/* Search + filter */}
      <form method="GET" className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search communities…"
          className="flex-1 px-3.5 py-2 rounded-lg text-sm bg-surface border border-border text-foreground placeholder:text-muted focus:ring-2 focus:ring-brand focus:outline-hidden transition-all"
        />
        <select
          name="category"
          defaultValue={category ?? 'All'}
          className="px-3.5 py-2 rounded-lg text-sm bg-surface border border-border text-foreground focus:ring-2 focus:ring-brand focus:outline-hidden transition-all"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand hover:bg-brand-hover transition-colors"
        >
          Search
        </button>
      </form>

      {error && (
        <div className="p-4 rounded-lg text-sm mb-4 bg-red-500/10 border border-red-500/20 text-red-500">
          Failed to load communities. Please try again.
        </div>
      )}

      {!communities?.length && !error && (
        <div className="text-center py-16 card p-8 border border-border">
          <div className="text-4xl mb-3">🏘️</div>
          <h2 className="text-lg font-semibold mb-1 text-foreground">
            No communities found
          </h2>
          <p className="text-sm text-muted mb-4">
            {q ? `No results matching "${q}"` : 'Be the first to create one!'}
          </p>
          <Link
            href="/c/new"
            className="inline-flex px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand hover:bg-brand-hover transition-colors"
          >
            Create Community
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {(communities ?? []).map((c) => {
          const mStatus = userMemberships[c.id]
          return (
            <CommunityCard
              key={c.id}
              community={{
                ...c,
                memberCount: memberCounts[c.id] ?? 0,
                isMember: mStatus === 'active',
                membershipStatus: mStatus ?? null,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
