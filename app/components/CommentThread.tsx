'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/app/components/ui/Avatar'
import Badge from '@/app/components/ui/Badge'
import { formatRelative } from '@/lib/utils'
import { createComment, deleteComment } from '@/app/actions/comments'
import { Shield, CornerDownRight, Trash2, Flag } from 'lucide-react'
import { toast } from 'sonner'
import { sound } from '@/lib/sound'
import ReportModal from './ReportModal'

export interface CommentPublicData {
  id: string
  post_id: string
  parent_id: string | null
  content: string
  is_anonymous: boolean
  created_at: string
  author_id: string | null
  author_username: string | null
  author_display_name: string | null
  author_avatar_url: string | null
}

interface CommentThreadProps {
  postId: string
  initialComments: CommentPublicData[]
  currentUserId?: string
  canModerate?: boolean
}

export default function CommentThread({
  postId,
  initialComments,
  currentUserId,
  canModerate,
}: CommentThreadProps) {
  const [comments, setComments] = useState<CommentPublicData[]>(initialComments)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isAnonReply, setIsAnonReply] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null)

  // Supabase Realtime subscription for comments
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        async () => {
          // Re-fetch strictly from comments_public view to maintain anonymity
          const { data } = await supabase
            .from('comments_public')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true })

          if (data) {
            setComments(data as CommentPublicData[])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId])

  async function handleSend(parentId?: string | null) {
    if (!currentUserId) {
      toast.info('Sign in to leave a comment.')
      return
    }
    if (!replyText.trim()) return

    setIsSubmitting(true)
    const formData = new FormData()
    formData.append('post_id', postId)
    if (parentId) formData.append('parent_id', parentId)
    formData.append('content', replyText.trim())
    formData.append('is_anonymous', isAnonReply ? 'true' : 'false')

    try {
      const res = await createComment(undefined, formData)
      if (res?.message) {
        sound.playError()
        toast.error(res.message)
      } else {
        setReplyText('')
        setReplyingTo(null)
        setIsAnonReply(false)
        sound.playSuccess()
        toast.success(isAnonReply ? 'Anonymous comment posted' : 'Comment posted')
      }
    } catch {
      sound.playError()
      toast.error('Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteComment(id)
      setComments((prev) => prev.filter((c) => c.id !== id && c.parent_id !== id))
      toast.success('Comment deleted')
    } catch {
      toast.error('Failed to delete comment')
    }
  }

  // Top level comments
  const topLevel = comments.filter((c) => !c.parent_id)
  const repliesByParent = comments.reduce<Record<string, CommentPublicData[]>>((acc, c) => {
    if (c.parent_id) {
      if (!acc[c.parent_id]) acc[c.parent_id] = []
      acc[c.parent_id].push(c)
    }
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Root Comment Box */}
      <div className="card p-4 border border-border bg-surface space-y-3">
        <textarea
          rows={2}
          value={replyingTo === null ? replyText : ''}
          onChange={(e) => {
            setReplyingTo(null)
            setReplyText(e.target.value)
          }}
          placeholder="Write a comment..."
          maxLength={2000}
          className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border text-foreground placeholder:text-muted focus:ring-2 focus:ring-brand focus:outline-hidden transition-all text-sm resize-none"
        />

        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={replyingTo === null && isAnonReply}
              onChange={(e) => {
                setReplyingTo(null)
                setIsAnonReply(e.target.checked)
              }}
              className="sr-only peer"
            />
            <div className="w-7 h-4 bg-surface-raised rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand relative border border-border" />
            <span className="text-xs text-muted flex items-center gap-1">
              <Shield className="w-3 h-3" /> Anonymous
            </span>
          </label>

          <button
            onClick={() => handleSend(null)}
            disabled={isSubmitting || !replyText.trim() || replyingTo !== null}
            className="py-1.5 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Posting...' : 'Comment'}
          </button>
        </div>
      </div>

      {/* Comment List */}
      <div className="space-y-4">
        {topLevel.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">
            No comments yet. Start the conversation!
          </p>
        ) : (
          topLevel.map((comment) => {
            const replies = repliesByParent[comment.id] ?? []
            const canDelete =
              (!comment.is_anonymous && currentUserId === comment.author_id) || canModerate

            return (
              <div key={comment.id} className="space-y-3">
                <div className="card p-4 border border-border bg-surface space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {comment.is_anonymous ? (
                        <div className="w-7 h-7 rounded-full bg-surface-raised border border-border flex items-center justify-center text-muted">
                          <Shield className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <Avatar
                          src={comment.author_avatar_url}
                          name={comment.author_display_name || comment.author_username || 'Member'}
                          size={28}
                        />
                      )}
                      <span className="font-semibold text-xs text-foreground">
                        {comment.is_anonymous ? 'Anonymous Member' : comment.author_display_name || comment.author_username}
                      </span>
                      {comment.is_anonymous && <Badge variant="default">Anon</Badge>}
                      <span className="text-[11px] text-muted">
                        {formatRelative(comment.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setReplyingTo(comment.id)
                          setReplyText('')
                        }}
                        className="text-xs text-muted hover:text-brand font-medium transition-colors"
                      >
                        Reply
                      </button>
                      {currentUserId && (
                        <button
                          onClick={() => setReportingCommentId(comment.id)}
                          className="text-muted hover:text-amber-500 p-1"
                          title="Report comment"
                        >
                          <Flag className="w-3 h-3" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-muted hover:text-red-500 p-1"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-foreground/90 pl-9 whitespace-pre-line">
                    {comment.content}
                  </p>
                </div>

                {/* Inline Reply Form */}
                {replyingTo === comment.id && (
                  <div className="pl-8 pt-1">
                    <div className="card p-3 border border-border bg-surface-raised space-y-2">
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Reply to ${comment.is_anonymous ? 'Anonymous' : comment.author_username ?? 'member'}...`}
                        className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-xs text-foreground resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isAnonReply}
                            onChange={(e) => setIsAnonReply(e.target.checked)}
                          />
                          <span className="text-[11px] text-muted">Reply anonymously</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setReplyingTo(null)}
                            className="text-xs text-muted hover:text-foreground"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSend(comment.id)}
                            disabled={!replyText.trim()}
                            className="px-3 py-1 rounded-md bg-brand text-white text-xs font-medium"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nested Replies */}
                {replies.length > 0 && (
                  <div className="pl-6 border-l-2 border-border/60 space-y-2.5 ml-3">
                    {replies.map((reply) => {
                      const canDeleteReply =
                        (!reply.is_anonymous && currentUserId === reply.author_id) || canModerate

                      return (
                        <div key={reply.id} className="card p-3 border border-border bg-surface-raised/70 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CornerDownRight className="w-3 h-3 text-muted" />
                              {reply.is_anonymous ? (
                                <div className="w-5 h-5 rounded-full bg-surface border border-border flex items-center justify-center text-muted">
                                  <Shield className="w-2.5 h-2.5" />
                                </div>
                              ) : (
                                <Avatar
                                  src={reply.author_avatar_url}
                                  name={reply.author_display_name || reply.author_username || 'Member'}
                                  size={22}
                                />
                              )}
                              <span className="font-semibold text-xs text-foreground">
                                {reply.is_anonymous ? 'Anonymous' : reply.author_display_name || reply.author_username}
                              </span>
                              <span className="text-[10px] text-muted">
                                {formatRelative(reply.created_at)}
                              </span>
                            </div>

                            {canDeleteReply && (
                              <button
                                onClick={() => handleDelete(reply.id)}
                                className="text-muted hover:text-red-500 p-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-foreground/90 pl-5 whitespace-pre-line">
                            {reply.content}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
      {/* Report Modal */}
      {reportingCommentId && (
        <ReportModal
          isOpen={!!reportingCommentId}
          onClose={() => setReportingCommentId(null)}
          targetType="comment"
          targetId={reportingCommentId}
        />
      )}
    </div>
  )
}
