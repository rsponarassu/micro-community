'use client'

import { useState } from 'react'
import { markAllNotificationsRead } from '@/app/actions/notifications'
import { CheckCheck } from 'lucide-react'
import { toast } from 'sonner'

export default function MarkAllButton() {
  const [loading, setLoading] = useState(false)

  async function handleMarkAll() {
    setLoading(true)
    try {
      await markAllNotificationsRead()
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleMarkAll}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-raised hover:bg-surface text-xs font-medium text-foreground transition-colors disabled:opacity-50"
    >
      <CheckCheck className="w-3.5 h-3.5 text-muted" />
      <span>{loading ? 'Marking...' : 'Mark all read'}</span>
    </button>
  )
}
