'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
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
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  // ⌘K / Ctrl+K focuses search from anywhere in the app shell.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const term = query.trim()
    router.push(term ? `/search?q=${encodeURIComponent(term)}` : '/search')
  }

  return (
    <header
      className="fixed top-0 right-0 left-0 lg:left-[var(--sidebar-width)] z-30 flex items-center gap-2 px-3 md:px-5 glass-panel"
      style={{ height: 'var(--topbar-height)' }}
    >
      <button
        type="button"
        onClick={onMenuOpen}
        className="btn btn-ghost !p-2 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      <form onSubmit={handleSubmit} className="flex-1 max-w-md" role="search">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search communities, posts, people…"
            aria-label="Search"
            className="w-full h-9 pl-9 pr-14 rounded-lg bg-surface-raised border border-border text-sm text-foreground placeholder:text-muted focus:bg-surface focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/20 [&::-webkit-search-cancel-button]:hidden"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted pointer-events-none">
            ⌘K
          </kbd>
        </div>
      </form>

      <div className="flex items-center gap-1 ml-auto">
        <div className="hidden sm:block">
          <SoundToggle />
        </div>
        <ThemeToggle />

        <Link
          href="/notifications"
          className="relative btn btn-ghost !p-2"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : 'Notifications'
          }
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute top-0.5 right-0.5 flex items-center justify-center rounded-full bg-danger text-white font-bold ring-2 ring-surface',
                unreadCount > 9 ? 'h-4 min-w-4 px-1 text-[9px]' : 'h-4 w-4 text-[9px]'
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        <Link
          href={profile ? `/u/${profile.username}` : '/settings'}
          aria-label="Your profile"
          className="ml-0.5 rounded-full ring-offset-2 ring-offset-surface focus-visible:ring-2 focus-visible:ring-brand"
        >
          <Avatar
            src={profile?.avatar_url}
            name={profile?.display_name ?? user.email ?? '?'}
            size={30}
          />
        </Link>
      </div>
    </header>
  )
}
