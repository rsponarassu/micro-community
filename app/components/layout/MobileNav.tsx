'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, CalendarDays, Bell, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  unreadCount: number
}

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/notifications', label: 'Alerts', icon: Bell },
]

export default function MobileNav({ unreadCount }: MobileNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 flex items-center border-t lg:hidden"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      aria-label="Mobile navigation"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href))
        const isNotif = href === '/notifications'
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors',
              active
                ? 'text-[var(--color-brand)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            )}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
          >
            <div className="relative">
              <Icon size={20} />
              {isNotif && unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full text-white font-bold text-[8px]"
                  style={{ background: 'var(--color-brand)' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
