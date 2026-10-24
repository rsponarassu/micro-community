'use client'

import { useActionState, useState } from 'react'
import { createEvent, type EventFormState } from '@/app/actions/events'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Image from 'next/image'
import { Calendar, MapPin, Video, Users, Image as ImageIcon } from 'lucide-react'

interface EventFormProps {
  communityId: string
  onSuccess?: () => void
}

export default function EventForm({ communityId, onSuccess }: EventFormProps) {
  const [state, formAction, isPending] = useActionState<EventFormState, FormData>(
    createEvent,
    undefined
  )

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [onlineUrl, setOnlineUrl] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [capacity, setCapacity] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB.')
      return
    }

    try {
      setUploading(true)
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `events/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('community-media')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('community-media')
        .getPublicUrl(path)

      setCoverUrl(publicUrlData.publicUrl)
      toast.success('Cover uploaded!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form
      action={async (formData) => {
        formAction(formData)
        if (!state?.errors) onSuccess?.()
      }}
      className="space-y-4"
    >
      <input type="hidden" name="community_id" value={communityId} />
      <input type="hidden" name="cover_url" value={coverUrl} />

      {state?.message && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
          {state.message}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Event Title <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Next.js Architecture Workshop"
          className="w-full px-3.5 py-2.5 rounded-lg bg-surface border border-border text-foreground text-sm focus:ring-2 focus:ring-brand focus:outline-hidden"
        />
        {state?.errors?.title && (
          <p className="mt-1 text-xs text-red-500">{state.errors.title[0]}</p>
        )}
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Start Time <span className="text-red-500">*</span>
          </label>
          <input
            name="starts_at"
            type="datetime-local"
            required
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg bg-surface border border-border text-foreground text-xs focus:ring-2 focus:ring-brand focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> End Time
          </label>
          <input
            name="ends_at"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg bg-surface border border-border text-foreground text-xs focus:ring-2 focus:ring-brand focus:outline-hidden"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Description
        </label>
        <textarea
          name="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What should attendees expect? Prerequisites?"
          maxLength={2000}
          className="w-full px-3.5 py-2.5 rounded-lg bg-surface border border-border text-foreground text-sm focus:ring-2 focus:ring-brand focus:outline-hidden resize-none"
        />
      </div>

      {/* Location, Online URL, Capacity */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> Physical Location
          </label>
          <input
            name="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Room 402, Building A"
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <Video className="w-3.5 h-3.5" /> Online URL
          </label>
          <input
            name="online_url"
            type="url"
            value={onlineUrl}
            onChange={(e) => setOnlineUrl(e.target.value)}
            placeholder="https://meet.google.com/..."
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> Capacity Limit
          </label>
          <input
            name="capacity"
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="No limit"
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-foreground text-xs"
          />
        </div>
      </div>

      {/* Cover Image */}
      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
          Event Banner
        </label>
        <div className="flex items-center gap-3">
          {coverUrl && (
            <div className="relative w-20 h-14 rounded-lg overflow-hidden border border-border">
              <Image src={coverUrl} alt="Cover preview" fill className="object-cover" unoptimized />
            </div>
          )}
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface-raised hover:bg-surface text-xs font-medium text-foreground cursor-pointer transition-colors">
            <ImageIcon className="w-4 h-4 text-muted" />
            <span>{uploading ? 'Uploading...' : 'Upload Banner'}</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleCoverUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending || uploading}
        className="w-full py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white font-medium text-sm transition-colors shadow-xs disabled:opacity-60"
      >
        {isPending ? 'Publishing Event...' : 'Publish Event'}
      </button>
    </form>
  )
}
