import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Avatar from '@/app/components/ui/Avatar'
import PostCard, { type PostPublicData } from '@/app/components/PostCard'
import { formatDate } from '@/lib/utils'
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
    title: `@${username} | Micro Community`,
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Profile Header Card */}
      <div className="card p-6 sm:p-8 border border-border bg-surface shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar
              src={profile.avatar_url}
              name={profile.display_name || profile.username}
              size={72}
            />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {profile.display_name || profile.username}
              </h1>
              <p className="text-sm text-muted">@{profile.username}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted mt-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {formatDate(profile.created_at)}</span>
              </div>
            </div>
          </div>

          {isOwnProfile && (
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface-raised hover:bg-surface text-sm font-semibold text-foreground transition-colors shrink-0"
            >
              <Settings className="w-4 h-4 text-muted" />
              <span>Edit Profile</span>
            </Link>
          )}
        </div>

        {profile.bio && (
          <p className="text-sm text-foreground/90 mt-5 pt-5 border-t border-border leading-relaxed">
            {profile.bio}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 cols: User's Public Posts */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Public Posts</h2>
          {posts.length === 0 ? (
            <div className="card p-8 border border-border bg-surface text-center text-sm text-muted">
              No public posts shared yet.
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUser?.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right col: Communities List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">
            Communities ({communities.length})
          </h2>
          {communities.length === 0 ? (
            <div className="card p-6 border border-border bg-surface text-center text-xs text-muted">
              Not a member of any communities yet.
            </div>
          ) : (
            <div className="card p-3 border border-border bg-surface space-y-1">
              {communities.map((c) => (
                <Link
                  key={c.id}
                  href={`/c/${c.slug}`}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-raised transition-colors group"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-foreground group-hover:text-brand transition-colors truncate">
                      {c.name}
                    </div>
                    {c.category && (
                      <span className="text-[11px] text-muted">{c.category}</span>
                    )}
                  </div>
                  <span className="text-xs text-muted font-mono">/c/{c.slug}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
