'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { markNotificationRead } from '@/app/actions/notifications'
import { formatRelative } from '@/lib/utils'
import { MessageSquare, Bell } from 'lucide-react'

export interface NotificationData {
  id: string
  type: string
  payload: Record<string, unknown>
  is_read: boolean
  created_at: string
}

export default function NotificationItem({
  notification,
}: {
  notification: NotificationData
}) {
  const router = useRouter()
  const [isRead, setIsRead] = useState(notification.is_read)

  async function handleClick() {
    if (!isRead) {
      setIsRead(true)
      await markNotificationRead(notification.id)
    }

    const payload = notification.payload as {
      post_id?: string
      community_id?: string
      comment_id?: string
    }

    if (payload.post_id) {
      router.push(`/discover`)
    }
  }

  const isComment = notification.type === 'comment'
  const isReply = notification.type === 'reply'

  return (
    <div
      onClick={handleClick}
      className={`card p-4 border transition-all cursor-pointer flex items-start gap-3.5 ${
        isRead
          ? 'bg-surface border-border opacity-80 hover:opacity-100'
          : 'bg-surface-raised border-brand/40 shadow-xs'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
          isRead ? 'bg-surface-raised text-muted' : 'bg-brand/10 text-brand'
        }`}
      >
        {isComment || isReply ? (
          <MessageSquare className="w-4 h-4" />
        ) : (
          <Bell className="w-4 h-4" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">
            {isComment
              ? 'New comment on your post'
              : isReply
              ? 'Someone replied to your comment'
              : 'Notification received'}
          </p>
          <span className="text-xs text-muted shrink-0">
            {formatRelative(notification.created_at)}
          </span>
        </div>

        <p className="text-xs text-muted mt-0.5">
          {notification.payload?.is_anonymous
            ? 'An anonymous member participated in the discussion.'
            : 'Click to open the discussion.'}
        </p>
      </div>

      {!isRead && (
        <span className="w-2.5 h-2.5 rounded-full bg-brand shrink-0 mt-1.5" />
      )}
    </div>
  )
}
