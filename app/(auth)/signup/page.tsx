import type { Metadata } from 'next'
import Link from 'next/link'
import { Compass } from 'lucide-react'
import SignupForm from './SignupForm'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create a new Micro Community account.',
}

export default function SignupPage() {
  return (
    <div className="card p-7 sm:p-8 animate-slide-up rounded-3xl border border-border/80 bg-surface/90 backdrop-blur-md shadow-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Join the community
        </h2>
        <p className="text-xs text-muted mt-1">
          Create an account to join private circles, post anonymously, and RSVP to events.
        </p>
      </div>

      <SignupForm />

      <div className="pt-2 border-t border-border/60">
        <div className="rounded-xl border border-dashed border-border bg-surface-raised/50 p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Compass size={14} />
            </span>
            <div>
              <p className="text-xs font-semibold text-foreground">Want to browse first?</p>
              <p className="text-[11px] text-muted">Preview live discussions as a guest</p>
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
