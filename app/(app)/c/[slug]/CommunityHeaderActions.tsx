'use client'

import { useState } from 'react'
import { joinCommunity, leaveCommunity } from '@/app/actions/communities'
import { toast } from 'sonner'

interface CommunityHeaderActionsProps {
  communityId: string
  communityName: string
  isMember: boolean
  membershipStatus: 'active' | 'pending' | 'banned' | null
}

export default function CommunityHeaderActions({
  communityId,
  communityName,
  isMember: initialIsMember,
  membershipStatus: initialStatus,
}: CommunityHeaderActionsProps) {
  const [isMember, setIsMember] = useState(initialIsMember)
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    try {
      if (isMember) {
        await leaveCommunity(communityId)
        setIsMember(false)
        setStatus(null)
        toast.success(`Left ${communityName}`)
      } else {
        const res = await joinCommunity(communityId)
        if (res.status === 'pending') {
          setStatus('pending')
          toast.info('Join request submitted. Awaiting approval.')
        } else {
          setIsMember(true)
          setStatus('active')
          toast.success(`Welcome to ${communityName}!`)
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'banned') {
    return (
      <span className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
        Banned from community
      </span>
    )
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading || status === 'pending'}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 shadow-xs ${
        isMember
          ? 'bg-surface-raised hover:bg-red-500/10 hover:text-red-500 border border-border text-foreground'
          : status === 'pending'
          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
          : 'bg-brand hover:bg-brand-hover text-white'
      }`}
    >
      {loading
        ? '...'
        : status === 'pending'
        ? 'Request Pending'
        : isMember
        ? 'Joined'
        : 'Join Community'}
    </button>
  )
}
