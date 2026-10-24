import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PostCard, { type PostPublicData } from '@/app/components/PostCard'
import CommentThread, { type CommentPublicData } from '@/app/components/CommentThread'
import type { ReactionType } from '@/app/components/ReactionBar'
import { ArrowLeft } from 'lucide-react'

interface PostDetailPageProps {
  params: Promise<{ slug: string; id: string }>
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { slug, id: postId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch community
  const { data: rawCommunity } = await supabase
    .from('communities')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (!rawCommunity) notFound()
  const community = rawCommunity as { id: string; name: string; slug: string }

  // Fetch post strictly from posts_public view
  const { data: rawPost } = await supabase
    .from('posts_public')
    .select('id, community_id, content, image_url, is_anonymous, is_pinned, created_at, author_id, author_username, author_display_name, author_avatar_url')
    .eq('id', postId)
    .single()

  if (!rawPost) notFound()
  const post = rawPost as PostPublicData

  // Check moderator permissions
  let canModerate = false
  if (user) {
    const { data: mem } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', community.id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    const m = mem as { role: 'owner' | 'moderator' | 'member' } | null
    if (m?.role === 'owner' || m?.role === 'moderator') {
      canModerate = true
    }
  }

  // Fetch reactions for this post
  const { data: rawReactions } = await supabase
    .from('reactions')
    .select('type, user_id')
    .eq('post_id', postId)

  const reactionsList = (rawReactions ?? []) as { type: ReactionType; user_id: string }[]
  const reactionMap: Record<ReactionType, { count: number; reacted: boolean }> = {
    like: { count: 0, reacted: false },
    love: { count: 0, reacted: false },
    laugh: { count: 0, reacted: false },
    wow: { count: 0, reacted: false },
    sad: { count: 0, reacted: false },
    angry: { count: 0, reacted: false },
  }

  reactionsList.forEach((r) => {
    if (reactionMap[r.type]) {
      reactionMap[r.type].count += 1
      if (user?.id === r.user_id) reactionMap[r.type].reacted = true
    }
  })

  const reactions = (Object.keys(reactionMap) as ReactionType[]).map((type) => ({
    type,
    count: reactionMap[type].count,
    reacted: reactionMap[type].reacted,
  }))

  // Fetch comments strictly from comments_public view
  const { data: rawComments } = await supabase
    .from('comments_public')
    .select('id, post_id, parent_id, content, is_anonymous, created_at, author_id, author_username, author_display_name, author_avatar_url')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  const comments = (rawComments ?? []) as CommentPublicData[]

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-2">
      <Link
        href={`/c/${community.slug}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground font-medium transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to {community.name}</span>
      </Link>

      <PostCard
        post={{
          ...post,
          community_slug: community.slug,
          reactions,
          commentCount: comments.length,
          canModerate,
        }}
        currentUserId={user?.id}
      />

      <div className="pt-2">
        <h3 className="text-base font-bold text-foreground mb-4">
          Discussion ({comments.length})
        </h3>

        <CommentThread
          postId={postId}
          initialComments={comments}
          currentUserId={user?.id}
          canModerate={canModerate}
        />
      </div>
    </div>
  )
}
