'use client'

import { useState } from 'react'
import { resolveReport, hideContent, unmaskAuthor } from '@/app/actions/moderation'
import { formatRelative } from '@/lib/utils'
import { AlertTriangle, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export interface ReportItem {
  id: string
  reporter_id: string
  target_type: 'post' | 'comment' | 'user' | 'community'
  target_id: string
  reason: string
  status: string
  created_at: string
}

interface AdminReportsQueueProps {
  communityId: string
  initialReports: ReportItem[]
}

export default function AdminReportsQueue({
  communityId,
  initialReports,
}: AdminReportsQueueProps) {
  const [reports, setReports] = useState(initialReports)
  const [unmaskedAuthors, setUnmaskedAuthors] = useState<Record<string, string>>({})
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleDismiss(reportId: string) {
    setLoadingId(reportId)
    try {
      await resolveReport(reportId, 'dismissed')
      setReports((prev) => prev.filter((r) => r.id !== reportId))
      toast.info('Report dismissed.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleHide(reportId: string, targetType: 'post' | 'comment', targetId: string) {
    setLoadingId(reportId)
    try {
      await hideContent(targetType, targetId)
      await resolveReport(reportId, 'resolved')
      setReports((prev) => prev.filter((r) => r.id !== reportId))
      toast.success('Content hidden from community and report resolved.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleUnmask(reportId: string, postId: string) {
    setLoadingId(reportId)
    try {
      const authorId = await unmaskAuthor(postId, communityId)
      setUnmaskedAuthors((prev) => ({ ...prev, [postId]: authorId }))
      toast.warning('Author unmasked. Action logged to audit_log.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not unmask author')
    } finally {
      setLoadingId(null)
    }
  }

  if (reports.length === 0) {
    return (
      <div className="card p-6 border border-border bg-surface text-center text-xs text-muted">
        No active reports right now. Clean moderation log! ✨
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div
          key={report.id}
          className="card p-4 border border-border bg-surface space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-amber-500/10 text-amber-500">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <div>
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Reported {report.target_type}
                </span>
                <span className="text-[11px] text-muted block">
                  {formatRelative(report.created_at)}
                </span>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
              Needs Review
            </span>
          </div>

          <div className="p-3 rounded-lg bg-surface-raised border border-border text-xs text-foreground/90">
            <strong>Reason:</strong> {report.reason}
          </div>

          {/* Unmasked Author Display */}
          {unmaskedAuthors[report.target_id] && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400 font-mono">
              <strong>Unmasked Author UUID:</strong> {unmaskedAuthors[report.target_id]}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs">
            {report.target_type === 'post' && !unmaskedAuthors[report.target_id] && (
              <button
                onClick={() => handleUnmask(report.id, report.target_id)}
                disabled={loadingId === report.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold transition-colors disabled:opacity-50"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Unmask Author (Audit Logged)</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => handleDismiss(report.id)}
                disabled={loadingId === report.id}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-surface-raised hover:bg-surface text-muted hover:text-foreground transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Dismiss</span>
              </button>

              {(report.target_type === 'post' || report.target_type === 'comment') && (
                <button
                  onClick={() => handleHide(report.id, report.target_type as 'post' | 'comment', report.target_id)}
                  disabled={loadingId === report.id}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Hide Content</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
