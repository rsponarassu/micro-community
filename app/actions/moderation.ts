'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ReportSchema = z.object({
  target_type: z.enum(['post', 'comment', 'user', 'community']),
  target_id: z.string().uuid(),
  community_id: z.string().uuid().optional().or(z.literal('')),
  reason: z
    .string()
    .min(1, 'Please select or enter a reason.')
    .max(500, 'Reason must be 500 characters or fewer.')
    .trim(),
})

export type ModerationFormState =
  | {
      message?: string
      success?: boolean
    }
  | undefined

export async function reportContent(
  _prevState: ModerationFormState,
  formData: FormData
): Promise<ModerationFormState> {
  const parsed = ReportSchema.safeParse({
    target_type: formData.get('target_type'),
    target_id: formData.get('target_id'),
    community_id: formData.get('community_id'),
    reason: formData.get('reason'),
  })

  if (!parsed.success) {
    return { message: 'Invalid report submission.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { message: 'You must be signed in to submit a report.' }
  }

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    target_type: parsed.data.target_type,
    target_id: parsed.data.target_id,
    community_id: parsed.data.community_id || null,
    reason: parsed.data.reason,
    status: 'open',
  })

  if (error) {
    return { message: error.message }
  }

  return { success: true, message: 'Report submitted for moderator review.' }
}

export async function resolveReport(
  reportId: string,
  action: 'resolved' | 'dismissed'
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Must be signed in.')

  const { error } = await supabase
    .from('reports')
    .update({ status: action })
    .eq('id', reportId)

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function hideContent(
  targetType: 'post' | 'comment',
  targetId: string
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Must be signed in.')

  const table = targetType === 'post' ? 'posts' : 'comments'
  const { error } = await supabase
    .from(table)
    .update({ is_hidden: true })
    .eq('id', targetId)

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function unmaskAuthor(postId: string, communityId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('unmask_post_author', {
    p_post_id: postId,
    p_community_id: communityId,
  })

  if (error) throw new Error(error.message)
  return data as string // Returns unmasked author UUID
}
