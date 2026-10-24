'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, Hash, Compass, Home, Calendar } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'
import Avatar from '@/app/components/ui/Avatar'
import { signOut } from '@/app/actions/auth'

interface Community {
  id: string
  name: string
  slug: string
  icon_url: string | null
}

interface Profile {
  username: string
  display_name: string | null
  avatar_url: string | null
}

interface SidebarProps {
  user: User
  profile: Profile | null
  joinedCommunities: Community[]
  isOpen: boolean
  onClose: () => void
}

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/events', label: 'Events', icon: Calendar },
]

export default function Sidebar({
  user,
  profile,
  joinedCommunities,
  isOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col border-r transition-transform duration-300',
        'bg-[var(--color-surface)] border-[var(--color-border)]',
        'lg:relative lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
      style={{ width: 'var(--sidebar-width)' }}
      aria-label="Sidebar navigation"
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-4 border-b"
        style={{ borderColor: 'var(--color-border)', height: 'var(--topbar-height)' }}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg gradient-brand flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <span className="font-bold text-base tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          Micro Community
        </span>
        {/* Close on mobile */}
        <button
          onClick={onClose}
          className="ml-auto lg:hidden p-1 rounded-md"
          style={{ color: 'var(--color-text-muted)' }}
          aria-label="Close sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex flex-col gap-1 p-3" aria-label="Main navigation">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'gradient-brand text-white shadow-sm'
                  : 'hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-secondary)]'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={17} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Communities */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-text-muted)' }}>
            Communities
          </span>
          <Link
            href="/c/new"
            onClick={onClose}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors"
            style={{ color: 'var(--color-brand)' }}
            aria-label="Create new community"
            title="Create community"
          >
            <Plus size={14} />
            New
          </Link>
        </div>

        <div className="flex flex-col gap-0.5">
          {joinedCommunities.length === 0 && (
            <p className="text-xs px-2 py-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
              Join communities to see them here
            </p>
          )}
          {joinedCommunities.map((c) => {
            const active = pathname.startsWith(`/c/${c.slug}`)
            return (
              <Link
                key={c.id}
                href={`/c/${c.slug}`}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all',
                  active
                    ? 'bg-[var(--color-brand-subtle)] font-semibold'
                    : 'hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-secondary)]'
                )}
                style={active ? { color: 'var(--color-brand)' } : undefined}
                aria-current={active ? 'page' : undefined}
              >
                {c.icon_url ? (
                  <Image
                    src={c.icon_url}
                    alt=""
                    width={20}
                    height={20}
                    className="w-5 h-5 rounded-md object-cover flex-shrink-0"
                    unoptimized
                  />
                ) : (
                  <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-surface-overlay)' }}>
                    <Hash size={11} style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                )}
                <span className="truncate">{c.name}</span>
              </Link>
            )
          })}
        </div>

        <Link
          href="/discover"
          onClick={onClose}
          className="flex items-center gap-2.5 px-2.5 py-2 mt-2 rounded-lg text-sm transition-all"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Compass size={15} />
          <span>Discover more</span>
        </Link>
      </div>

      {/* User profile footer */}
      <div className="border-t p-3" style={{ borderColor: 'var(--color-border)' }}>
        <Link
          href={profile ? `/u/${profile.username}` : '/settings'}
          onClick={onClose}
          className="flex items-center gap-3 px-2 py-2 rounded-lg transition-colors hover:bg-[var(--color-surface-overlay)]"
        >
          <Avatar
            src={profile?.avatar_url}
            name={profile?.display_name ?? user.email ?? '?'}
            size={32}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
              {profile?.display_name ?? 'Set up profile'}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
              {profile?.username ? `@${profile.username}` : user.email}
            </p>
          </div>
        </Link>
        <form action={signOut} className="mt-1">
          <button
            type="submit"
            className="w-full text-left text-xs px-2 py-1.5 rounded-md transition-colors hover:bg-[var(--color-surface-overlay)]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
