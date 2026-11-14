import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PostCard, { type PostPublicData } from '@/app/components/PostCard'
import PostForm from '@/app/components/PostForm'
import ScrollReveal from '@/app/components/ui/ScrollReveal'
import { loadPostMeta } from '@/lib/feed'

interface CommunityFeedPageProps {
  params: Promise<{ slug: string }>
}

export default async function CommunityFeedPage({
  params,
}: CommunityFeedPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch community
  const { data: rawCommunity } = await supabase
    .from('communities')
    .select('id, name, slug, is_private')
    .eq('slug', slug)
    .single()

  if (!rawCommunity) notFound()

  const community = rawCommunity as {
    id: string
    name: string
    slug: string
    is_private: boolean
  }

  // Check user membership & role
  let isMember = false
  let canModerate = false
  if (user) {
    const { data: mem } = await supabase
      .from('community_members')
      .select('role, status')
      .eq('community_id', community.id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    const m = mem as { role: 'owner' | 'moderator' | 'member'; status: string } | null
    if (m) {
      isMember = true
      canModerate = m.role === 'owner' || m.role === 'moderator'
    }
  }

  // Fetch posts strictly from posts_public view (anonymity-enforced)
  const { data: rawPosts } = await supabase
    .from('posts_public')
    .select('id, community_id, content, image_url, is_anonymous, is_pinned, created_at, author_id, author_username, author_display_name, author_avatar_url')
    .eq('community_id', community.id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(30)

  const posts = (rawPosts ?? []) as PostPublicData[]
  const postIds = posts.map((p) => p.id)

  // Reactions + comment counts come from one shared helper so the community
  // feed, home feed and search always agree on the numbers.
  const [meta, profileRes] = await Promise.all([
    loadPostMeta(supabase, postIds, user?.id),
    user
      ? supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', user.id)
          .single()
      : Promise.resolve({ data: null }),
  ])

  const myProfile = profileRes.data as
    | { display_name: string | null; avatar_url: string | null }
    | null

  return (
    <div className="space-y-4">
      {/* Post creation box */}
      {isMember ? (
        <PostForm
          communityId={community.id}
          avatarUrl={myProfile?.avatar_url}
          displayName={myProfile?.display_name ?? undefined}
        />
      ) : (
        <div className="card px-4 py-5 text-center text-sm text-muted">
          Join this community to start posting and taking part in discussions.
        </div>
      )}

      {/* Posts List */}
      {posts.length === 0 ? (
        <ScrollReveal animation="fade-up">
          <div className="card px-6 py-16 text-center">
            <div className="text-3xl" aria-hidden="true">
              💬
            </div>
            <h2 className="mt-3 text-base font-semibold text-foreground">No posts yet</h2>
            <p className="mt-1 text-sm text-muted">
              Be the first to share an update, a question, or an anonymous thought.
            </p>
          </div>
        </ScrollReveal>
      ) : (
        <div className="space-y-3">
          {posts.map((post, idx) => (
            <ScrollReveal
              key={post.id}
              animation="fade-up"
              delay={Math.min(idx * 50, 250)}
              duration={450}
            >
              <PostCard
                post={{
                  ...post,
                  community_slug: community.slug,
                  community_name: community.name,
                  reactions: meta.reactions[post.id] ?? [],
                  commentCount: meta.commentCounts[post.id] ?? 0,
                  canModerate,
                }}
                currentUserId={user?.id}
              />
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  )
}
