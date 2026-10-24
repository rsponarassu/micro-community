'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const CreateCommunitySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.').max(50, 'Name must be 50 characters or fewer.').trim(),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters.')
    .max(30, 'Slug must be 30 characters or fewer.')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens.')
    .trim(),
  description: z.string().max(500, 'Description must be 500 characters or fewer.').optional().or(z.literal('')),
  category: z.string().min(1, 'Please select a category.').trim(),
  is_private: z.boolean().default(false),
  icon_url: z.string().url('Invalid icon URL').optional().or(z.literal('')),
  cover_url: z.string().url('Invalid cover URL').optional().or(z.literal('')),
})

export type CommunityFormState =
  | {
      errors?: Record<string, string[]>
      message?: string
      success?: boolean
    }
  | undefined

export async function createCommunity(
  _prevState: CommunityFormState,
  formData: FormData
): Promise<CommunityFormState> {
  const parsed = CreateCommunitySchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    category: formData.get('category'),
    is_private: formData.get('is_private') === 'true' || formData.get('is_private') === 'on',
    icon_url: formData.get('icon_url'),
    cover_url: formData.get('cover_url'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { message: 'You must be signed in to create a community.' }
  }

  // Check unique slug
  const { data: existing } = await supabase
    .from('communities')
    .select('id')
    .eq('slug', parsed.data.slug)
    .single()

  if (existing) {
    return { errors: { slug: ['This community slug is already taken.'] } }
  }

  // Insert community
  const { data: community, error: commError } = await supabase
    .from('communities')
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      category: parsed.data.category,
      is_private: parsed.data.is_private,
      icon_url: parsed.data.icon_url || null,
      cover_url: parsed.data.cover_url || null,
      created_by: user.id,
    })
    .select('id, slug')
    .single()

  if (commError || !community) {
    return { message: commError?.message ?? 'Failed to create community.' }
  }

  // Add creator as owner
  await supabase.from('community_members').insert({
    community_id: community.id,
    user_id: user.id,
    role: 'owner',
    status: 'active',
  })

  revalidatePath('/discover')
  revalidatePath('/', 'layout')
  redirect(`/c/${community.slug}?toast=community_created`)
}

export async function joinCommunity(communityId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Must be signed in.')

  // Check if private
  const { data: comm } = await supabase
    .from('communities')
    .select('is_private, slug')
    .eq('id', communityId)
    .single()

  if (!comm) throw new Error('Community not found.')

  const status = comm.is_private ? 'pending' : 'active'

  const { error } = await supabase.from('community_members').upsert({
    community_id: communityId,
    user_id: user.id,
    role: 'member',
    status,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/c/${comm.slug}`)
  revalidatePath('/discover')
  revalidatePath('/', 'layout')

  return { status }
}

export async function leaveCommunity(communityId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Must be signed in.')

  // Check if sole owner
  const { data: member } = await supabase
    .from('community_members')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', user.id)
    .single()

  if (member?.role === 'owner') {
    const { count } = await supabase
      .from('community_members')
      .select('*', { count: 'exact', head: true })
      .eq('community_id', communityId)
      .eq('role', 'owner')

    if ((count ?? 0) <= 1) {
      throw new Error('You cannot leave as the sole owner. Transfer ownership first.')
    }
  }

  const { error } = await supabase
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/', 'layout')
  revalidatePath('/discover')
}

export async function approveJoin(userId: string, communityId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('community_members')
    .update({ status: 'active' })
    .eq('community_id', communityId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  revalidatePath(`/c/${communityId}/admin`)
}

export async function rejectJoin(userId: string, communityId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  revalidatePath(`/c/${communityId}/admin`)
}

export async function updateMemberRole(
  userId: string,
  communityId: string,
  role: 'owner' | 'moderator' | 'member'
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('community_members')
    .update({ role })
    .eq('community_id', communityId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  revalidatePath(`/c/${communityId}/members`)
}

export async function removeMember(userId: string, communityId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  revalidatePath(`/c/${communityId}/members`)
}

export async function banMember(userId: string, communityId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('community_members')
    .update({ status: 'banned' })
    .eq('community_id', communityId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  revalidatePath(`/c/${communityId}/members`)
}

export async function updateCommunity(
  communityId: string,
  formData: FormData
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Must be signed in.')

  const name = formData.get('name')?.toString()
  const description = formData.get('description')?.toString()
  const category = formData.get('category')?.toString()
  const icon_url = formData.get('icon_url')?.toString()
  const cover_url = formData.get('cover_url')?.toString()

  const { error } = await supabase
    .from('communities')
    .update({
      name,
      description: description || null,
      category,
      icon_url: icon_url || null,
      cover_url: cover_url || null,
    })
    .eq('id', communityId)

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}
