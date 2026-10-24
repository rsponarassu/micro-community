'use client'

import Link from 'next/link'
import { Menu, Search, Bell } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import ThemeToggle from './ThemeToggle'
import SoundToggle from './SoundToggle'
import Avatar from '@/app/components/ui/Avatar'
import { cn } from '@/lib/utils'

interface Profile {
  username: string
  display_name: string | null
  avatar_url: string | null
}

interface TopbarProps {
  user: User
  profile: Profile | null
  unreadCount: number
  onMenuOpen: () => void
}

export default function Topbar({ user, profile, unreadCount, onMenuOpen }: TopbarProps) {
  return (
    <header
      className="fixed top-0 right-0 left-0 lg:left-[var(--sidebar-width)] z-10 flex items-center gap-3 px-4 border-b"
      style={{
        height: 'var(--topbar-height)',
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Hamburger (mobile only) */}
      <button
        onClick={onMenuOpen}
        className="lg:hidden p-2 rounded-lg transition-colors hover:bg-[var(--color-surface-overlay)]"
        style={{ color: 'var(--color-text-secondary)' }}
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <Link
        href="/search"
        className="flex items-center gap-2 flex-1 max-w-sm px-3 py-1.5 rounded-lg text-sm transition-colors"
        style={{
          background: 'var(--color-surface-raised)',
          color: 'var(--color-text-muted)',
          border: '1px solid var(--color-border)',
        }}
        aria-label="Search"
      >
        <Search size={15} />
        <span>Search communities, posts&hellip;</span>
        <kbd className="ml-auto hidden sm:inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium"
          style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-muted)' }}>
          ⌘K
        </kbd>
      </Link>

      <div className="flex items-center gap-2 ml-auto">
        <SoundToggle />
        <ThemeToggle />

        {/* Notifications */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-lg transition-colors hover:bg-[var(--color-surface-overlay)]"
          style={{ color: 'var(--color-text-secondary)' }}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute top-1 right-1 flex items-center justify-center rounded-full text-white font-bold',
                unreadCount > 9 ? 'w-5 h-5 text-[10px]' : 'w-4 h-4 text-[9px]'
              )}
              style={{ background: 'var(--color-brand)', fontSize: '9px' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Avatar */}
        <Link
          href={profile ? `/u/${profile.username}` : '/settings'}
          aria-label="Profile"
        >
          <Avatar
            src={profile?.avatar_url}
            name={profile?.display_name ?? user.email ?? '?'}
            size={32}
          />
        </Link>
      </div>
    </header>
  )
}
