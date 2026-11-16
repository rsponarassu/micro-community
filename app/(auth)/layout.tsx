import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import ThemeToggle from '@/app/components/layout/ThemeToggle'
import SoundToggle from '@/app/components/layout/SoundToggle'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh relative flex flex-col items-center justify-center p-4 bg-bg overflow-hidden">
      {/* Aesthetic glowing ambient backdrop */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-brand/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-accent/15 blur-3xl pointer-events-none" />

      {/* Top action bar: Back to Home + Controls */}
      <div className="w-full max-w-md flex items-center justify-between mb-6 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-surface-raised"
        >
          <ArrowLeft size={14} />
          <span>Explore Platform</span>
        </Link>

        <div className="flex items-center gap-2">
          <SoundToggle />
          <ThemeToggle />
        </div>
      </div>

      <div className="w-full max-w-md z-10 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block group">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-brand shadow-xl shadow-brand/25 mb-3 group-hover:scale-105 transition-transform">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Micro Community
            </h1>
          </Link>
          <p className="text-xs text-muted mt-1 flex items-center justify-center gap-1.5 font-medium">
            <Sparkles size={12} className="text-brand" />
            Anonymity-First Circles • Synthesized Audio • AI Spotlight
          </p>
        </div>

        {children}
      </div>

      <p className="mt-8 text-xs text-muted z-10">
        © {new Date().getFullYear()} Micro Community Platform • Built with Next.js 16 & Turbopack
      </p>
    </div>
  )
}
