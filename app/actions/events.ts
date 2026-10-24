'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CreateEventSchema = z.object({
  community_id: z.string().uuid(),
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters.')
    .max(200, 'Title must be 200 characters or fewer.')
    .trim(),
  description: z.string().max(2000).optional().or(z.literal('')),
  location: z.string().max(200).optional().or(z.literal('')),
  online_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  starts_at: z.string().min(1, 'Start date and time are required.'),
  ends_at: z.string().optional().or(z.literal('')),
  capacity: z.coerce.number().int().positive().optional().or(z.literal(0)),
  cover_url: z.string().url().optional().or(z.literal('')),
})

export type EventFormState =
  | {
      errors?: Record<string, string[]>
      message?: string
      success?: boolean
    }
  | undefined

export async function createEvent(
  _prevState: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const parsed = CreateEventSchema.safeParse({
    community_id: formData.get('community_id'),
    title: formData.get('title'),
    description: formData.get('description'),
    location: formData.get('location'),
    online_url: formData.get('online_url'),
    starts_at: formData.get('starts_at'),
    ends_at: formData.get('ends_at'),
    capacity: formData.get('capacity') || undefined,
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
    return { message: 'You must be signed in to create an event.' }
  }

  const { error } = await supabase.from('events').insert({
    community_id: parsed.data.community_id,
    created_by: user.id,
    title: parsed.data.title,
    description: parsed.data.description || null,
    location: parsed.data.location || null,
    online_url: parsed.data.online_url || null,
    starts_at: new Date(parsed.data.starts_at).toISOString(),
    ends_at: parsed.data.ends_at ? new Date(parsed.data.ends_at).toISOString() : null,
    capacity: parsed.data.capacity || null,
    cover_url: parsed.data.cover_url || null,
  })

  if (error) {
    return { message: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function rsvpEvent(
  eventId: string,
  status: 'going' | 'interested' | 'not_going'
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Must be signed in to RSVP.')

  // If status is going, enforce capacity
  if (status === 'going') {
    const { data: event } = await supabase
      .from('events')
      .select('capacity')
      .eq('id', eventId)
      .single()

    if (event?.capacity) {
      const { count } = await supabase
        .from('event_rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'going')

      if ((count ?? 0) >= event.capacity) {
        throw new Error('This event is at maximum capacity.')
      }
    }
  }

  const { error } = await supabase.from('event_rsvps').upsert({
    event_id: eventId,
    user_id: user.id,
    status,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function unrsvpEvent(eventId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Must be signed in.')

  const { error } = await supabase
    .from('event_rsvps')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function cancelEvent(eventId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('events')
    .update({ is_cancelled: true })
    .eq('id', eventId)

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}
