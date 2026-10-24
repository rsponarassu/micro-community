'use client'

import { useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { sound } from '@/lib/sound'
import { toast } from 'sonner'

export default function SoundToggle() {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return sound.isEnabled()
    }
    return true
  })

  function handleToggle() {
    const newState = sound.toggle()
    setEnabled(newState)
    if (newState) {
      toast.success('Sound effects enabled 🔊')
    } else {
      toast.info('Sound effects muted 🔇')
    }
  }

  return (
    <button
      onClick={handleToggle}
      className={`p-2 rounded-xl transition-all border ${
        enabled
          ? 'bg-brand/10 border-brand/30 text-brand hover:bg-brand/20'
          : 'bg-surface-raised border-border text-muted hover:text-foreground'
      }`}
      title={enabled ? 'Sound Effects Enabled (Click to Mute)' : 'Sound Effects Muted (Click to Enable)'}
      aria-label="Toggle Sound Effects"
    >
      {enabled ? (
        <div className="flex items-center gap-1">
          <Volume2 className="w-4 h-4 animate-pulse" />
        </div>
      ) : (
        <VolumeX className="w-4 h-4" />
      )}
    </button>
  )
}
