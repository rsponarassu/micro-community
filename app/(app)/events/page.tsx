import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EventCard, { type EventData } from '@/app/components/EventCard'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Events & meetups',
  description: 'Explore upcoming platform events, meetups, and manage your RSVPs.',
}

/** Events that started more than 12h ago are no longer "upcoming". */
function recentCutoff() {
  return new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const activeTab = tab === 'all' ? 'all' : 'attending'
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/events')

  // Fetch all upcoming events
  const { data: rawEvents } = await supabase
    .from('events')
    .select('id, community_id, title, description, location, online_url, starts_at, ends_at, capacity, cover_url, is_cancelled')
    .gte('starts_at', recentCutoff())
    .order('starts_at', { ascending: true })
    .limit(60)

  const allEvents = (rawEvents ?? []) as EventData[]
  const eventIds = allEvents.map((e) => e.id)

  // Fetch community slugs & names for these events
  const commIds = Array.from(new Set(allEvents.map((e) => e.community_id)))
  let commMap: Record<string, { name: string; slug: string }> = {}

  if (commIds.length > 0) {
    const { data: comms } = await supabase
      .from('communities')
      .select('id, name, slug')
      .in('id', commIds)

    const cList = (comms ?? []) as { id: string; name: string; slug: string }[]
    commMap = cList.reduce<Record<string, { name: string; slug: string }>>((acc, c) => {
      acc[c.id] = c
      return acc
    }, {})
  }

  // Fetch RSVPs
  const rsvpCounts: Record<string, { going: number; interested: number }> = {}
  const userRsvps: Record<string, 'going' | 'interested'> = {}

  if (eventIds.length > 0) {
    const { data: rawRsvps } = await supabase
      .from('event_rsvps')
      .select('event_id, user_id, status')
      .in('event_id', eventIds)

    const rList = (rawRsvps ?? []) as {
      event_id: string
      user_id: string
      status: 'going' | 'interested' | 'not_going'
    }[]

    rList.forEach((r) => {
      if (!rsvpCounts[r.event_id]) {
        rsvpCounts[r.event_id] = { going: 0, interested: 0 }
      }
      if (r.status === 'going') rsvpCounts[r.event_id].going += 1
      if (r.status === 'interested') rsvpCounts[r.event_id].interested += 1

      if (user.id === r.user_id && (r.status === 'going' || r.status === 'interested')) {
        userRsvps[r.event_id] = r.status
      }
    })
  }

  const eventsWithMeta = allEvents.map((e) => ({
    ...e,
    community_name: commMap[e.community_id]?.name,
    community_slug: commMap[e.community_id]?.slug,
    goingCount: rsvpCounts[e.id]?.going ?? 0,
    interestedCount: rsvpCounts[e.id]?.interested ?? 0,
    userRsvp: userRsvps[e.id] ?? null,
  }))

  const attendingEvents = eventsWithMeta.filter(
    (e) => e.userRsvp === 'going' || e.userRsvp === 'interested'
  )

  const displayedEvents = activeTab === 'all' ? eventsWithMeta : attendingEvents

  return (
    <div className="page page-wide space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Events</h1>
          <p className="page-subtitle">
            Meetups, workshops and RSVPs across every community you belong to.
          </p>
        </div>

        <nav
          aria-label="Event filter"
          className="flex shrink-0 items-center gap-1 rounded-[var(--radius-lg)] border border-border bg-surface p-1"
        >
          <Link
            href="/events?tab=attending"
            aria-current={activeTab === 'attending' ? 'page' : undefined}
            className={`tab ${activeTab === 'attending' ? 'tab-active' : ''}`}
          >
            My RSVPs
            <span className="text-muted">{attendingEvents.length}</span>
          </Link>
          <Link
            href="/events?tab=all"
            aria-current={activeTab === 'all' ? 'page' : undefined}
            className={`tab ${activeTab === 'all' ? 'tab-active' : ''}`}
          >
            All events
            <span className="text-muted">{eventsWithMeta.length}</span>
          </Link>
        </nav>
      </div>

      {displayedEvents.length === 0 ? (
        <div className="card px-6 py-16 text-center">
          <div className="text-3xl" aria-hidden="true">
            📅
          </div>
          <h3 className="mt-3 text-base font-semibold text-foreground">
            {activeTab === 'attending' ? 'No RSVPs yet' : 'No upcoming events'}
          </h3>
          <p className="mt-1 text-sm text-muted">
            {activeTab === 'attending'
              ? 'Browse what is coming up and mark yourself as going or interested.'
              : 'Join a community to take part in its meetups.'}
          </p>
          {activeTab === 'attending' && (
            <Link href="/events?tab=all" className="btn btn-primary mt-5">
              Browse all events
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayedEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isAuthenticated={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}
