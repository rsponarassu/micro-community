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
    <article className="card card-interactive group relative flex flex-col overflow-hidden">
      {/* Overlay link: keeps the whole card clickable without nesting a
          <button> inside an <a> (invalid HTML, and unreachable by keyboard). */}
      <Link
        href={`/c/${community.slug}`}
        onClick={() => sound.playClick()}
        aria-label={`Open ${community.name}`}
        className="absolute inset-0 z-10 rounded-[var(--radius-lg)]"
      />

      {/* Cover Banner */}
      <div className="relative h-24 w-full overflow-hidden bg-surface-raised">
        {community.cover_url ? (
          <Image
            src={community.cover_url}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 320px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="h-full w-full bg-linear-to-r from-brand/25 via-accent/15 to-brand/10" />
        )}
      </div>

      <div className="relative flex flex-1 flex-col p-4 pt-0">
        {/* Avatar positioned over banner */}
        <div className="relative z-20 -mb-1 flex items-end justify-between">
          <div className="-mt-6 flex h-12 w-12 items-center justify-center overflow-hidden rounded-[var(--radius-md)] border-2 border-surface bg-surface-raised text-lg font-bold text-foreground shadow-xs">
            {community.icon_url ? (
              <Image
                src={community.icon_url}
                alt=""
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{community.name[0].toUpperCase()}</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleJoinToggle}
            disabled={loading || status === 'pending' || status === 'banned'}
            aria-label={
              isMember ? `Leave ${community.name}` : `Join ${community.name}`
            }
            className={`btn btn-sm relative z-20 ${
              isMember
                ? 'btn-secondary'
                : status === 'pending' || status === 'banned'
                  ? 'btn-secondary'
                  : 'btn-primary'
            }`}
            style={
              status === 'pending'
                ? {
                    background: 'var(--color-warning-subtle)',
                    color: 'var(--color-warning)',
                    borderColor: 'var(--color-warning)',
                  }
                : undefined
            }
          >
            {loading
              ? '…'
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
        <div className="mb-1 flex items-center gap-1.5 pt-3">
          <h3 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-brand">
            {community.name}
          </h3>
          {community.is_private && (
            <Lock className="h-3.5 w-3.5 shrink-0 text-muted" aria-label="Private community" />
          )}
        </div>

        {community.category && (
          <div className="mb-2">
            <Badge variant="default">{community.category}</Badge>
          </div>
        )}

        {community.description && (
          <p className="mb-4 line-clamp-2 text-xs text-muted">{community.description}</p>
        )}

        {/* Footer: Member Count */}
        <div className="mt-auto flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>
      </div>
    </article>
  )
}
