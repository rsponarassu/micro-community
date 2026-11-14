'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CreateCommentSchema = z.object({
  post_id: z.string().uuid(),
  parent_id: z.string().uuid().optional().or(z.literal('')),
  content: z
    .string()
    .min(1, 'Comment cannot be empty.')
    .max(2000, 'Comment must be 2000 characters or fewer.')
    .trim(),
  is_anonymous: z.boolean().default(false),
})

export type CommentFormState =
  | {
      errors?: Record<string, string[]>
      message?: string
      success?: boolean
    }
  | undefined

/** Clears only the discussion surfaces touched by a comment. */
async function revalidateDiscussion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: string
) {
  const { data: post } = await supabase
    .from('posts')
    .select('community_id')
    .eq('id', postId)
    .single()

  revalidatePath('/')
  if (!post?.community_id) return

  const { data: community } = await supabase
    .from('communities')
    .select('slug')
    .eq('id', post.community_id)
    .single()

  if (community?.slug) {
    revalidatePath(`/c/${community.slug}`)
    revalidatePath(`/c/${community.slug}/post/${postId}`)
  }
}

export async function createComment(
  _prevState: CommentFormState,
  formData: FormData
): Promise<CommentFormState> {
  const parsed = CreateCommentSchema.safeParse({
    post_id: formData.get('post_id'),
    parent_id: formData.get('parent_id'),
    content: formData.get('content'),
    is_anonymous:
      formData.get('is_anonymous') === 'true' ||
      formData.get('is_anonymous') === 'on',
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { message: 'You must be signed in to comment.' }
  }

  // Rate limit check: max 8 comments per minute
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
  const { count: recentComments } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneMinuteAgo)

  if ((recentComments ?? 0) >= 8) {
    return { message: 'Rate limit exceeded. Please wait a minute before commenting again.' }
  }

  const { error } = await supabase.from('comments').insert({
    post_id: parsed.data.post_id,
    parent_id: parsed.data.parent_id || null,
    user_id: user.id,
    content: parsed.data.content,
    is_anonymous: parsed.data.is_anonymous,
  })

  if (error) {
    return { message: error.message }
  }

  await revalidateDiscussion(supabase, parsed.data.post_id)
  return { success: true }
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient()

  // Remember the parent post so the right pages can be revalidated after delete.
  const { data: comment } = await supabase
    .from('comments')
    .select('post_id')
    .eq('id', commentId)
    .single()

  const { error } = await supabase.from('comments').delete().eq('id', commentId)

  if (error) {
    throw new Error(error.message)
  }

  if (comment?.post_id) await revalidateDiscussion(supabase, comment.post_id)
  else revalidatePath('/')
}
