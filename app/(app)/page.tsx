import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { ArrowRight, Compass, Hash, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { loadPostMeta } from '@/lib/feed'
import PostCard, { type PostPublicData } from '@/app/components/PostCard'
import ScrollReveal from '@/app/components/ui/ScrollReveal'

export const metadata: Metadata = {
  title: 'Home',
  description: 'The latest posts from every community you belong to.',
}

interface MembershipRow {
  community_id: string
  role: 'owner' | 'moderator' | 'member'
}

interface CommunityRow {
  id: string
  name: string
  slug: string
  icon_url: string | null
}

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('id', user.id)
    .single()

  const profile = rawProfile as {
    username: string | null
    display_name: string | null
  } | null

  if (!profile?.username) redirect('/onboarding')

  const { data: rawMemberships } = await supabase
    .from('community_members')
    .select('community_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('joined_at', { ascending: false })
    .limit(30)

  const memberships = (rawMemberships ?? []) as MembershipRow[]
  const communityIds = memberships.map((m) => m.community_id)
  const moderatorOf = new Set(
    memberships
      .filter((m) => m.role === 'owner' || m.role === 'moderator')
      .map((m) => m.community_id)
  )

  let communities: CommunityRow[] = []
  if (communityIds.length > 0) {
    const { data } = await supabase
      .from('communities')
      .select('id, name, slug, icon_url')
      .in('id', communityIds)
    communities = (data ?? []) as CommunityRow[]
  }

  const communityMap = communities.reduce<Record<string, CommunityRow>>(
    (acc, c) => ({ ...acc, [c.id]: c }),
    {}
  )

  let posts: PostPublicData[] = []
  if (communityIds.length > 0) {
    const { data } = await supabase
      .from('posts_public')
      .select(
        'id, community_id, content, image_url, is_anonymous, is_pinned, created_at, author_id, author_username, author_display_name, author_avatar_url'
      )
      .in('community_id', communityIds)
      .order('created_at', { ascending: false })
      .limit(25)
    posts = (data ?? []) as PostPublicData[]
  }

  const { reactions, commentCounts } = await loadPostMeta(
    supabase,
    posts.map((p) => p.id),
    user.id
  )

  const greeting = getGreeting()
  const firstName = (profile.display_name ?? profile.username ?? '').split(' ')[0]

  return (
    <div className="page space-y-5">
      <ScrollReveal animation="fade-up">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="page-title">
              {greeting}, {firstName}
            </h1>
            <p className="page-subtitle">
              {communityIds.length > 0
                ? `Latest activity across ${communityIds.length} ${
                    communityIds.length === 1 ? 'community' : 'communities'
                  } you follow.`
                : 'Join a community to start seeing posts here.'}
            </p>
          </div>
          <Link
            href="/discover"
            className="btn btn-secondary btn-sm shrink-0 hidden sm:inline-flex"
          >
            <Compass size={14} />
            Discover
          </Link>
        </div>
      </ScrollReveal>

      {communities.length > 0 && (
        <ScrollReveal animation="fade-up" delay={60}>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
            {communities.map((c) => (
              <Link
                key={c.id}
                href={`/c/${c.slug}`}
                className="chip shrink-0"
              >
                {c.icon_url ? (
                  <Image
                    src={c.icon_url}
                    alt=""
                    width={16}
                    height={16}
                    className="h-4 w-4 rounded object-cover"
                  />
                ) : (
                  <Hash size={12} className="text-muted" />
                )}
                {c.name}
              </Link>
            ))}
            <Link href="/c/new" className="chip shrink-0" aria-label="Create a community">
              <Plus size={12} />
              New
            </Link>
          </div>
        </ScrollReveal>
      )}

      {communityIds.length === 0 ? (
        <div className="card p-10 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-subtle text-brand">
            <Compass size={22} />
          </span>
          <h2 className="text-base font-semibold text-foreground">
            Your feed is empty
          </h2>
          <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
            Discover clubs, hostels and interest groups, then join a few to build
            your personal feed.
          </p>
          <Link href="/discover" className="btn btn-primary mt-5">
            Browse communities
            <ArrowRight size={15} />
          </Link>
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-10 text-center">
          <h2 className="text-base font-semibold text-foreground">Nothing here yet</h2>
          <p className="text-sm text-muted mt-1">
            Open a community below and be the first to post.
          </p>
          <Link
            href={`/c/${communities[0]?.slug ?? ''}`}
            className="btn btn-primary mt-5"
          >
            Open {communities[0]?.name ?? 'community'}
            <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post, idx) => {
            const community = communityMap[post.community_id]
            return (
              <ScrollReveal
                key={post.id}
                animation="fade-up"
                delay={Math.min(idx * 40, 240)}
                duration={420}
              >
                <PostCard
                  post={{
                    ...post,
                    community_slug: community?.slug,
                    community_name: community?.name,
                    reactions: reactions[post.id] ?? [],
                    commentCount: commentCounts[post.id] ?? 0,
                    canModerate: moderatorOf.has(post.community_id),
                  }}
                  currentUserId={user.id}
                />
              </ScrollReveal>
            )
          })}
        </div>
      )}
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
