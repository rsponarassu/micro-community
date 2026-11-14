'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings } from 'lucide-react'

const TABS = [
  { label: 'Feed', segment: '' },
  { label: 'Events', segment: 'events' },
  { label: 'Members', segment: 'members' },
  { label: 'About', segment: 'about' },
] as const

export default function CommunityTabs({
  slug,
  canAdmin,
}: {
  slug: string
  canAdmin: boolean
}) {
  const pathname = usePathname()
  const base = `/c/${slug}`

  function isActive(segment: string) {
    if (!segment) {
      // Feed owns the root route and the single-post route beneath it.
      return pathname === base || pathname.startsWith(`${base}/post/`)
    }
    return pathname === `${base}/${segment}` || pathname.startsWith(`${base}/${segment}/`)
  }

  return (
    <div className="no-scrollbar flex items-center gap-1 overflow-x-auto border-t border-border pt-2">
      {TABS.map((tab) => {
        const active = isActive(tab.segment)
        return (
          <Link
            key={tab.label}
            href={tab.segment ? `${base}/${tab.segment}` : base}
            aria-current={active ? 'page' : undefined}
            className={`tab ${active ? 'tab-active' : ''}`}
          >
            {tab.label}
          </Link>
        )
      })}

      {canAdmin && (
        <Link
          href={`${base}/admin`}
          aria-current={pathname.startsWith(`${base}/admin`) ? 'page' : undefined}
          className={`tab ml-auto text-brand ${
            pathname.startsWith(`${base}/admin`) ? 'tab-active' : ''
          }`}
        >
          <Settings className="h-3.5 w-3.5" />
          Admin
        </Link>
      )}
    </div>
  )
}
