import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { NextRequest } from 'next/server'

function formatIcsDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: rawEvent } = await supabase
    .from('events')
    .select('id, title, description, location, online_url, starts_at, ends_at, created_at')
    .eq('id', id)
    .single()

  if (!rawEvent) notFound()

  const event = rawEvent as {
    id: string
    title: string
    description: string | null
    location: string | null
    online_url: string | null
    starts_at: string
    ends_at: string | null
    created_at: string
  }

  const startDate = new Date(event.starts_at)
  const endDate = event.ends_at
    ? new Date(event.ends_at)
    : new Date(startDate.getTime() + 60 * 60 * 1000)

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Micro Community//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@microcommunity.local`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:${event.title.replace(/\n/g, ' ')}`,
    `DESCRIPTION:${(event.description ?? '').replace(/\n/g, '\\n')}`,
    event.location || event.online_url
      ? `LOCATION:${(event.location || event.online_url || '').replace(/\n/g, ' ')}`
      : '',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')

  return new Response(icsLines, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${event.title.replace(/[^a-z0-9]/gi, '_')}.ics"`,
    },
  })
}
