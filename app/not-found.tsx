import Link from 'next/link'
import { Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="gradient-text-brand mb-3 text-6xl font-black tracking-tight">404</div>
      <h1 className="text-xl font-bold text-foreground">Page not found</h1>
      <p className="mt-2 mb-7 max-w-sm text-sm text-muted">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-2.5">
        <Link href="/" className="btn btn-primary">
          Go home
        </Link>
        <Link href="/discover" className="btn btn-secondary">
          <Search size={15} />
          Discover
        </Link>
      </div>
    </div>
  )
}
