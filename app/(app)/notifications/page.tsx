import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NotificationItem, { type NotificationData } from './NotificationItem'
import MarkAllButton from './MarkAllButton'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Notifications | Micro Community',
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

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-xs text-muted mt-0.5">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
              : 'You are all caught up!'}
          </p>
        </div>

        {unreadCount > 0 && <MarkAllButton />}
      </div>

      {notifications.length === 0 ? (
        <div className="card p-12 text-center border border-border bg-surface">
          <div className="text-4xl mb-3">🔔</div>
          <h3 className="text-base font-semibold text-foreground">No notifications yet</h3>
          <p className="text-sm text-muted mt-1">
            When members reply to your posts or comments, alerts will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  )
}
