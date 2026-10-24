'use client'

import { useActionState, useState, useEffect } from 'react'
import Modal from './ui/Modal'
import { reportContent, type ModerationFormState } from '@/app/actions/moderation'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  targetType: 'post' | 'comment' | 'user' | 'community'
  targetId: string
  communityId?: string
}

const REASONS = [
  'Spam or deceptive advertising',
  'Harassment, bullying, or threats',
  'Hate speech or discrimination',
  'Inappropriate or illegal content',
  'Off-topic or disrupting discussion',
  'Other violation of community guidelines',
]

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  communityId,
}: ReportModalProps) {
  const [state, formAction, isPending] = useActionState<ModerationFormState, FormData>(
    reportContent,
    undefined
  )

  const [selectedReason, setSelectedReason] = useState(REASONS[0])
  const [details, setDetails] = useState('')

  useEffect(() => {
    if (state?.success) {
      toast.success('Thank you. The report has been sent to moderators.')
      onClose()
    }
  }, [state, onClose])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Content"
      description="Help maintain a safe and constructive community environment."
      maxWidth="md"
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="target_type" value={targetType} />
        <input type="hidden" name="target_id" value={targetId} />
        {communityId && <input type="hidden" name="community_id" value={communityId} />}

        {state?.message && !state?.success && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
            {state.message}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
            Select a Reason
          </label>
          <div className="space-y-2">
            {REASONS.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer text-xs transition-colors ${
                  selectedReason === r
                    ? 'border-brand bg-brand/5 text-foreground font-semibold'
                    : 'border-border bg-surface-raised text-muted hover:text-foreground'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={selectedReason === r}
                  onChange={() => setSelectedReason(r)}
                  className="mt-0.5"
                />
                <span>{r}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
            Additional Context <span className="text-muted font-normal">(optional)</span>
          </label>
          <textarea
            rows={2}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Provide any context that will help the moderation team..."
            maxLength={500}
            className="w-full px-3 py-2 rounded-lg bg-surface-raised border border-border text-foreground text-xs resize-none"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-muted hover:text-foreground transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isPending ? 'Submitting...' : 'Submit Report'}</span>
          </button>
        </div>
      </form>
    </Modal>
  )
}
