'use client'

import { useState } from 'react'
import { approveJoin, rejectJoin } from '@/app/actions/communities'
import { toast } from 'sonner'
import Avatar from '@/app/components/ui/Avatar'
import { Check, X } from 'lucide-react'

interface PendingMember {
  userId: string
  displayName: string | null
  username: string
  avatarUrl: string | null
  joinedAt: string
}

interface AdminJoinRequestsProps {
  communityId: string
  pendingMembers: PendingMember[]
}

export default function AdminJoinRequests({
  communityId,
  pendingMembers: initialPending,
}: AdminJoinRequestsProps) {
  const [pending, setPending] = useState<PendingMember[]>(initialPending)
  const [processingId, setProcessingId] = useState<string | null>(null)

  async function handleApprove(userId: string) {
    setProcessingId(userId)
    try {
      await approveJoin(userId, communityId)
      setPending((prev) => prev.filter((m) => m.userId !== userId))
      toast.success('Approved join request!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Approval failed')
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject(userId: string) {
    setProcessingId(userId)
    try {
      await rejectJoin(userId, communityId)
      setPending((prev) => prev.filter((m) => m.userId !== userId))
      toast.info('Rejected join request.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Rejection failed')
    } finally {
      setProcessingId(null)
    }
  }

  if (pending.length === 0) {
    return (
      <div className="card p-6 border border-border bg-surface text-center text-sm text-muted">
        No pending join requests right now.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {pending.map((m) => (
        <div
          key={m.userId}
          className="card p-4 border border-border bg-surface flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <Avatar
              src={m.avatarUrl}
              name={m.displayName || m.username}
              size={40}
            />
            <div>
              <div className="font-semibold text-sm text-foreground">
                {m.displayName || m.username}
              </div>
              <div className="text-xs text-muted">@{m.username}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleApprove(m.userId)}
              disabled={processingId === m.userId}
              className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
              title="Approve Member"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleReject(m.userId)}
              disabled={processingId === m.userId}
              className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              title="Reject Request"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
