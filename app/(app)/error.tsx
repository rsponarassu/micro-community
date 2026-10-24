'use client'

import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
        style={{ background: 'hsl(0 84% 95%)' }}>
        <AlertTriangle size={28} style={{ color: 'var(--color-error)' }} />
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
        Something went wrong
      </h2>
      <p className="text-sm mb-6 max-w-sm" style={{ color: 'var(--color-text-muted)' }}>
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg text-sm font-medium text-white"
        style={{ background: 'var(--color-brand)' }}
      >
        Try again
      </button>
    </div>
  )
}
