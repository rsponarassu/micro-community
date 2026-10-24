'use client'

import { useState } from 'react'
import {
  updateMemberRole,
  removeMember,
  banMember,
} from '@/app/actions/communities'
import { toast } from 'sonner'
import { MoreVertical } from 'lucide-react'

interface MemberActionsProps {
  communityId: string
  targetUserId: string
  currentRole: 'owner' | 'moderator' | 'member'
  callerRole: 'owner' | 'moderator'
}

export default function MemberActions({
  communityId,
  targetUserId,
  currentRole,
  callerRole,
}: MemberActionsProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  if (currentRole === 'owner') return null
  if (callerRole === 'moderator' && currentRole === 'moderator') return null

  async function handleRoleChange(newRole: 'moderator' | 'member') {
    setLoading(true)
    try {
      await updateMemberRole(targetUserId, communityId, newRole)
      toast.success(`Role updated to ${newRole}`)
      setOpen(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove() {
    setLoading(true)
    try {
      await removeMember(targetUserId, communityId)
      toast.success('Member removed')
      setOpen(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member')
    } finally {
      setLoading(false)
    }
  }

  async function handleBan() {
    setLoading(true)
    try {
      await banMember(targetUserId, communityId)
      toast.success('Member banned')
      setOpen(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to ban member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-surface-raised text-muted hover:text-foreground transition-colors"
        aria-label="Manage member"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-44 rounded-xl bg-surface border border-border shadow-lg p-1.5 z-20 text-xs">
            {callerRole === 'owner' && currentRole === 'member' && (
              <button
                onClick={() => handleRoleChange('moderator')}
                disabled={loading}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-raised text-foreground font-medium transition-colors"
              >
                Promote to Moderator
              </button>
            )}

            {callerRole === 'owner' && currentRole === 'moderator' && (
              <button
                onClick={() => handleRoleChange('member')}
                disabled={loading}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-raised text-foreground font-medium transition-colors"
              >
                Demote to Member
              </button>
            )}

            <button
              onClick={handleRemove}
              disabled={loading}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-raised text-red-500 font-medium transition-colors"
            >
              Remove from Group
            </button>

            <button
              onClick={handleBan}
              disabled={loading}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-500 font-medium transition-colors"
            >
              Ban Member
            </button>
          </div>
        </>
      )}
    </div>
  )
}
