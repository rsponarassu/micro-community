'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { createPost, type PostFormState } from '@/app/actions/posts'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Shield, ImagePlus, X } from 'lucide-react'
import Avatar from '@/app/components/ui/Avatar'

interface PostFormProps {
  communityId: string
  avatarUrl?: string | null
  displayName?: string
}

const MAX_LENGTH = 5000

export default function PostForm({
  communityId,
  avatarUrl,
  displayName = 'You',
}: PostFormProps) {
  const [state, formAction, isPending] = useActionState<PostFormState, FormData>(
    createPost,
    undefined
  )

  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state?.success) {
      toast.success(isAnonymous ? 'Anonymous post published' : 'Post published')
      setContent('')
      setImageUrl('')
      setIsAnonymous(false)
      formRef.current?.reset()
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    } else if (state?.message && !state.success) {
      toast.error(state.message)
    }
  }, [state, isAnonymous])

  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB.')
      e.target.value = ''
      return
    }

    try {
      setUploading(true)
      const supabase = createClient()
      const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
      const path = `${communityId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(path, file, { upsert: false, contentType: file.type })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('post-images').getPublicUrl(path)
      setImageUrl(data.publicUrl)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const remaining = MAX_LENGTH - content.length
  const canSubmit = content.trim().length > 0 && !isPending && !uploading

  return (
    <form
      ref={formRef}
      action={formAction}
      className="card p-3.5 sm:p-4 focus-within:border-brand/40 transition-colors"
    >
      <input type="hidden" name="community_id" value={communityId} />
      <input type="hidden" name="image_url" value={imageUrl} />
      <input type="hidden" name="is_anonymous" value={String(isAnonymous)} />

      <div className="flex gap-3">
        <div className="hidden sm:block shrink-0 pt-1">
          {isAnonymous ? (
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-raised">
              <Shield size={15} className="text-brand" />
            </span>
          ) : (
            <Avatar src={avatarUrl} name={displayName} size={32} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            name="content"
            required
            rows={2}
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              autoGrow(e.target)
            }}
            placeholder={
              isAnonymous
                ? 'Share an honest question or feedback anonymously…'
                : 'Share an update, question, or idea…'
            }
            maxLength={MAX_LENGTH}
            aria-label="Post content"
            className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none min-h-[2.5rem] leading-relaxed"
          />

          {imageUrl && (
            <div className="relative mt-2 w-40 overflow-hidden rounded-lg border border-border bg-surface-raised">
              <Image
                src={imageUrl}
                alt="Attached image preview"
                width={160}
                height={100}
                className="h-24 w-full object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="absolute right-1 top-1 rounded-full bg-black/65 p-1 text-white hover:bg-black/85 transition-colors"
                aria-label="Remove attached image"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {isAnonymous && (
            <p className="mt-2 flex items-start gap-2 rounded-md border border-brand/25 bg-brand-subtle px-2.5 py-2 text-[11px] leading-relaxed text-text-secondary">
              <Shield size={13} className="mt-0.5 shrink-0 text-brand" />
              <span>
                <strong className="text-foreground">Anonymous mode.</strong> Your
                name and avatar are stripped from every public query. Moderators can
                still unmask abusive content through the audit log.
              </span>
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="btn btn-ghost btn-sm"
                aria-label="Attach an image"
              >
                <ImagePlus size={15} />
                {uploading ? 'Uploading…' : 'Image'}
              </button>

              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                onChange={handleImageUpload}
                tabIndex={-1}
              />

              <label className="switch ml-1 rounded-md px-1.5 py-1">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />
                <span className="switch-track" />
                <span className="text-xs font-medium text-text-secondary">
                  Anonymous
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2.5">
              {content.length > 0 && (
                <span
                  className={`text-[11px] tabular-nums ${
                    remaining < 100 ? 'text-warning' : 'text-muted'
                  }`}
                >
                  {remaining}
                </span>
              )}
              <button type="submit" disabled={!canSubmit} className="btn btn-primary btn-sm">
                {isPending ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
