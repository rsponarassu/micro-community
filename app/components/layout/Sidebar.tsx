'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Plus,
  Hash,
  Compass,
  Home,
  CalendarDays,
  Bell,
  X,
  Settings,
  LogOut,
} from 'lucide-react'
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
  { href: '/', label: 'Home', icon: Home, exact: true },
  { href: '/discover', label: 'Discover', icon: Compass, exact: false },
  { href: '/events', label: 'Events', icon: CalendarDays, exact: false },
  { href: '/notifications', label: 'Notifications', icon: Bell, exact: false },
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
        'fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-surface border-border',
        'lg:sticky lg:top-0 lg:z-20 lg:h-dvh lg:translate-x-0',
        'transition-transform duration-200 ease-out',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
      style={{ width: 'var(--sidebar-width)' }}
      aria-label="Primary"
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 shrink-0" style={{ height: 'var(--topbar-height)' }}>
        <Link href="/" onClick={onClose} className="flex items-center gap-2.5 min-w-0">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg gradient-brand flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <span className="font-semibold text-[15px] tracking-tight text-foreground truncate">
            Micro Community
          </span>
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-ghost ml-auto !p-1.5 lg:hidden"
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0">
        {/* Primary nav */}
        <nav className="flex flex-col gap-0.5" aria-label="Main">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors',
                  active
                    ? 'bg-brand-subtle text-brand font-semibold'
                    : 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={17} strokeWidth={2} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-5 mb-1.5 flex items-center justify-between px-2.5">
          <span className="eyebrow">Your communities</span>
          <Link
            href="/c/new"
            onClick={onClose}
            className="flex items-center gap-0.5 text-[11px] font-semibold text-brand px-1.5 py-1 rounded-md hover:bg-brand-subtle transition-colors"
            aria-label="Create a community"
          >
            <Plus size={13} />
            New
          </Link>
        </div>

        <div className="flex flex-col gap-0.5">
          {joinedCommunities.length === 0 && (
            <p className="px-2.5 py-3 text-xs text-muted leading-relaxed">
              You haven&apos;t joined a community yet.{' '}
              <Link href="/discover" onClick={onClose} className="text-brand hover:underline">
                Browse communities
              </Link>
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
                  'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors',
                  active
                    ? 'bg-surface-overlay text-foreground font-semibold'
                    : 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary'
                )}
                aria-current={active ? 'page' : undefined}
              >
                {c.icon_url ? (
                  <Image
                    src={c.icon_url}
                    alt=""
                    width={20}
                    height={20}
                    className="w-5 h-5 rounded-[6px] object-cover flex-shrink-0"
                    unoptimized
                  />
                ) : (
                  <span className="w-5 h-5 rounded-[6px] flex items-center justify-center flex-shrink-0 bg-surface-overlay">
                    <Hash size={11} className="text-muted" />
                  </span>
                )}
                <span className="truncate">{c.name}</span>
              </Link>
            )
          })}

          <Link
            href="/discover"
            onClick={onClose}
            className="flex items-center gap-2.5 px-2.5 py-1.5 mt-1 rounded-md text-sm text-muted hover:bg-surface-overlay hover:text-text-primary transition-colors"
          >
            <Compass size={15} />
            <span>Discover more</span>
          </Link>
        </div>
      </div>

      {/* Account */}
      <div className="border-t border-border p-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <Link
            href={profile ? `/u/${profile.username}` : '/settings'}
            onClick={onClose}
            className="flex items-center gap-2.5 px-1.5 py-1.5 rounded-md hover:bg-surface-overlay transition-colors min-w-0 flex-1"
          >
            <Avatar
              src={profile?.avatar_url}
              name={profile?.display_name ?? user.email ?? '?'}
              size={30}
            />
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-foreground truncate">
                {profile?.display_name ?? 'Set up profile'}
              </span>
              <span className="block text-[11px] text-muted truncate">
                {profile?.username ? `@${profile.username}` : user.email}
              </span>
            </span>
          </Link>

          <Link
            href="/settings"
            onClick={onClose}
            className="btn btn-ghost !p-1.5"
            aria-label="Account settings"
            title="Account settings"
          >
            <Settings size={16} />
          </Link>

          <form action={signOut}>
            <button
              type="submit"
              className="btn btn-ghost !p-1.5"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
