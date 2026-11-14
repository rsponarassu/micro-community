'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/app/components/ui/Avatar'
import Badge from '@/app/components/ui/Badge'
import { formatRelative } from '@/lib/utils'
import { createComment, deleteComment } from '@/app/actions/comments'
import { Shield, MessageSquare, Trash2, Flag, Send } from 'lucide-react'
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

const MAX_LENGTH = 2000

/** Keeps a textarea sized to its content instead of relying on rows. */
function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 240)}px`
}

function displayName(comment: CommentPublicData) {
  if (comment.is_anonymous) return 'Anonymous member'
  return comment.author_display_name || comment.author_username || 'Member'
}

export default function CommentThread({
  postId,
  initialComments,
  currentUserId,
  canModerate,
}: CommentThreadProps) {
  const [comments, setComments] = useState<CommentPublicData[]>(initialComments)
  const [isSyncing, setIsSyncing] = useState(false)

  // Root composer state — deliberately separate from the reply composer so
  // opening a reply never wipes a half-written top-level comment (and vice versa).
  const [commentText, setCommentText] = useState('')
  const [commentAnon, setCommentAnon] = useState(false)
  const [isPostingComment, setIsPostingComment] = useState(false)

  // Inline reply composer state
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyAnon, setReplyAnon] = useState(false)
  const [isPostingReply, setIsPostingReply] = useState(false)

  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null)

  const rootRef = useRef<HTMLTextAreaElement>(null)
  const replyRef = useRef<HTMLTextAreaElement>(null)

  /** Re-reads from the anonymity-safe view so we never render raw writer ids. */
  const refreshComments = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('comments_public')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (!error && data) setComments(data as CommentPublicData[])
  }, [postId])

  // Realtime: refetch the sanitised view whenever the underlying table changes.
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        () => {
          setIsSyncing(true)
          void refreshComments().finally(() => setIsSyncing(false))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId, refreshComments])

  // Focus the reply box the moment it opens.
  useEffect(() => {
    if (replyingTo) replyRef.current?.focus()
  }, [replyingTo])

  async function send(parentId: string | null) {
    if (!currentUserId) {
      toast.info('Sign in to join the discussion.')
      return
    }

    const isRoot = parentId === null
    const text = (isRoot ? commentText : replyText).trim()
    const anonymous = isRoot ? commentAnon : replyAnon
    if (!text) return

    if (isRoot) setIsPostingComment(true)
    else setIsPostingReply(true)

    const formData = new FormData()
    formData.append('post_id', postId)
    if (parentId) formData.append('parent_id', parentId)
    formData.append('content', text)
    formData.append('is_anonymous', anonymous ? 'true' : 'false')

    try {
      const res = await createComment(undefined, formData)

      if (res?.message) {
        sound.playError()
        toast.error(res.message)
        return
      }
      if (res?.errors) {
        sound.playError()
        toast.error(Object.values(res.errors).flat()[0] ?? 'Comment could not be posted.')
        return
      }

      if (isRoot) {
        setCommentText('')
        setCommentAnon(false)
        rootRef.current?.style.setProperty('height', 'auto')
      } else {
        setReplyText('')
        setReplyAnon(false)
        setReplyingTo(null)
      }

      await refreshComments()
      sound.playSuccess()
      toast.success(anonymous ? 'Posted anonymously' : 'Comment posted')
    } catch {
      sound.playError()
      toast.error('Could not post your comment. Please try again.')
    } finally {
      if (isRoot) setIsPostingComment(false)
      else setIsPostingReply(false)
    }
  }

  async function handleDelete(id: string) {
    const snapshot = comments
    setComments((prev) => prev.filter((c) => c.id !== id && c.parent_id !== id))
    try {
      await deleteComment(id)
      toast.success('Comment deleted')
    } catch {
      setComments(snapshot)
      sound.playError()
      toast.error('Could not delete the comment.')
    }
  }

  const topLevel = comments.filter((c) => !c.parent_id)
  const repliesByParent = comments.reduce<Record<string, CommentPublicData[]>>((acc, c) => {
    if (c.parent_id) (acc[c.parent_id] ??= []).push(c)
    return acc
  }, {})

  return (
    <section className="space-y-5" aria-label="Discussion">
      {/* ── Root composer ─────────────────────────────────────── */}
      <div className="card p-3.5 sm:p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface-raised text-muted sm:flex">
            {commentAnon ? <Shield className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
          </div>

          <div className="min-w-0 flex-1 space-y-2.5">
            <textarea
              ref={rootRef}
              rows={2}
              value={commentText}
              onChange={(e) => {
                setCommentText(e.target.value)
                autoGrow(e.currentTarget)
              }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void send(null)
              }}
              placeholder={currentUserId ? 'Share your thoughts…' : 'Sign in to join the discussion'}
              disabled={!currentUserId}
              maxLength={MAX_LENGTH}
              aria-label="Write a comment"
              className="field resize-none py-2.5"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={commentAnon}
                  onChange={(e) => setCommentAnon(e.target.checked)}
                />
                <span className="switch-track" aria-hidden="true" />
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Shield className="h-3 w-3" /> Anonymous
                </span>
              </label>

              <div className="flex items-center gap-2.5">
                {commentText.length > MAX_LENGTH * 0.9 && (
                  <span className="hint text-warning">
                    {MAX_LENGTH - commentText.length} left
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => void send(null)}
                  disabled={!currentUserId || isPostingComment || !commentText.trim()}
                  className="btn btn-primary btn-sm"
                >
                  {isPostingComment ? 'Posting…' : 'Comment'}
                </button>
              </div>
            </div>

            {commentAnon && (
              <p className="hint rounded-md border border-border bg-surface-raised px-2.5 py-1.5">
                Your handle will be hidden from everyone in this thread.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Thread ────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="eyebrow">
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </h2>
          {isSyncing && <span className="hint">Updating…</span>}
        </div>

        {topLevel.length === 0 ? (
          <div className="card-flat px-4 py-10 text-center">
            <MessageSquare className="mx-auto mb-2 h-6 w-6 text-muted" />
            <p className="text-sm font-medium text-foreground">No comments yet</p>
            <p className="hint mt-1">Be the first to start the conversation.</p>
          </div>
        ) : (
          topLevel.map((comment) => {
            const replies = repliesByParent[comment.id] ?? []
            const isOwn = !comment.is_anonymous && currentUserId === comment.author_id
            const canDelete = isOwn || canModerate
            const isReplying = replyingTo === comment.id

            return (
              <article
                id={`comment-${comment.id}`}
                key={comment.id}
                className="scroll-mt-24 space-y-2"
              >
                <div className="card p-3.5 sm:p-4">
                  <header className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      {comment.is_anonymous ? (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface-raised text-muted">
                          <Shield className="h-4 w-4" />
                        </div>
                      ) : (
                        <Avatar src={comment.author_avatar_url} name={displayName(comment)} size={32} />
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate text-[0.8125rem] font-semibold text-foreground">
                            {displayName(comment)}
                          </span>
                          {comment.is_anonymous && <Badge variant="default">Anonymous</Badge>}
                          {isOwn && <Badge variant="brand">You</Badge>}
                        </div>
                        <time
                          dateTime={comment.created_at}
                          className="text-[11px] text-muted"
                        >
                          {formatRelative(comment.created_at)}
                        </time>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingTo(isReplying ? null : comment.id)
                          setReplyText('')
                        }}
                        aria-expanded={isReplying}
                        aria-label={isReplying ? 'Cancel reply' : `Reply to ${displayName(comment)}`}
                        className="btn btn-ghost btn-sm px-2"
                      >
                        {isReplying ? 'Cancel' : 'Reply'}
                      </button>

                      {currentUserId && (
                        <button
                          type="button"
                          onClick={() => setReportingCommentId(comment.id)}
                          aria-label="Report comment"
                          className="rounded-md p-1.5 text-muted transition-colors hover:text-warning"
                        >
                          <Flag className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => void handleDelete(comment.id)}
                          aria-label="Delete comment"
                          className="rounded-md p-1.5 text-muted transition-colors hover:text-danger"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </header>

                  <p className="prose-content mt-2.5 whitespace-pre-line text-[0.875rem] text-foreground/90">
                    {comment.content}
                  </p>
                </div>

                {/* Inline reply composer */}
                {isReplying && (
                  <div className="ml-4 animate-slide-up border-l-2 border-border pl-3 sm:ml-8">
                    <div className="card space-y-2 p-3">
                      <textarea
                        ref={replyRef}
                        rows={2}
                        value={replyText}
                        onChange={(e) => {
                          setReplyText(e.target.value)
                          autoGrow(e.currentTarget)
                        }}
                        onKeyDown={(e) => {
                          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void send(comment.id)
                          if (e.key === 'Escape') setReplyingTo(null)
                        }}
                        maxLength={MAX_LENGTH}
                        placeholder={`Reply to ${displayName(comment)}…`}
                        aria-label={`Reply to ${displayName(comment)}`}
                        className="field resize-none py-2 text-[0.8125rem]"
                      />

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={replyAnon}
                            onChange={(e) => setReplyAnon(e.target.checked)}
                          />
                          <span className="switch-track" aria-hidden="true" />
                          <span className="text-[11px] text-muted">Reply anonymously</span>
                        </label>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setReplyingTo(null)}
                            className="btn btn-ghost btn-sm"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => void send(comment.id)}
                            disabled={isPostingReply || !replyText.trim()}
                            className="btn btn-primary btn-sm"
                          >
                            <Send className="h-3 w-3" />
                            {isPostingReply ? 'Sending…' : 'Reply'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {replies.length > 0 && (
                  <div className="ml-4 space-y-2 border-l-2 border-border pl-3 sm:ml-8">
                    {replies.map((reply) => {
                      const replyIsOwn = !reply.is_anonymous && currentUserId === reply.author_id
                      const canDeleteReply = replyIsOwn || canModerate

                      return (
                        <div
                          id={`comment-${reply.id}`}
                          key={reply.id}
                          className="card-flat scroll-mt-24 p-3"
                        >
                          <header className="flex items-start justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              {reply.is_anonymous ? (
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-surface-raised text-muted">
                                  <Shield className="h-3 w-3" />
                                </div>
                              ) : (
                                <Avatar src={reply.author_avatar_url} name={displayName(reply)} size={24} />
                              )}
                              <span className="truncate text-xs font-semibold text-foreground">
                                {displayName(reply)}
                              </span>
                              <time dateTime={reply.created_at} className="text-[10px] text-muted">
                                {formatRelative(reply.created_at)}
                              </time>
                            </div>

                            {canDeleteReply && (
                              <button
                                type="button"
                                onClick={() => void handleDelete(reply.id)}
                                aria-label="Delete reply"
                                className="rounded-md p-1 text-muted transition-colors hover:text-danger"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </header>

                          <p className="prose-content mt-1.5 whitespace-pre-line pl-8 text-[0.8125rem] text-foreground/90">
                            {reply.content}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </article>
            )
          })
        )}
      </div>

      {reportingCommentId && (
        <ReportModal
          isOpen
          onClose={() => setReportingCommentId(null)}
          targetType="comment"
          targetId={reportingCommentId}
        />
      )}
    </section>
  )
}
