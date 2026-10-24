'use client'

import { useState, useEffect } from 'react'
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
  user: User
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

  // Apply saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('theme') ?? 'light'
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  return (
    <div className="app-shell">
      {/* Desktop Sidebar */}
      <Sidebar
        user={user}
        profile={profile}
        joinedCommunities={joinedCommunities}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="main-content flex flex-col w-full">
        <Topbar
          user={user}
          profile={profile}
          unreadCount={unreadCount}
          onMenuOpen={() => setSidebarOpen(true)}
        />
        <main className="flex-1 px-4 py-6 lg:px-8 max-w-5xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav unreadCount={unreadCount} />
    </div>
  )
}
