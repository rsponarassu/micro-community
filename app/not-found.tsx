import Link from 'next/link'
import { Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="text-7xl font-black mb-4 gradient-text-brand">404</div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
        Page not found
      </h1>
      <p className="text-sm mb-8 max-w-sm" style={{ color: 'var(--color-text-muted)' }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link href="/" className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: 'var(--color-brand)' }}>
          Go home
        </Link>
        <Link href="/discover" className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)' }}>
          <Search size={15} />
          Discover
        </Link>
      </div>
    </div>
  )
}
