'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Avatar from '@/app/components/ui/Avatar'
import Badge from '@/app/components/ui/Badge'
import ReactionBar, { type ReactionType } from './ReactionBar'
import { formatRelative } from '@/lib/utils'
import { deletePost, togglePostPin } from '@/app/actions/posts'
import { MessageSquare, Shield, MoreVertical, Pin, Flag } from 'lucide-react'
import { toast } from 'sonner'
import ReportModal from './ReportModal'

export interface PostPublicData {
  id: string
  community_id: string
  content: string
  image_url: string | null
  is_anonymous: boolean
  is_pinned: boolean
  created_at: string
  author_id: string | null
  author_username: string | null
  author_display_name: string | null
  author_avatar_url: string | null
  community_slug?: string
  reactions?: { type: ReactionType; count: number; reacted: boolean }[]
  commentCount?: number
  isAuthor?: boolean
  canModerate?: boolean
}

export default function PostCard({
  post,
  currentUserId,
}: {
  post: PostPublicData
  currentUserId?: string
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [isPinned, setIsPinned] = useState(post.is_pinned)

  if (deleted) return null

  const isAuthor = !post.is_anonymous && currentUserId && post.author_id === currentUserId
  const canManage = isAuthor || post.canModerate

  async function handleDelete() {
    try {
      await deletePost(post.id)
      setDeleted(true)
      toast.success('Post deleted.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not delete post.')
    }
  }

  async function handleTogglePin() {
    try {
      await togglePostPin(post.id, isPinned)
      setIsPinned(!isPinned)
      toast.success(isPinned ? 'Post unpinned.' : 'Post pinned to top.')
      setMenuOpen(false)
    } catch {
      toast.error('Could not update pin status.')
    }
  }

  const postDetailHref = post.community_slug
    ? `/c/${post.community_slug}/post/${post.id}`
    : `#`

  return (
    <article className="card p-5 border border-border bg-surface hover:border-brand/30 transition-all space-y-3.5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {post.is_anonymous ? (
            <div className="w-10 h-10 rounded-full bg-surface-raised border border-border flex items-center justify-center text-muted shrink-0">
              <Shield className="w-5 h-5 text-brand" />
            </div>
          ) : (
            <Link
              href={post.author_username ? `/u/${post.author_username}` : '#'}
              className="hover:opacity-85 transition-opacity shrink-0"
            >
              <Avatar
                src={post.author_avatar_url}
                name={post.author_display_name || post.author_username || 'Member'}
                size={40}
              />
            </Link>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {post.is_anonymous ? (
                <span className="font-semibold text-sm text-foreground">
                  Anonymous Member
                </span>
              ) : (
                <Link
                  href={post.author_username ? `/u/${post.author_username}` : '#'}
                  className="font-semibold text-sm text-foreground hover:text-brand transition-colors"
                >
                  {post.author_display_name || post.author_username}
                </Link>
              )}

              {post.is_anonymous ? (
                <Badge variant="default">Anonymous</Badge>
              ) : (
                post.author_username && (
                  <span className="text-xs text-muted">@{post.author_username}</span>
                )
              )}

              {isPinned && (
                <Badge variant="brand">
                  <Pin className="w-3 h-3 mr-0.5 inline" /> Pinned
                </Badge>
              )}
            </div>

            <div className="text-xs text-muted mt-0.5">
              {formatRelative(post.created_at)}
            </div>
          </div>
        </div>

        {/* Post Options Menu */}
        {currentUserId && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg hover:bg-surface-raised text-muted hover:text-foreground transition-colors"
              aria-label="Post actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-1 w-36 rounded-xl bg-surface border border-border shadow-xl p-1 z-20 text-xs">
                  {post.canModerate && (
                    <button
                      onClick={handleTogglePin}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-raised text-foreground font-medium transition-colors"
                    >
                      {isPinned ? 'Unpin Post' : 'Pin Post'}
                    </button>
                  )}
                  {canManage && (
                    <button
                      onClick={handleDelete}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-500 font-medium transition-colors"
                    >
                      Delete Post
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      setReportOpen(true)
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-raised text-muted hover:text-foreground font-medium transition-colors flex items-center gap-1.5"
                  >
                    <Flag className="w-3 h-3 text-amber-500" />
                    <span>Report Post</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="post"
        targetId={post.id}
        communityId={post.community_id}
      />

      {/* Content */}
      <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
        {post.content}
      </p>

      {/* Optional attached image */}
      {post.image_url && (
        <div className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden border border-border bg-surface-raised">
          <Image
            src={post.image_url}
            alt="Attached media"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      {/* Footer: Reactions + Comments count */}
      <div className="pt-3 border-t border-border flex items-center justify-between gap-4">
        <ReactionBar
          postId={post.id}
          initialReactions={post.reactions ?? []}
          isAuthenticated={!!currentUserId}
        />

        <Link
          href={postDetailHref}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors shrink-0"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{post.commentCount ?? 0}</span>
        </Link>
      </div>
    </article>
  )
}
