'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Users, Lock } from 'lucide-react'
import { joinCommunity, leaveCommunity } from '@/app/actions/communities'
import { toast } from 'sonner'
import { sound } from '@/lib/sound'
import Badge from './ui/Badge'

export interface CommunityCardData {
  id: string
  name: string
  slug: string
  description: string | null
  category: string | null
  icon_url: string | null
  cover_url: string | null
  is_private: boolean
  memberCount: number
  isMember?: boolean
  membershipStatus?: 'active' | 'pending' | 'banned' | null
}

export default function CommunityCard({
  community,
}: {
  community: CommunityCardData
}) {
  const [isMember, setIsMember] = useState(community.isMember ?? false)
  const [status, setStatus] = useState(community.membershipStatus ?? null)
  const [memberCount, setMemberCount] = useState(community.memberCount)
  const [loading, setLoading] = useState(false)

  async function handleJoinToggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)

    try {
      if (isMember) {
        await leaveCommunity(community.id)
        setIsMember(false)
        setStatus(null)
        setMemberCount((c) => Math.max(0, c - 1))
        sound.playPop()
        toast.success(`Left ${community.name}`)
      } else {
        const res = await joinCommunity(community.id)
        if (res.status === 'pending') {
          setStatus('pending')
          sound.playNotification()
          toast.info('Join request submitted. Awaiting moderator approval.')
        } else {
          setIsMember(true)
          setStatus('active')
          setMemberCount((c) => c + 1)
          sound.playSuccess()
          toast.success(`Joined ${community.name}!`)
        }
      }
    } catch (err: unknown) {
      sound.playError()
      const msg = err instanceof Error ? err.message : 'Action failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Link
      href={`/c/${community.slug}`}
      onClick={() => sound.playClick()}
      className="card group hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden border border-border bg-surface hover:border-brand/60 rounded-2xl relative"
    >
      {/* Cover Banner */}
      <div className="h-24 w-full relative bg-surface-raised overflow-hidden">
        {community.cover_url ? (
          <Image
            src={community.cover_url}
            alt=""
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-linear-to-r from-brand/20 to-purple-500/20" />
        )}
      </div>

      <div className="p-4 pt-0 flex-1 flex flex-col relative">
        {/* Avatar positioned over banner */}
        <div className="flex justify-between items-end -mt-6 mb-3">
          <div className="w-12 h-12 rounded-xl border-2 border-surface bg-surface-raised overflow-hidden flex items-center justify-center font-bold text-lg shadow-xs text-foreground">
            {community.icon_url ? (
              <Image
                src={community.icon_url}
                alt=""
                width={48}
                height={48}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <span>{community.name[0].toUpperCase()}</span>
            )}
          </div>

          <button
            onClick={handleJoinToggle}
            disabled={loading || status === 'pending' || status === 'banned'}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 ${
              isMember
                ? 'bg-surface-raised hover:bg-red-500/10 hover:text-red-500 border border-border text-muted'
                : status === 'pending'
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                : 'bg-brand hover:bg-brand-hover text-white'
            }`}
          >
            {loading
              ? '...'
              : status === 'pending'
              ? 'Pending'
              : status === 'banned'
              ? 'Banned'
              : isMember
              ? 'Joined'
              : 'Join'}
          </button>
        </div>

        {/* Name & Private Indicator */}
        <div className="flex items-center gap-1.5 mb-1">
          <h3 className="font-semibold text-sm text-foreground group-hover:text-brand transition-colors truncate">
            {community.name}
          </h3>
          {community.is_private && (
            <Lock className="w-3.5 h-3.5 text-muted shrink-0" />
          )}
        </div>

        {/* Category */}
        {community.category && (
          <div className="mb-2">
            <Badge variant="default">{community.category}</Badge>
          </div>
        )}

        {/* Description */}
        {community.description && (
          <p className="text-xs text-muted line-clamp-2 mb-4">
            {community.description}
          </p>
        )}

        {/* Footer: Member Count */}
        <div className="mt-auto pt-3 border-t border-border flex items-center gap-1.5 text-xs text-muted">
          <Users className="w-3.5 h-3.5" />
          <span>
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>
      </div>
    </Link>
  )
}
