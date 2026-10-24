import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PostCard, { type PostPublicData } from '@/app/components/PostCard'
import PostForm from '@/app/components/PostForm'
import type { ReactionType } from '@/app/components/ReactionBar'
import ScrollReveal from '@/app/components/ui/ScrollReveal'

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

  // Fetch reaction counts & current user reaction status
  const reactionMap: Record<
    string,
    { type: ReactionType; count: number; reacted: boolean }[]
  > = {}

  if (postIds.length > 0) {
    const { data: rawReactions } = await supabase
      .from('reactions')
      .select('post_id, user_id, type')
      .in('post_id', postIds)

    const rxList = (rawReactions ?? []) as {
      post_id: string
      user_id: string
      type: ReactionType
    }[]

    rxList.forEach((r) => {
      if (!reactionMap[r.post_id]) {
        reactionMap[r.post_id] = []
      }
      const existing = reactionMap[r.post_id].find((x) => x.type === r.type)
      const isMine = user?.id === r.user_id
      if (existing) {
        existing.count += 1
        if (isMine) existing.reacted = true
      } else {
        reactionMap[r.post_id].push({
          type: r.type,
          count: 1,
          reacted: isMine,
        })
      }
    })
  }

  // Fetch comment counts
  const commentCounts: Record<string, number> = {}
  if (postIds.length > 0) {
    const { data: rawComments } = await supabase
      .from('comments_public')
      .select('post_id')
      .in('post_id', postIds)

    const cList = (rawComments ?? []) as { post_id: string }[]
    cList.forEach((c) => {
      commentCounts[c.post_id] = (commentCounts[c.post_id] ?? 0) + 1
    })
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Post creation box */}
      {isMember ? (
        <PostForm communityId={community.id} />
      ) : (
        <div className="card p-4 border border-border bg-surface-raised text-center text-sm text-muted">
          Join this community to share posts and discussions.
        </div>
      )}

      {/* Posts List */}
      {posts.length === 0 ? (
        <ScrollReveal animation="fade-up">
          <div className="card p-12 text-center border border-border bg-surface">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="text-base font-semibold text-foreground">No posts yet</h3>
            <p className="text-sm text-muted mt-1">
              Be the first to share an update, question, or anonymous thought with this community!
            </p>
          </div>
        </ScrollReveal>
      ) : (
        <div className="space-y-4">
          {posts.map((post, idx) => (
            <ScrollReveal
              key={post.id}
              animation="fade-up"
              delay={Math.min(idx * 60, 300)}
              duration={500}
            >
              <PostCard
                post={{
                  ...post,
                  community_slug: community.slug,
                  reactions: reactionMap[post.id] ?? [],
                  commentCount: commentCounts[post.id] ?? 0,
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
