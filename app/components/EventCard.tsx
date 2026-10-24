'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { rsvpEvent, unrsvpEvent } from '@/app/actions/events'
import { formatDate, getGCalUrl } from '@/lib/utils'
import { Calendar, MapPin, Video, Users, Download, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import Badge from './ui/Badge'

export interface EventData {
  id: string
  community_id: string
  title: string
  description: string | null
  location: string | null
  online_url: string | null
  starts_at: string
  ends_at: string | null
  capacity: number | null
  cover_url: string | null
  is_cancelled: boolean
  community_slug?: string
  community_name?: string
  goingCount: number
  interestedCount: number
  userRsvp?: 'going' | 'interested' | null
}

export default function EventCard({
  event,
  isAuthenticated,
}: {
  event: EventData
  isAuthenticated: boolean
}) {
  const [rsvp, setRsvp] = useState<'going' | 'interested' | null>(
    event.userRsvp ?? null
  )
  const [goingCount, setGoingCount] = useState(event.goingCount)
  const [loading, setLoading] = useState(false)

  async function handleRsvp(newStatus: 'going' | 'interested') {
    if (!isAuthenticated) {
      toast.info('Please log in to RSVP.')
      return
    }

    setLoading(true)
    try {
      if (rsvp === newStatus) {
        await unrsvpEvent(event.id)
        if (rsvp === 'going') setGoingCount((c) => Math.max(0, c - 1))
        setRsvp(null)
        toast.info('RSVP removed')
      } else {
        await rsvpEvent(event.id, newStatus)
        if (newStatus === 'going' && rsvp !== 'going') {
          setGoingCount((c) => c + 1)
        } else if (newStatus !== 'going' && rsvp === 'going') {
          setGoingCount((c) => Math.max(0, c - 1))
        }
        setRsvp(newStatus)
        toast.success(newStatus === 'going' ? 'See you there!' : 'Marked as interested')
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'RSVP failed')
    } finally {
      setLoading(false)
    }
  }

  const isFull = event.capacity ? goingCount >= event.capacity : false

  const gCalUrl = getGCalUrl({
    title: event.title,
    description: event.description,
    location: event.location || event.online_url,
    startAt: event.starts_at,
    endAt: event.ends_at,
  })

  return (
    <div className="card overflow-hidden border border-border bg-surface hover:border-brand/40 transition-all flex flex-col">
      {event.cover_url && (
        <div className="h-40 w-full relative bg-surface-raised overflow-hidden">
          <Image
            src={event.cover_url}
            alt={event.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col space-y-4">
        {/* Date & Community Header */}
        <div className="flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-1.5 font-medium text-brand">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(event.starts_at)}</span>
          </div>

          {event.community_name && event.community_slug && (
            <Link
              href={`/c/${event.community_slug}`}
              className="hover:text-foreground transition-colors font-medium"
            >
              /c/{event.community_slug}
            </Link>
          )}
        </div>

        {/* Title & Status */}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-foreground">{event.title}</h3>
            {event.is_cancelled && <Badge variant="error">Cancelled</Badge>}
            {isFull && <Badge variant="warning">At Capacity</Badge>}
          </div>

          {event.description && (
            <p className="text-xs text-muted line-clamp-2 mt-1.5 leading-relaxed">
              {event.description}
            </p>
          )}
        </div>

        {/* Location or Meeting link */}
        <div className="space-y-1.5 text-xs text-muted">
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {event.online_url && (
            <div className="flex items-center gap-2">
              <Video className="w-3.5 h-3.5 shrink-0 text-brand" />
              <a
                href={event.online_url}
                target="_blank"
                rel="noreferrer"
                className="text-brand hover:underline truncate"
              >
                Join Online Meeting
              </a>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>
              {goingCount} going {event.capacity ? `/ ${event.capacity} max` : ''}
              {event.interestedCount > 0 ? ` • ${event.interestedCount} interested` : ''}
            </span>
          </div>
        </div>

        {/* Action Controls & Calendar Export */}
        <div className="mt-auto pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRsvp('going')}
              disabled={loading || (isFull && rsvp !== 'going') || event.is_cancelled}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                rsvp === 'going'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-brand hover:bg-brand-hover text-white'
              }`}
            >
              {rsvp === 'going' ? '✓ Going' : 'RSVP Going'}
            </button>

            <button
              onClick={() => handleRsvp('interested')}
              disabled={loading || event.is_cancelled}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 border ${
                rsvp === 'interested'
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                  : 'bg-surface-raised border-border text-foreground hover:bg-surface'
              }`}
            >
              {rsvp === 'interested' ? '★ Interested' : 'Interested'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={gCalUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-md hover:bg-surface-raised text-muted hover:text-foreground transition-colors"
              title="Add to Google Calendar"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href={`/api/events/${event.id}/ics`}
              download
              className="p-1.5 rounded-md hover:bg-surface-raised text-muted hover:text-foreground transition-colors"
              title="Download .ics Calendar File"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
