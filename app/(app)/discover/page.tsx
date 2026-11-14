import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CommunityCard from '@/app/components/CommunityCard'
import VideoHero from '@/app/components/ui/VideoHero'
import ScrollReveal from '@/app/components/ui/ScrollReveal'

export const metadata: Metadata = {
  title: 'Discover Communities',
  description: 'Find and join communities that match your interests.',
}

const CATEGORIES = ['All', 'Academic', 'Social', 'Sports', 'Arts', 'Tech', 'Other']

/** `%` and `_` are ILIKE wildcards — letting them through turns a search
 *  for "_" into "match everything" and wrecks the result set. */
function escapeLike(value: string) {
  return value.replace(/[%_\\]/g, (ch) => `\\${ch}`)
}

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
  const searchTerm = q?.trim() ?? ''
  const activeCategory = category && CATEGORIES.includes(category) ? category : 'All'

  let query = supabase
    .from('communities')
    .select('id, name, slug, description, category, icon_url, cover_url, is_private, created_at')
    .order('created_at', { ascending: false })
    .limit(40)

  if (searchTerm) {
    query = query.ilike('name', `%${escapeLike(searchTerm)}%`)
  }
  if (activeCategory !== 'All') {
    query = query.eq('category', activeCategory)
  }

  const { data: rawCommunities, error } = await query
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

  const buildCategoryHref = (value: string) => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('q', searchTerm)
    if (value !== 'All') params.set('category', value)
    const qs = params.toString()
    return qs ? `/discover?${qs}` : '/discover'
  }

  return (
    <div className="page page-wide space-y-6">
      {/* Video Hero Spotlight Banner */}
      {!searchTerm && activeCategory === 'All' && (
        <ScrollReveal animation="fade-down" duration={700}>
          <VideoHero />
        </ScrollReveal>
      )}

      <ScrollReveal animation="fade-up" delay={100}>
        <div className="mb-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="page-title">Discover</h1>
            <p className="page-subtitle">
              Find and join focused groups that match your interests.
            </p>
          </div>
          <Link href="/c/new" className="btn btn-primary shrink-0">
            Create community
          </Link>
        </div>
      </ScrollReveal>

      {/* Search + category filters */}
      <ScrollReveal animation="fade-up" delay={150}>
        <div className="space-y-3">
          <form method="GET" role="search" className="flex gap-2">
            <input
              name="q"
              defaultValue={searchTerm}
              placeholder="Search communities…"
              aria-label="Search communities"
              className="field flex-1"
            />
            {activeCategory !== 'All' && (
              <input type="hidden" name="category" value={activeCategory} />
            )}
            <button type="submit" className="btn btn-secondary">
              Search
            </button>
          </form>

          <nav aria-label="Filter by category" className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                href={buildCategoryHref(c)}
                aria-current={activeCategory === c ? 'page' : undefined}
                className={`chip ${activeCategory === c ? 'chip-active' : ''}`}
              >
                {c}
              </Link>
            ))}
          </nav>
        </div>
      </ScrollReveal>

      {error && (
        <div
          role="alert"
          className="rounded-[var(--radius-md)] border px-4 py-3 text-sm"
          style={{
            background: 'var(--color-danger-subtle)',
            borderColor: 'var(--color-danger)',
            color: 'var(--color-danger)',
          }}
        >
          We couldn&apos;t load communities right now. Please refresh and try again.
        </div>
      )}

      {!communities?.length && !error && (
        <div className="card px-6 py-16 text-center">
          <div className="text-3xl" aria-hidden="true">
            🏘️
          </div>
          <h2 className="mt-3 text-base font-semibold text-foreground">
            {searchTerm ? 'No communities match that search' : 'No communities yet'}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {searchTerm
              ? `Nothing found for “${searchTerm}”. Try a broader term.`
              : 'Be the first to start one and invite your people.'}
          </p>
          <Link href="/c/new" className="btn btn-primary mt-5">
            Create community
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(communities ?? []).map((c, idx) => {
          const mStatus = userMemberships[c.id]
          return (
            <ScrollReveal
              key={c.id}
              animation="fade-up"
              delay={Math.min(idx * 60, 400)}
              duration={500}
            >
              <CommunityCard
                community={{
                  ...c,
                  memberCount: memberCounts[c.id] ?? 0,
                  isMember: mStatus === 'active',
                  membershipStatus: mStatus ?? null,
                }}
              />
            </ScrollReveal>
          )
        })}
      </div>
    </div>
  )
}
