import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Avatar from '@/app/components/ui/Avatar'
import PostCard, { type PostPublicData } from '@/app/components/PostCard'
import { formatDate } from '@/lib/utils'
import { loadPostMeta } from '@/lib/feed'
import { Calendar, Settings } from 'lucide-react'
import type { Metadata } from 'next'

interface ProfilePageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = await params
  return {
    title: `@${username}`,
    description: `View profile and community posts by @${username}`,
  }
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const supabase = await createClient()

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  // Fetch target profile
  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, created_at')
    .eq('username', username)
    .single()

  if (!rawProfile) notFound()

  const profile = rawProfile as {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
    bio: string | null
    created_at: string
  }

  const isOwnProfile = currentUser?.id === profile.id

  // Fetch joined communities
  const { data: rawMemberships } = await supabase
    .from('community_members')
    .select('community_id, role')
    .eq('user_id', profile.id)
    .eq('status', 'active')

  const memberships = (rawMemberships ?? []) as { community_id: string; role: string }[]
  const commIds = memberships.map((m) => m.community_id)

  let communities: { id: string; name: string; slug: string; category: string | null }[] = []
  if (commIds.length > 0) {
    const { data: comms } = await supabase
      .from('communities')
      .select('id, name, slug, category')
      .in('id', commIds)

    communities = (comms ?? []) as { id: string; name: string; slug: string; category: string | null }[]
  }

  // Fetch this user's non-anonymous posts strictly from posts_public view
  const { data: rawPosts } = await supabase
    .from('posts_public')
    .select('id, community_id, content, image_url, is_anonymous, is_pinned, created_at, author_id, author_username, author_display_name, author_avatar_url')
    .eq('author_username', profile.username)
    .order('created_at', { ascending: false })
    .limit(20)

  const posts = (rawPosts ?? []) as PostPublicData[]

  // Post cards need the parent community and engagement counters to render
  // links and reaction state; fetch both in one pass.
  const postCommunityIds = Array.from(new Set(posts.map((p) => p.community_id)))
  const [postCommsRes, meta] = await Promise.all([
    postCommunityIds.length > 0
      ? supabase.from('communities').select('id, name, slug').in('id', postCommunityIds)
      : Promise.resolve({ data: [] }),
    loadPostMeta(supabase, posts.map((p) => p.id), currentUser?.id),
  ])

  const commById = new Map(
    ((postCommsRes.data ?? []) as { id: string; name: string; slug: string }[]).map((c) => [
      c.id,
      c,
    ])
  )

  const enrichedPosts = posts.map((p) => ({
    ...p,
    community_slug: commById.get(p.community_id)?.slug,
    community_name: commById.get(p.community_id)?.name,
    reactions: meta.reactions[p.id] ?? [],
    commentCount: meta.commentCounts[p.id] ?? 0,
  }))

  return (
    <div className="page page-wide space-y-6">
      {/* Profile Header Card */}
      <div className="card p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Avatar
              src={profile.avatar_url}
              name={profile.display_name || profile.username}
              size={72}
            />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-foreground sm:text-2xl">
                {profile.display_name || profile.username}
              </h1>
              <p className="text-sm text-muted">@{profile.username}</p>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Joined {formatDate(profile.created_at)}</span>
              </div>
            </div>
          </div>

          {isOwnProfile && (
            <Link href="/settings" className="btn btn-secondary shrink-0">
              <Settings className="h-4 w-4" />
              Edit profile
            </Link>
          )}
        </div>

        {profile.bio && (
          <p className="mt-5 border-t border-border pt-5 text-sm leading-relaxed text-text-secondary">
            {profile.bio}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 cols: User's Public Posts */}
        <section className="space-y-3 lg:col-span-2">
          <h2 className="eyebrow">Public posts</h2>
          {enrichedPosts.length === 0 ? (
            <div className="card px-6 py-10 text-center text-sm text-muted">
              No public posts yet.
            </div>
          ) : (
            <div className="space-y-3">
              {enrichedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUser?.id}
                />
              ))}
            </div>
          )}
        </section>

        {/* Right col: Communities List */}
        <section className="space-y-3">
          <h2 className="eyebrow">Communities · {communities.length}</h2>
          {communities.length === 0 ? (
            <div className="card px-5 py-8 text-center text-xs text-muted">
              Not a member of any communities yet.
            </div>
          ) : (
            <div className="card space-y-0.5 p-2">
              {communities.map((c) => (
                <Link
                  key={c.id}
                  href={`/c/${c.slug}`}
                  className="group flex items-center justify-between gap-2 rounded-[var(--radius-md)] px-2.5 py-2 transition-colors hover:bg-surface-overlay"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-brand">
                      {c.name}
                    </div>
                    {c.category && (
                      <span className="text-[11px] text-muted">{c.category}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
