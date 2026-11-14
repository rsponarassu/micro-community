'use client'

import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'

type Theme = 'light' | 'dark'

/**
 * Sonner can't read our `data-theme` attribute, so we mirror it into the
 * toaster. Keeps toasts readable in both themes without a second source of truth.
 */
export default function ToastProvider() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const root = document.documentElement
    const read = () => setTheme(root.dataset.theme === 'dark' ? 'dark' : 'light')

    read()
    const observer = new MutationObserver(read)
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  return (
    <Toaster
      position="top-center"
      closeButton
      theme={theme}
      offset={16}
      toastOptions={{
        duration: 4000,
        className: 'top-notification-pill',
      }}
    />
  )
}
