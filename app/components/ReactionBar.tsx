'use client'

import { useState } from 'react'
import { SmilePlus } from 'lucide-react'
import { toggleReaction } from '@/app/actions/posts'
import { toast } from 'sonner'
import { sound } from '@/lib/sound'

export type ReactionType = 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry'

const EMOJI_MAP: Record<ReactionType, { emoji: string; label: string }> = {
  like: { emoji: '👍', label: 'Like' },
  love: { emoji: '❤️', label: 'Love' },
  laugh: { emoji: '😂', label: 'Haha' },
  wow: { emoji: '😮', label: 'Wow' },
  sad: { emoji: '😢', label: 'Sad' },
  angry: { emoji: '😡', label: 'Angry' },
}

interface ReactionBarProps {
  postId: string
  initialReactions: { type: ReactionType; count: number; reacted: boolean }[]
  isAuthenticated: boolean
}

export default function ReactionBar({
  postId,
  initialReactions,
  isAuthenticated,
}: ReactionBarProps) {
  const [reactions, setReactions] = useState(initialReactions)
  const [showPicker, setShowPicker] = useState(false)

  // Re-sync with a server refresh by adjusting state during render (the
  // documented alternative to a syncing effect) — no cascading render pass.
  const signature = JSON.stringify(initialReactions)
  const [syncedSignature, setSyncedSignature] = useState(signature)
  if (signature !== syncedSignature) {
    setSyncedSignature(signature)
    setReactions(initialReactions)
  }

  async function handleReact(type: ReactionType) {
    if (!isAuthenticated) {
      toast.info('Sign in to react to posts.')
      return
    }

    const previous = reactions
    if (type === 'love') {
      sound.playHeart()
    } else {
      sound.playPop()
    }
    setShowPicker(false)
    setReactions(applyReaction(previous, type))

    try {
      await toggleReaction(postId, type)
    } catch {
      setReactions(previous)
      toast.error('Could not update reaction.')
    }
  }

  const active = reactions.filter((r) => r.count > 0)

  return (
    <div className="flex flex-wrap items-center gap-1">
      {active.map((r) => (
        <button
          key={r.type}
          type="button"
          onClick={() => handleReact(r.type)}
          aria-pressed={r.reacted}
          aria-label={`${EMOJI_MAP[r.type].label}, ${r.count}`}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
            r.reacted
              ? 'border-brand/40 bg-brand-subtle text-brand font-semibold'
              : 'border-border bg-surface text-text-secondary hover:bg-surface-overlay'
          }`}
        >
          <span aria-hidden="true">{EMOJI_MAP[r.type].emoji}</span>
          <span>{r.count}</span>
        </button>
      ))}

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-xs text-muted hover:bg-surface-overlay hover:text-text-primary transition-colors"
          aria-label="Add a reaction"
          aria-haspopup="true"
          aria-expanded={showPicker}
        >
          <SmilePlus size={13} />
          <span className="hidden sm:inline">React</span>
        </button>

        {showPicker && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={() => setShowPicker(false)}
              aria-hidden="true"
            />
            <div className="absolute bottom-full left-0 z-30 mb-2 flex items-center gap-0.5 rounded-full border border-border bg-surface p-1 shadow-lg animate-scale-in">
              {(Object.keys(EMOJI_MAP) as ReactionType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleReact(type)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-base transition-transform hover:scale-110 hover:bg-surface-overlay"
                  aria-label={EMOJI_MAP[type].label}
                  title={EMOJI_MAP[type].label}
                >
                  {EMOJI_MAP[type].emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function applyReaction(
  list: { type: ReactionType; count: number; reacted: boolean }[],
  type: ReactionType
) {
  const existing = list.find((r) => r.type === type)

  if (!existing) return [...list, { type, count: 1, reacted: true }]

  if (existing.reacted) {
    return list
      .map((r) => (r.type === type ? { ...r, count: r.count - 1, reacted: false } : r))
      .filter((r) => r.count > 0)
  }

  return list.map((r) => (r.type === type ? { ...r, count: r.count + 1, reacted: true } : r))
}
