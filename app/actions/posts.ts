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

  // Revalidate only the views this post can appear in. `revalidatePath('/','layout')`
  // used to wipe the whole route cache on every write.
  await revalidatePostSurfaces(supabase, parsed.data.community_id)
  return { success: true }
}

/** Clears just the feed surfaces a post belongs to. */
async function revalidatePostSurfaces(
  supabase: Awaited<ReturnType<typeof createClient>>,
  communityId: string
) {
  const { data } = await supabase
    .from('communities')
    .select('slug')
    .eq('id', communityId)
    .single()

  revalidatePath('/')
  if (data?.slug) revalidatePath(`/c/${data.slug}`)
}

export async function deletePost(postId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('You must be signed in.')

  const { error: rpcError } = await supabase.rpc('delete_own_post', { p_post_id: postId })

  if (rpcError) {
    // Not the author. Fall back to a moderator delete only after confirming the
    // role here — the previous code deleted unconditionally and hid RPC failures.
    const { data: post } = await supabase
      .from('posts')
      .select('community_id')
      .eq('id', postId)
      .single()

    if (!post) throw new Error('Post not found.')

    const { data: membership } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', post.community_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    const role = (membership as { role?: string } | null)?.role
    if (role !== 'owner' && role !== 'moderator') {
      throw new Error('You do not have permission to delete this post.')
    }

    const { error: moderatorError } = await supabase.from('posts').delete().eq('id', postId)
    if (moderatorError) throw new Error(moderatorError.message)

    await revalidatePostSurfaces(supabase, post.community_id)
    return
  }

  revalidatePath('/')
}

export async function togglePostPin(postId: string, currentPinned: boolean) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('posts')
    .update({ is_pinned: !currentPinned })
    .eq('id', postId)
    .select('community_id')
    .single()

  if (error) throw new Error(error.message)
  if (data?.community_id) await revalidatePostSurfaces(supabase, data.community_id)
}

export async function togglePostHide(postId: string, currentHidden: boolean) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('posts')
    .update({ is_hidden: !currentHidden })
    .eq('id', postId)
    .select('community_id')
    .single()

  if (error) throw new Error(error.message)
  if (data?.community_id) await revalidatePostSurfaces(supabase, data.community_id)
}

export async function toggleReaction(postId: string, type: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('toggle_reaction', {
    p_post_id: postId,
    p_type: type,
  })

  if (error) throw new Error(error.message)
  // No revalidation on purpose: ReactionBar keeps its own optimistic state and
  // re-syncs from props, so purging the cache per tap was pure overhead.
}
