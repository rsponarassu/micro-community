import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EventCard, { type EventData } from '@/app/components/EventCard'
import CommunityEventsHeader from './CommunityEventsHeader'

interface CommunityEventsPageProps {
  params: Promise<{ slug: string }>
}

export default async function CommunityEventsPage({
  params,
}: CommunityEventsPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: rawCommunity } = await supabase
    .from('communities')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (!rawCommunity) notFound()
  const community = rawCommunity as { id: string; name: string; slug: string }

  // Check membership
  let isMember = false
  if (user) {
    const { data: mem } = await supabase
      .from('community_members')
      .select('status')
      .eq('community_id', community.id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    isMember = !!mem
  }

  // Fetch events
  const { data: rawEvents } = await supabase
    .from('events')
    .select('id, community_id, title, description, location, online_url, starts_at, ends_at, capacity, cover_url, is_cancelled')
    .eq('community_id', community.id)
    .order('starts_at', { ascending: true })

  const events = (rawEvents ?? []) as EventData[]
  const eventIds = events.map((e) => e.id)

  // Fetch RSVPs
  const rsvpCounts: Record<string, { going: number; interested: number }> = {}
  const userRsvps: Record<string, 'going' | 'interested'> = {}

  if (eventIds.length > 0) {
    const { data: rawRsvps } = await supabase
      .from('event_rsvps')
      .select('event_id, user_id, status')
      .in('event_id', eventIds)

    const list = (rawRsvps ?? []) as {
      event_id: string
      user_id: string
      status: 'going' | 'interested' | 'not_going'
    }[]

    list.forEach((r) => {
      if (!rsvpCounts[r.event_id]) {
        rsvpCounts[r.event_id] = { going: 0, interested: 0 }
      }
      if (r.status === 'going') rsvpCounts[r.event_id].going += 1
      if (r.status === 'interested') rsvpCounts[r.event_id].interested += 1

      if (user?.id === r.user_id && (r.status === 'going' || r.status === 'interested')) {
        userRsvps[r.event_id] = r.status
      }
    })
  }

  const now = new Date()
  const upcomingEvents = events.filter((e) => new Date(e.starts_at) >= now)
  const pastEvents = events.filter((e) => new Date(e.starts_at) < now)

  return (
    <div className="space-y-6">
      <CommunityEventsHeader
        communityId={community.id}
        canCreate={isMember}
        totalEvents={events.length}
      />

      {/* Upcoming Events */}
      <div>
        <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
          <span>Upcoming Events</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand">
            {upcomingEvents.length}
          </span>
        </h3>

        {upcomingEvents.length === 0 ? (
          <div className="card p-8 border border-border bg-surface text-center text-sm text-muted">
            No upcoming events scheduled right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingEvents.map((event) => (
              <EventCard
                key={event.id}
                event={{
                  ...event,
                  community_slug: community.slug,
                  community_name: community.name,
                  goingCount: rsvpCounts[event.id]?.going ?? 0,
                  interestedCount: rsvpCounts[event.id]?.interested ?? 0,
                  userRsvp: userRsvps[event.id] ?? null,
                }}
                isAuthenticated={!!user}
              />
            ))}
          </div>
        )}
      </div>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div className="pt-4">
          <h3 className="text-base font-bold text-foreground mb-3 text-muted">
            Past Events ({pastEvents.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
            {pastEvents.map((event) => (
              <EventCard
                key={event.id}
                event={{
                  ...event,
                  community_slug: community.slug,
                  community_name: community.name,
                  goingCount: rsvpCounts[event.id]?.going ?? 0,
                  interestedCount: rsvpCounts[event.id]?.interested ?? 0,
                  userRsvp: userRsvps[event.id] ?? null,
                }}
                isAuthenticated={!!user}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
