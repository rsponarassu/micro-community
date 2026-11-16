'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, CalendarDays, Bell, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  unreadCount: number
  username?: string | null
}

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home, exact: true },
  { href: '/discover', label: 'Discover', icon: Compass, exact: false },
  { href: '/events', label: 'Events', icon: CalendarDays, exact: false },
  { href: '/notifications', label: 'Alerts', icon: Bell, exact: false },
]

export default function MobileNav({ unreadCount, username }: MobileNavProps) {
  const pathname = usePathname()

  const items = [
    ...NAV_ITEMS,
    {
      href: username ? `/u/${username}` : '/login',
      label: username ? 'Profile' : 'Sign In',
      icon: User,
      exact: false,
    },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 flex items-stretch border-t border-border bg-surface lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Bottom navigation"
    >
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        const isNotif = href === '/notifications'

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 h-16 text-[10px] font-medium transition-colors',
              active ? 'text-brand' : 'text-muted active:text-text-secondary'
            )}
            aria-current={active ? 'page' : undefined}
          >
            <span className="relative">
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              {isNotif && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-danger text-white text-[9px] font-bold ring-2 ring-surface">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
