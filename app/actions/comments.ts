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

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
}
