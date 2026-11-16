import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Compass, Shield } from 'lucide-react'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Micro Community account.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  return (
    <div className="card p-7 sm:p-8 animate-slide-up rounded-3xl border border-border/80 bg-surface/90 backdrop-blur-md shadow-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Welcome back
        </h2>
        <p className="text-xs text-muted mt-1">
          Sign in to access your joined communities, post anonymously, or schedule events.
        </p>
      </div>

      <LoginForm nextPath={next} />

      <div className="pt-2 border-t border-border/60">
        <div className="rounded-xl border border-dashed border-border bg-surface-raised/50 p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Compass size={14} />
            </span>
            <div>
              <p className="text-xs font-semibold text-foreground">Just want to look around?</p>
              <p className="text-[11px] text-muted">Browse discussions without an account</p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline shrink-0"
          >
            Explore &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
