'use client'

import React, { useState } from 'react'
import { sound } from '@/lib/sound'
import { Sparkles, RefreshCw, Zap } from 'lucide-react'

// 1. Concentric Glowing Cyber Pulse Rings
export function PulseRingLoader({ size = 48, label }: { size?: number; label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-4">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="absolute inset-0 rounded-full border-2 border-brand/20 animate-ping opacity-75" />
        <div className="absolute inset-1 rounded-full border-2 border-t-brand border-r-transparent border-b-accent border-l-transparent animate-spin" />
        <div className="absolute inset-2.5 rounded-full border border-brand/40 animate-pulse" />
        <div className="w-2.5 h-2.5 rounded-full bg-brand shadow-[0_0_12px_var(--color-brand)]" />
      </div>
      {label && <span className="text-xs font-medium text-muted tracking-wide animate-pulse">{label}</span>}
    </div>
  )
}

// 2. Liquid Morphing Wave Dots Loader
export function MorphingDotsLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 p-3">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-brand to-accent shadow-sm"
            style={{
              animation: 'bounce 1s infinite ease-in-out',
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </div>
      {label && <span className="text-xs text-muted font-medium">{label}</span>}
    </div>
  )
}

// 3. Orbiting Planetary Satellites Loader
export function OrbitLoader({ size = 52, label }: { size?: number; label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-4">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Core sphere */}
        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-brand via-purple-500 to-accent shadow-[0_0_16px_rgba(139,92,246,0.6)] animate-pulse" />
        {/* Orbit track 1 */}
        <div
          className="absolute inset-0 rounded-full border border-brand/30 animate-spin"
          style={{ animationDuration: '2.5s' }}
        >
          <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)] -top-1 left-1/2 -translate-x-1/2 absolute" />
        </div>
        {/* Orbit track 2 (counter-rotating) */}
        <div
          className="absolute inset-2 rounded-full border border-accent/25 animate-spin"
          style={{ animationDuration: '1.8s', animationDirection: 'reverse' }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-brand shadow-[0_0_8px_var(--color-brand)] -bottom-0.5 right-1 absolute" />
        </div>
      </div>
      {label && <span className="text-xs font-medium text-muted tracking-wide">{label}</span>}
    </div>
  )
}

// 4. Futuristic Laser Quantum Beam Loader
export function QuantumBeamLoader({ label }: { label?: string }) {
  return (
    <div className="w-full max-w-sm mx-auto flex flex-col gap-2 p-3">
      <div className="h-1.5 w-full bg-surface-raised rounded-full overflow-hidden relative border border-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-transparent via-brand to-accent shadow-[0_0_12px_var(--color-brand)]"
          style={{
            animation: 'quantumBeam 1.6s infinite cubic-bezier(0.65, 0, 0.35, 1)',
          }}
        />
      </div>
      {label && <span className="text-xs text-muted text-center font-mono">{label}</span>}
    </div>
  )
}

// 5. Equalizer / Acoustic Helix Wave Loader
export function HelixEqualizerLoader({ label }: { label?: string }) {
  const bars = [16, 24, 32, 22, 14]
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 p-3">
      <div className="flex items-end gap-1 h-8">
        {bars.map((h, i) => (
          <span
            key={i}
            className="w-1.5 rounded-full bg-gradient-to-t from-brand to-accent shadow-[0_0_6px_var(--color-brand)]"
            style={{
              height: `${h}px`,
              animation: 'helixWave 0.9s infinite ease-in-out alternate',
              animationDelay: `${i * 0.14}s`,
            }}
          />
        ))}
      </div>
      {label && <span className="text-xs text-muted font-medium">{label}</span>}
    </div>
  )
}

// 6. Interactive Loader Showcase Widget with Sound FX
export function LoaderShowcase() {
  const [activeTab, setActiveTab] = useState<'pulse' | 'dots' | 'orbit' | 'beam' | 'equalizer'>('orbit')

  const loaders = [
    { id: 'orbit' as const, name: 'Orbital Satellites', component: <OrbitLoader label="Syncing realtime state..." /> },
    { id: 'pulse' as const, name: 'Cyber Pulse', component: <PulseRingLoader label="Connecting quantum node..." /> },
    { id: 'dots' as const, name: 'Liquid Dots', component: <MorphingDotsLoader label="Fetching discussions..." /> },
    { id: 'beam' as const, name: 'Quantum Beam', component: <QuantumBeamLoader label="STREAMING_DATA // 94%" /> },
    { id: 'equalizer' as const, name: 'Audio Helix', component: <HelixEqualizerLoader label="Synthesizing audio..." /> },
  ]

  const activeLoader = loaders.find((l) => l.id === activeTab)

  return (
    <div className="rounded-2xl border border-brand/20 bg-surface/60 backdrop-blur-md p-5 shadow-xl transition-all hover:border-brand/40">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Zap size={14} className="animate-pulse" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-foreground">Interactive Loader Engine</h3>
            <p className="text-[11px] text-muted">Test real-time animations & micro-interactions</p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-subtle text-brand border border-brand/20">
          6 LOADERS ACTIVE
        </span>
      </div>

      {/* Loader Switcher Tabs */}
      <div className="flex flex-wrap gap-1.5 mb-5 p-1 rounded-xl bg-surface-raised border border-border">
        {loaders.map((l) => (
          <button
            key={l.id}
            onClick={() => {
              sound.playPop()
              setActiveTab(l.id)
            }}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              activeTab === l.id
                ? 'bg-brand text-white shadow-md shadow-brand/30 scale-[1.02]'
                : 'text-muted hover:text-foreground hover:bg-surface'
            }`}
          >
            {l.name}
          </button>
        ))}
      </div>

      {/* Active Loader Display */}
      <div className="min-h-[110px] flex items-center justify-center rounded-xl border border-dashed border-border/80 bg-surface/40 p-4">
        {activeLoader?.component}
      </div>
    </div>
  )
}

