import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NotificationItem, { type NotificationData } from './NotificationItem'
import MarkAllButton from './MarkAllButton'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Notifications',
  description: 'View alerts, comments on your posts, and community updates.',
}

export default async function NotificationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/notifications')

  const { data: rawNotifs } = await supabase
    .from('notifications')
    .select('id, type, payload, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(40)

  const notifications = (rawNotifs ?? []) as NotificationData[]
  const unreadCount = notifications.filter((n) => !n.is_read).length

  // Resolve community slugs in a single round-trip so every row can deep-link
  // straight to the discussion instead of dumping the user on /discover.
  const communityIds = Array.from(
    new Set(
      notifications
        .map((n) => n.payload?.community_id)
        .filter((v): v is string => typeof v === 'string')
    )
  )

  const slugById: Record<string, string> = {}
  if (communityIds.length > 0) {
    const { data: comms } = await supabase
      .from('communities')
      .select('id, slug')
      .in('id', communityIds)

    for (const c of (comms ?? []) as { id: string; slug: string }[]) {
      slugById[c.id] = c.slug
    }
  }

  const items = notifications.map((notification) => {
    const { community_id, post_id, comment_id } = notification.payload ?? {}
    const slug = typeof community_id === 'string' ? slugById[community_id] : undefined

    const href =
      slug && typeof post_id === 'string'
        ? `/c/${slug}/post/${post_id}${typeof comment_id === 'string' ? `#comment-${comment_id}` : ''}`
        : '/discover'

    return { notification, href }
  })

  return (
    <div className="page space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
              : 'You are all caught up.'}
          </p>
        </div>

        {unreadCount > 0 && <MarkAllButton />}
      </header>

      {items.length === 0 ? (
        <div className="card px-6 py-16 text-center">
          <div className="text-3xl" aria-hidden="true">
            🔔
          </div>
          <h2 className="mt-3 text-base font-semibold text-foreground">No notifications yet</h2>
          <p className="mt-1 text-sm text-muted">
            Replies to your posts and comments will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(({ notification, href }) => (
            <NotificationItem key={notification.id} notification={notification} href={href} />
          ))}
        </div>
      )}
    </div>
  )
}
