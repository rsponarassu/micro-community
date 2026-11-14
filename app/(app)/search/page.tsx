import { createClient } from '@/lib/supabase/server'
import SearchBar from '@/app/components/SearchBar'
import CommunityCard, { type CommunityCardData } from '@/app/components/CommunityCard'
import PostCard, { type PostPublicData } from '@/app/components/PostCard'
import Avatar from '@/app/components/ui/Avatar'
import Link from 'next/link'
import type { Metadata } from 'next'
import { loadPostMeta } from '@/lib/feed'

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search across all communities, posts, and member profiles.',
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string; type?: string }>
}

type SearchTab = 'all' | 'communities' | 'posts' | 'members'
const TABS: SearchTab[] = ['all', 'communities', 'posts', 'members']
const TAB_LABELS: Record<SearchTab, string> = {
  all: 'All',
  communities: 'Communities',
  posts: 'Posts',
  members: 'People',
}

/**
 * PostgREST parses `.or()` as a mini expression, so commas, parentheses and
 * wildcards inside raw user input break the filter — or worse, let a caller
 * inject extra conditions. Strip them before interpolating.
 */
function toFilterTerm(input: string) {
  return input.trim().replace(/[,()*:%\\"']/g, ' ').replace(/\s+/g, ' ').trim()
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = '', type } = await searchParams
  const activeTab: SearchTab = TABS.includes(type as SearchTab) ? (type as SearchTab) : 'all'

  const rawTerm = q.trim()
  const term = toFilterTerm(rawTerm)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let communities: CommunityCardData[] = []
  let posts: PostPublicData[] = []
  let profiles: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
    bio: string | null
  }[] = []

  if (term) {
    const wantsCommunities = activeTab === 'all' || activeTab === 'communities'
    const wantsPosts = activeTab === 'all' || activeTab === 'posts'
    const wantsPeople = activeTab === 'all' || activeTab === 'members'

    // All three lookups are independent — run them together instead of serially.
    const [communitiesRes, postsRes, profilesRes] = await Promise.all([
      wantsCommunities
        ? supabase
            .from('communities')
            .select('id, name, slug, description, category, icon_url, cover_url, is_private')
            .or(`name.ilike.%${term}%,description.ilike.%${term}%`)
            .limit(10)
        : Promise.resolve({ data: [] }),
      wantsPosts
        ? supabase
            .from('posts_public')
            .select(
              'id, community_id, content, image_url, is_anonymous, is_pinned, created_at, author_id, author_username, author_display_name, author_avatar_url'
            )
            .ilike('content', `%${term}%`)
            .order('created_at', { ascending: false })
            .limit(15)
        : Promise.resolve({ data: [] }),
      wantsPeople
        ? supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url, bio')
            .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
            .limit(10)
        : Promise.resolve({ data: [] }),
    ])

    if (communitiesRes.data) {
      communities = (
        communitiesRes.data as Omit<CommunityCardData, 'memberCount'>[]
      ).map((c) => ({ ...c, memberCount: 0 }))
    }

    const rawPosts = (postsRes.data ?? []) as PostPublicData[]
    if (rawPosts.length > 0) {
      const communityIds = Array.from(new Set(rawPosts.map((p) => p.community_id)))
      const [{ data: comms }, meta] = await Promise.all([
        supabase.from('communities').select('id, slug, name').in('id', communityIds),
        loadPostMeta(
          supabase,
          rawPosts.map((p) => p.id),
          user?.id
        ),
      ])

      const byId = new Map(
        ((comms ?? []) as { id: string; slug: string; name: string }[]).map((c) => [c.id, c])
      )

      posts = rawPosts.map((p) => ({
        ...p,
        community_slug: byId.get(p.community_id)?.slug,
        community_name: byId.get(p.community_id)?.name,
        reactions: meta.reactions[p.id] ?? [],
        commentCount: meta.commentCounts[p.id] ?? 0,
      }))
    }

    if (profilesRes.data) {
      profiles = profilesRes.data as typeof profiles
    }
  }

  const totalResults = communities.length + posts.length + profiles.length
  const counts: Record<SearchTab, number> = {
    all: totalResults,
    communities: communities.length,
    posts: posts.length,
    members: profiles.length,
  }

  const tabHref = (tab: SearchTab) => {
    const params = new URLSearchParams()
    if (rawTerm) params.set('q', rawTerm)
    if (tab !== 'all') params.set('type', tab)
    const qs = params.toString()
    return qs ? `/search?${qs}` : '/search'
  }

  return (
    <div className="page page-wide space-y-5">
      <header className="space-y-3">
        <h1 className="page-title">Search</h1>
        <SearchBar />

        {rawTerm && (
          <nav aria-label="Filter results" className="no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5">
            {TABS.map((tab) => (
              <Link
                key={tab}
                href={tabHref(tab)}
                aria-current={activeTab === tab ? 'page' : undefined}
                className={`tab ${activeTab === tab ? 'tab-active' : ''}`}
              >
                {TAB_LABELS[tab]}
                <span className="text-muted">{counts[tab]}</span>
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* Initial state */}
      {!rawTerm && (
        <div className="card px-6 py-16 text-center">
          <div className="text-3xl" aria-hidden="true">
            🔍
          </div>
          <p className="mt-3 text-base font-semibold text-foreground">
            Find communities, discussions and people
          </p>
          <p className="mt-1 text-sm text-muted">
            Start typing above — results update as you go.
          </p>
        </div>
      )}

      {/* Nothing found */}
      {rawTerm && totalResults === 0 && (
        <div className="card px-6 py-16 text-center">
          <div className="text-3xl" aria-hidden="true">
            🫥
          </div>
          <h2 className="mt-3 text-base font-semibold text-foreground">No matches</h2>
          <p className="mt-1 text-sm text-muted">
            Nothing matched “{rawTerm}”. Try a shorter or more general term.
          </p>
        </div>
      )}

      {communities.length > 0 && (
        <section className="space-y-3">
          <h2 className="eyebrow">Communities · {communities.length}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {communities.map((c) => (
              <CommunityCard key={c.id} community={c} />
            ))}
          </div>
        </section>
      )}

      {profiles.length > 0 && (
        <section className="space-y-3">
          <h2 className="eyebrow">People · {profiles.length}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {profiles.map((p) => (
              <Link
                key={p.id}
                href={`/u/${p.username}`}
                className="card card-interactive flex items-center gap-3 p-3.5"
              >
                <Avatar src={p.avatar_url} name={p.display_name || p.username} size={40} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {p.display_name || p.username}
                  </div>
                  <div className="truncate text-xs text-muted">@{p.username}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="space-y-3">
          <h2 className="eyebrow">Posts · {posts.length}</h2>
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={user?.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
