'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import MobileNav from './MobileNav'

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

interface AppShellProps {
  user: User | null
  profile: Profile | null
  joinedCommunities: Community[]
  unreadCount: number
  children: React.ReactNode
}

export default function AppShell({
  user,
  profile,
  joinedCommunities,
  unreadCount,
  children,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  // Close the drawer when the route changes. Done during render (guarded by a
  // comparison) instead of in an effect, which would cost an extra paint.
  const [openedAtPath, setOpenedAtPath] = useState(pathname)
  if (pathname !== openedAtPath) {
    setOpenedAtPath(pathname)
    setSidebarOpen(false)
  }

  // Escape closes the drawer.
  useEffect(() => {
    if (!sidebarOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [sidebarOpen])

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <Sidebar
        user={user}
        profile={profile}
        joinedCommunities={joinedCommunities}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden animate-fade-in"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <div className="main-content flex flex-col w-full min-w-0">
        <Topbar
          user={user}
          profile={profile}
          unreadCount={unreadCount}
          onMenuOpen={() => setSidebarOpen(true)}
        />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
      </div>

      <MobileNav unreadCount={unreadCount} username={profile?.username} />
    </div>
  )
}
