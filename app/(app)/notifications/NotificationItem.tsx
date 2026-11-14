'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { markNotificationRead } from '@/app/actions/notifications'
import { formatRelative } from '@/lib/utils'
import { MessageSquare, Bell, CornerDownRight } from 'lucide-react'

export interface NotificationData {
  id: string
  type: string
  payload: Record<string, unknown>
  is_read: boolean
  created_at: string
}

export default function NotificationItem({
  notification,
  href,
}: {
  notification: NotificationData
  href: string
}) {
  const [isRead, setIsRead] = useState(notification.is_read)
  const [, startTransition] = useTransition()

  const isComment = notification.type === 'comment'
  const isReply = notification.type === 'reply'
  const isAnonymous = notification.payload?.is_anonymous === true

  const title = isComment
    ? 'New comment on your post'
    : isReply
      ? 'Someone replied to your comment'
      : 'Notification received'

  function handleClick() {
    if (isRead) return
    setIsRead(true)
    // Optimistic: don't block navigation on the write.
    startTransition(() => {
      void markNotificationRead(notification.id)
    })
  }

  const Icon = isReply ? CornerDownRight : isComment ? MessageSquare : Bell

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`card-interactive flex items-start gap-3 rounded-[var(--radius-lg)] border p-3.5 ${
        isRead
          ? 'border-border bg-surface'
          : 'border-[var(--color-brand-ring)] bg-surface'
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isRead ? 'bg-surface-raised text-muted' : 'bg-brand-subtle text-brand'
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm leading-snug ${isRead ? 'text-text-secondary' : 'font-semibold text-foreground'}`}>
            {title}
          </p>
          <time
            dateTime={notification.created_at}
            className="shrink-0 text-[11px] text-muted"
          >
            {formatRelative(notification.created_at)}
          </time>
        </div>

        <p className="mt-0.5 text-xs text-muted">
          {isAnonymous
            ? 'An anonymous member participated in the discussion.'
            : 'Open the discussion to catch up.'}
        </p>
      </div>

      {!isRead && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />
      )}
    </Link>
  )
}
