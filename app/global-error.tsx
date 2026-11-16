'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Global App Error Boundary Caught]:', error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0e0e11] text-[#f4f4f6] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-[#18181f] border border-white/10 rounded-2xl p-6 sm:p-8 text-center shadow-2xl space-y-5">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertCircle size={28} />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-white">Application Error</h1>
            <p className="text-sm text-gray-400">
              The platform encountered a temporary issue. Automatic recovery is ready.
            </p>
            {error.digest && (
              <p className="text-[11px] font-mono text-gray-500 bg-black/40 px-2 py-1 rounded inline-block">
                Digest: {error.digest}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-all shadow-lg shadow-purple-600/30"
            >
              <RefreshCw size={15} />
              Try Again
            </button>
            <a
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium text-sm transition-all border border-white/10"
            >
              <Home size={15} />
              Return Home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
