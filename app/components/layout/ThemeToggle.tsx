'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark'

/**
 * The document element is the single source of truth: the inline head script
 * sets `data-theme` before paint, and we subscribe to it here. This avoids both
 * a hydration mismatch and a state-syncing effect.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
  return () => observer.disconnect()
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

// The server cannot know the stored preference; hydration starts from the
// default and React re-reads the DOM immediately after mounting.
function getServerSnapshot(): Theme {
  return 'light'
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggle = useCallback(() => {
    const root = document.documentElement
    const next: Theme = root.dataset.theme === 'dark' ? 'light' : 'dark'

    root.setAttribute('data-theme', next)
    root.style.colorScheme = next
    try {
      localStorage.setItem('theme', next)
    } catch {
      // Private mode — the switch still applies for this session.
    }
  }, [])

  const label = `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn btn-ghost !rounded-lg !p-2"
      aria-label={label}
      title={label}
    >
      <span className="flex h-[18px] w-[18px] items-center justify-center" aria-hidden="true">
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </span>
    </button>
  )
}
