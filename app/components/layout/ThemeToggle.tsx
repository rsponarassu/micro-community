'use client'

import { useCallback, useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
  // Lazy initializer reads from localStorage on client; falls back to 'light' during SSR
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    return (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light'
  })

  // Keep DOM in sync with state — only DOM update here, never setState
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggle = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light'
    localStorage.setItem('theme', next)
    setTheme(next)
  }, [theme])

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg transition-all hover:bg-[var(--color-surface-overlay)]"
      style={{ color: 'var(--color-text-secondary)' }}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  )
}
