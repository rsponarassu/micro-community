'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Avatar from '@/app/components/ui/Avatar'
import Badge from '@/app/components/ui/Badge'
import ReactionBar, { type ReactionType } from './ReactionBar'
import { formatRelative } from '@/lib/utils'
import { deletePost, togglePostPin } from '@/app/actions/posts'
import { MessageSquare, Shield, MoreHorizontal, Pin, Flag, Hash } from 'lucide-react'
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
  community_name?: string
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

  useEffect(() => {
    if (!menuOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  if (deleted) return null

  const isAuthor = !post.is_anonymous && currentUserId === post.author_id
  const canManage = Boolean(isAuthor || post.canModerate)
  const canModerate = Boolean(post.canModerate)

  const postHref = post.community_slug
    ? `/c/${post.community_slug}/post/${post.id}`
    : '#'

  async function handleDelete() {
    setMenuOpen(false)
    try {
      await deletePost(post.id)
      setDeleted(true)
      toast.success('Post deleted.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not delete post.')
    }
  }

  async function handleTogglePin() {
    setMenuOpen(false)
    try {
      await togglePostPin(post.id, isPinned)
      setIsPinned(!isPinned)
      toast.success(isPinned ? 'Post unpinned.' : 'Post pinned to top.')
    } catch {
      toast.error('Could not update pin status.')
    }
  }

  const authorName = post.is_anonymous
    ? 'Anonymous member'
    : post.author_display_name || post.author_username || 'Member'

  return (
    <article className="card card-interactive p-4 sm:p-5">
      <header className="flex items-start gap-3">
        {post.is_anonymous ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-raised">
            <Shield size={16} className="text-brand" aria-hidden="true" />
          </span>
        ) : (
          <Link
            href={post.author_username ? `/u/${post.author_username}` : '#'}
            className="shrink-0 rounded-full"
            aria-label={`View ${authorName}'s profile`}
          >
            <Avatar
              src={post.author_avatar_url}
              name={authorName}
              size={36}
            />
          </Link>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            {post.is_anonymous ? (
              <span className="font-semibold text-foreground">{authorName}</span>
            ) : (
              <Link
                href={post.author_username ? `/u/${post.author_username}` : '#'}
                className="font-semibold text-foreground hover:text-brand transition-colors truncate"
              >
                {authorName}
              </Link>
            )}

            {!post.is_anonymous && post.author_username && (
              <span className="text-xs text-muted truncate">
                @{post.author_username}
              </span>
            )}

            {post.is_anonymous && <Badge variant="brand">Anonymous</Badge>}

            {isPinned && (
              <Badge variant="warning">
                <Pin size={10} /> Pinned
              </Badge>
            )}
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
            {post.community_slug && post.community_name && (
              <>
                <Link
                  href={`/c/${post.community_slug}`}
                  className="inline-flex items-center gap-1 hover:text-brand transition-colors"
                >
                  <Hash size={11} />
                  {post.community_name}
                </Link>
                <span aria-hidden="true">·</span>
              </>
            )}
            <Link
              href={postHref}
              className="hover:text-text-secondary transition-colors"
            >
              <time dateTime={post.created_at}>{formatRelative(post.created_at)}</time>
            </Link>
          </div>
        </div>

        {currentUserId && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="btn btn-ghost !p-1.5"
              aria-label="Post actions"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <MoreHorizontal size={16} />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden="true"
                />
                <div
                  role="menu"
                  className="absolute right-0 top-full z-30 mt-1 w-44 rounded-lg border border-border bg-surface p-1 shadow-lg animate-scale-in"
                >
                  {canModerate && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleTogglePin}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-foreground hover:bg-surface-overlay transition-colors"
                    >
                      <Pin size={12} />
                      {isPinned ? 'Unpin post' : 'Pin post'}
                    </button>
                  )}

                  {canManage && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleDelete}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-danger hover:bg-danger-subtle transition-colors"
                    >
                      Delete post
                    </button>
                  )}

                  {!isAuthor && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false)
                        setReportOpen(true)
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-text-secondary hover:bg-surface-overlay hover:text-text-primary transition-colors"
                    >
                      <Flag size={12} />
                      Report post
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </header>

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="post"
        targetId={post.id}
        communityId={post.community_id}
      />

      <div className="mt-3 prose-content text-[14.5px] text-foreground whitespace-pre-line">
        {post.content}
      </div>

      {post.image_url && (
        <div className="mt-3 overflow-hidden rounded-lg border border-border bg-surface-raised">
          {/\.(mp4|webm|ogg)($|\?)/i.test(post.image_url) ? (
            <video
              src={post.image_url}
              controls
              playsInline
              preload="metadata"
              className="max-h-96 w-full bg-black object-contain"
            />
          ) : (
            <div className="relative aspect-4/3 w-full sm:aspect-16/10">
              <Image
                src={post.image_url}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 640px"
                className="object-cover"
                loading="lazy"
                unoptimized
              />
            </div>
          )}
        </div>
      )}

      <footer className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-2.5">
        <ReactionBar
          postId={post.id}
          initialReactions={post.reactions ?? []}
          isAuthenticated={Boolean(currentUserId)}
        />

        <Link
          href={postHref}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-surface-overlay hover:text-text-primary transition-colors"
          aria-label={`Open discussion, ${post.commentCount ?? 0} comments`}
        >
          <MessageSquare size={15} />
          {post.commentCount ?? 0}
        </Link>
      </footer>
    </article>
  )
}
