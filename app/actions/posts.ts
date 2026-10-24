'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CreatePostSchema = z.object({
  community_id: z.string().uuid(),
  content: z
    .string()
    .min(1, 'Post content cannot be empty.')
    .max(5000, 'Post content must be 5000 characters or fewer.')
    .trim(),
  image_url: z.string().url('Invalid image URL').optional().or(z.literal('')),
  is_anonymous: z.boolean().default(false),
})

export type PostFormState =
  | {
      errors?: Record<string, string[]>
      message?: string
      success?: boolean
    }
  | undefined

export async function createPost(
  _prevState: PostFormState,
  formData: FormData
): Promise<PostFormState> {
  const parsed = CreatePostSchema.safeParse({
    community_id: formData.get('community_id'),
    content: formData.get('content'),
    image_url: formData.get('image_url'),
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
    return { message: 'You must be signed in to post.' }
  }

  // Rate limit check: max 5 posts per minute
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
  const { count: recentPosts } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneMinuteAgo)

  if ((recentPosts ?? 0) >= 5) {
    return { message: 'Rate limit exceeded. Please wait a minute before posting again.' }
  }

  // Insert post into base table (server side only)
  const { error } = await supabase.from('posts').insert({
    community_id: parsed.data.community_id,
    user_id: user.id,
    content: parsed.data.content,
    image_url: parsed.data.image_url || null,
    is_anonymous: parsed.data.is_anonymous,
  })

  if (error) {
    return { message: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deletePost(postId: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('delete_own_post', { p_post_id: postId })

  if (error) {
    // If not own post, check if moderator/owner and delete via base table
    const { error: directError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)

    if (directError) throw new Error(directError.message)
  }

  revalidatePath('/', 'layout')
}

export async function togglePostPin(postId: string, currentPinned: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('posts')
    .update({ is_pinned: !currentPinned })
    .eq('id', postId)

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function togglePostHide(postId: string, currentHidden: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('posts')
    .update({ is_hidden: !currentHidden })
    .eq('id', postId)

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function toggleReaction(postId: string, type: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('toggle_reaction', {
    p_post_id: postId,
    p_type: type,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}
