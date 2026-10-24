'use client'

import { useState } from 'react'
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

  async function handleReact(type: ReactionType) {
    if (!isAuthenticated) {
      sound.playNotification()
      toast.info('Please log in to react to posts.')
      return
    }

    sound.playPop()

    // Optimistic state update
    setReactions((prev) => {
      const existing = prev.find((r) => r.type === type)
      if (existing) {
        if (existing.reacted) {
          return prev
            .map((r) =>
              r.type === type ? { ...r, count: r.count - 1, reacted: false } : r
            )
            .filter((r) => r.count > 0)
        } else {
          return prev.map((r) =>
            r.type === type ? { ...r, count: r.count + 1, reacted: true } : r
          )
        }
      } else {
        return [...prev, { type, count: 1, reacted: true }]
      }
    })
    setShowPicker(false)

    try {
      await toggleReaction(postId, type)
    } catch {
      toast.error('Could not update reaction.')
      // Rollback
      setReactions(initialReactions)
    }
  }

  const activeReactionList = reactions.filter((r) => r.count > 0)

  return (
    <div className="flex items-center gap-1.5 flex-wrap relative">
      {/* Active reaction pills */}
      {activeReactionList.map((r) => (
        <button
          key={r.type}
          onClick={() => handleReact(r.type)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all border ${
            r.reacted
              ? 'bg-brand/10 border-brand/40 text-brand font-semibold'
              : 'bg-surface-raised border-border text-foreground/80 hover:bg-surface'
          }`}
          title={EMOJI_MAP[r.type].label}
        >
          <span>{EMOJI_MAP[r.type].emoji}</span>
          <span>{r.count}</span>
        </button>
      ))}

      {/* Add reaction trigger button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-muted hover:text-foreground bg-surface-raised hover:bg-surface border border-border transition-colors"
          title="Add reaction"
        >
          <span>+</span>
          <span>React</span>
        </button>

        {showPicker && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowPicker(false)}
            />
            <div className="absolute bottom-full left-0 mb-2 flex items-center gap-1 p-1.5 rounded-full bg-surface border border-border shadow-xl z-20 animate-scale-in">
              {(Object.keys(EMOJI_MAP) as ReactionType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleReact(type)}
                  className="w-8 h-8 rounded-full hover:bg-surface-raised flex items-center justify-center text-lg hover:scale-125 transition-transform"
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
