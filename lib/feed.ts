import type { SupabaseClient } from '@supabase/supabase-js'

export type ReactionType = 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry'

export interface ReactionSummary {
  type: ReactionType
  count: number
  reacted: boolean
}

export interface PostMeta {
  reactions: Record<string, ReactionSummary[]>
  commentCounts: Record<string, number>
}

/**
 * Loads reaction + comment-count metadata for a batch of posts.
 * Kept in one place so the home feed, community feed and search page
 * always render the same numbers.
 */
export async function loadPostMeta(
  supabase: SupabaseClient,
  postIds: string[],
  userId?: string
): Promise<PostMeta> {
  const reactions: Record<string, ReactionSummary[]> = {}
  const commentCounts: Record<string, number> = {}

  if (postIds.length === 0) return { reactions, commentCounts }

  const [{ data: rawReactions }, { data: rawComments }] = await Promise.all([
    supabase.from('reactions').select('post_id, user_id, type').in('post_id', postIds),
    supabase.from('comments_public').select('post_id').in('post_id', postIds),
  ])

  const rxList = (rawReactions ?? []) as {
    post_id: string
    user_id: string
    type: ReactionType
  }[]

  for (const r of rxList) {
    const bucket = (reactions[r.post_id] ??= [])
    const existing = bucket.find((x) => x.type === r.type)
    const mine = userId === r.user_id

    if (existing) {
      existing.count += 1
      if (mine) existing.reacted = true
    } else {
      bucket.push({ type: r.type, count: 1, reacted: mine })
    }
  }

  for (const c of (rawComments ?? []) as { post_id: string }[]) {
    commentCounts[c.post_id] = (commentCounts[c.post_id] ?? 0) + 1
  }

  return { reactions, commentCounts }
}
