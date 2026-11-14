'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surface the real cause in the console; the UI stays human-readable.
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: 'var(--color-danger-subtle)' }}
      >
        <AlertTriangle size={26} style={{ color: 'var(--color-danger)' }} aria-hidden="true" />
      </div>

      <h2 className="text-lg font-bold text-foreground">Something went wrong</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      {error.digest && <p className="hint mt-1 font-mono">ref {error.digest}</p>}

      <button type="button" onClick={reset} className="btn btn-primary mt-6">
        Try again
      </button>
    </div>
  )
}
