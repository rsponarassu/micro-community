'use client'

import { useActionState, useState, useRef, useEffect } from 'react'
import { createPost, type PostFormState } from '@/app/actions/posts'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Image from 'next/image'
import { Shield, Image as ImageIcon, X } from 'lucide-react'
import { sound } from '@/lib/sound'

interface PostFormProps {
  communityId: string
  onSuccess?: () => void
}

export default function PostForm({
  communityId,
  onSuccess,
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

  useEffect(() => {
    if (state?.success) {
      sound.playSuccess()
      toast.success(
        isAnonymous
          ? 'Anonymous post published!'
          : 'Post published successfully!'
      )
      setContent('')
      setImageUrl('')
      setIsAnonymous(false)
      formRef.current?.reset()
      onSuccess?.()
    } else if (state?.message && !state.success) {
      sound.playError()
      toast.error(state.message)
    } else if (state?.errors?.content?.[0]) {
      sound.playError()
      toast.error(state.errors.content[0])
    }
  }, [state, isAnonymous, onSuccess])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB.')
      return
    }

    try {
      setUploading(true)
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `posts/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(path)

      setImageUrl(publicUrlData.publicUrl)
      toast.success('Image attached!')
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to upload image'
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="card p-5 border border-border bg-surface shadow-xs">
      <form ref={formRef} action={formAction} className="space-y-4">
        <input type="hidden" name="community_id" value={communityId} />
        <input type="hidden" name="image_url" value={imageUrl} />
        <input
          type="hidden"
          name="is_anonymous"
          value={isAnonymous ? 'true' : 'false'}
        />

        {state?.message && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {state.message}
          </div>
        )}

        <div>
          <textarea
            name="content"
            required
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              isAnonymous
                ? 'Share an honest confession, sensitive question, or feedback anonymously...'
                : 'Share an update, idea, question, or tutorial...'
            }
            maxLength={5000}
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border text-foreground placeholder:text-muted focus:ring-2 focus:ring-brand focus:outline-hidden transition-all text-sm resize-none"
          />
          {state?.errors?.content && (
            <p className="mt-1 text-xs text-red-500">
              {state.errors.content[0]}
            </p>
          )}
        </div>

        {/* Attached image preview */}
        {imageUrl && (
          <div className="relative w-36 h-24 rounded-lg overflow-hidden border border-border bg-surface-raised">
            <Image
              src={imageUrl}
              alt="Uploaded image"
              fill
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={() => setImageUrl('')}
              className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Anonymity Banner */}
        {isAnonymous && (
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground">Anonymous Mode Active:</strong>{' '}
              Your name and profile avatar will return <code>null</code> on all
              public queries and feeds.
            </div>
          </div>
        )}

        {/* Controls row */}
        <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Image upload button */}
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-raised hover:bg-surface text-xs font-medium text-foreground cursor-pointer transition-colors">
              <ImageIcon className="w-3.5 h-3.5 text-muted" />
              <span>{uploading ? 'Uploading...' : 'Attach Image'}</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </label>

            {/* Anonymous Toggle */}
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-surface-raised peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-brand relative border border-border" />
              <span className="text-xs font-medium text-foreground flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-muted" /> Anonymous
              </span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">{content.length}/5000</span>
            <button
              type="submit"
              disabled={isPending || uploading || !content.trim()}
              className="py-1.5 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white font-medium text-xs transition-colors shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
