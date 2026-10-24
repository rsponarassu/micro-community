import { createClient } from '@/lib/supabase/server'
import SearchBar from '@/app/components/SearchBar'
import CommunityCard, { type CommunityCardData } from '@/app/components/CommunityCard'
import PostCard, { type PostPublicData } from '@/app/components/PostCard'
import Avatar from '@/app/components/ui/Avatar'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search | Micro Community',
  description: 'Search across all communities, posts, and member profiles.',
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string; type?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = '', type = 'all' } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let communities: CommunityCardData[] = []
  let posts: PostPublicData[] = []
  let profiles: { id: string; username: string; display_name: string | null; avatar_url: string | null; bio: string | null }[] = []

  if (q.trim()) {
    // 1. Search Communities
    if (type === 'all' || type === 'communities') {
      const { data: rawComms } = await supabase
        .from('communities')
        .select('id, name, slug, description, category, icon_url, cover_url, is_private')
        .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
        .limit(10)

      if (rawComms) {
        communities = (rawComms as { id: string; name: string; slug: string; description: string | null; category: string | null; icon_url: string | null; cover_url: string | null; is_private: boolean }[]).map((c) => ({
          ...c,
          memberCount: 0,
        }))
      }
    }

    // 2. Search Posts strictly from posts_public view
    if (type === 'all' || type === 'posts') {
      const { data: rawPosts } = await supabase
        .from('posts_public')
        .select('id, community_id, content, image_url, is_anonymous, is_pinned, created_at, author_id, author_username, author_display_name, author_avatar_url')
        .ilike('content', `%${q}%`)
        .limit(15)

      if (rawPosts) posts = rawPosts as PostPublicData[]
    }

    // 3. Search Profiles
    if (type === 'all' || type === 'members') {
      const { data: rawProfs } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio')
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .limit(10)

      if (rawProfs) profiles = rawProfs as { id: string; username: string; display_name: string | null; avatar_url: string | null; bio: string | null }[]
    }
  }

  const totalResults = communities.length + posts.length + profiles.length

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Search</h1>
        <SearchBar />

        {/* Filter Tabs */}
        {q && (
          <div className="flex items-center gap-1 border-b border-border pb-2 text-xs font-semibold overflow-x-auto">
            <Link
              href={`/search?q=${encodeURIComponent(q)}&type=all`}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                type === 'all' ? 'bg-brand text-white' : 'text-muted hover:text-foreground'
              }`}
            >
              All Results ({totalResults})
            </Link>
            <Link
              href={`/search?q=${encodeURIComponent(q)}&type=communities`}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                type === 'communities' ? 'bg-brand text-white' : 'text-muted hover:text-foreground'
              }`}
            >
              Communities ({communities.length})
            </Link>
            <Link
              href={`/search?q=${encodeURIComponent(q)}&type=posts`}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                type === 'posts' ? 'bg-brand text-white' : 'text-muted hover:text-foreground'
              }`}
            >
              Posts ({posts.length})
            </Link>
            <Link
              href={`/search?q=${encodeURIComponent(q)}&type=members`}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                type === 'members' ? 'bg-brand text-white' : 'text-muted hover:text-foreground'
              }`}
            >
              People ({profiles.length})
            </Link>
          </div>
        )}
      </div>

      {q.trim() && totalResults === 0 && (
        <div className="card p-12 text-center border border-border bg-surface">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-base font-semibold text-foreground">No matches found</h3>
          <p className="text-sm text-muted mt-1">
            Try checking for typos or searching with different keywords.
          </p>
        </div>
      )}

      {/* Communities Section */}
      {communities.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
            Communities ({communities.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {communities.map((c) => (
              <CommunityCard key={c.id} community={c} />
            ))}
          </div>
        </div>
      )}

      {/* People Section */}
      {profiles.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
            People ({profiles.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profiles.map((p) => (
              <Link
                key={p.id}
                href={`/u/${p.username}`}
                className="card p-3.5 border border-border bg-surface hover:border-brand/40 flex items-center gap-3 transition-colors group"
              >
                <Avatar
                  src={p.avatar_url}
                  name={p.display_name || p.username}
                  size={42}
                />
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-foreground group-hover:text-brand transition-colors truncate">
                    {p.display_name || p.username}
                  </div>
                  <div className="text-xs text-muted">@{p.username}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Posts Section */}
      {posts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
            Posts ({posts.length})
          </h2>
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
