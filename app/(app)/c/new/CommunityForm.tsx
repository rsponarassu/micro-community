'use client'

import { useActionState, useState, useEffect } from 'react'
import { createCommunity, type CommunityFormState } from '@/app/actions/communities'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import { toast } from 'sonner'
import Image from 'next/image'
import { Lock, Globe } from 'lucide-react'

const CATEGORIES = ['Technology', 'Business', 'Design', 'Sports & Fitness', 'Academic', 'Social', 'Arts', 'Other']

export default function CommunityForm() {
  const [state, formAction, isPending] = useActionState<CommunityFormState, FormData>(
    createCommunity,
    undefined
  )

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [isPrivate, setIsPrivate] = useState(false)
  const [iconUrl, setIconUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [uploading, setUploading] = useState<string | null>(null)

  useEffect(() => {
    if (state?.message && !state.success) {
      toast.error(state.message)
    } else if (state?.errors) {
      const firstError = Object.values(state.errors)[0]?.[0]
      if (firstError) toast.error(firstError)
    }
  }, [state])

  function handleNameChange(val: string) {
    setName(val)
    if (!slugEdited) {
      setSlug(slugify(val))
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'icon' | 'cover') {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB.')
      return
    }

    try {
      setUploading(type)
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `${type}s/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('community-media')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('community-media')
        .getPublicUrl(path)

      if (type === 'icon') setIconUrl(publicUrlData.publicUrl)
      else setCoverUrl(publicUrlData.publicUrl)

      toast.success(`${type === 'icon' ? 'Icon' : 'Cover'} uploaded successfully!`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      toast.error(`Could not upload image: ${msg}`)
    } finally {
      setUploading(null)
    }
  }

  return (

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form column */}
      <div className="lg:col-span-2">
        <form action={formAction} className="space-y-6">
          {state?.message && (
            <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {state.message}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
              Community Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Next.js Developers"
              className="w-full px-3.5 py-2.5 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted focus:ring-2 focus:ring-brand focus:outline-hidden transition-all text-sm"
            />
            {state?.errors?.name && (
              <p className="mt-1 text-xs text-red-500">{state.errors.name[0]}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-foreground mb-1.5">
              URL Slug <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center">
              <span className="px-3 py-2.5 rounded-l-lg bg-surface-raised border border-r-0 border-border text-muted text-sm">
                /c/
              </span>
              <input
                id="slug"
                name="slug"
                type="text"
                required
                value={slug}
                onChange={(e) => {
                  setSlugEdited(true)
                  setSlug(slugify(e.target.value))
                }}
                placeholder="nextjs-developers"
                className="flex-1 px-3.5 py-2.5 rounded-r-lg bg-surface border border-border text-foreground placeholder:text-muted focus:ring-2 focus:ring-brand focus:outline-hidden transition-all text-sm"
              />
            </div>
            {state?.errors?.slug && (
              <p className="mt-1 text-xs text-red-500">{state.errors.slug[0]}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-surface border border-border text-foreground focus:ring-2 focus:ring-brand focus:outline-hidden transition-all text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1.5">
              Description <span className="text-xs text-muted font-normal">(optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this community about? Who should join?"
              maxLength={500}
              className="w-full px-3.5 py-2.5 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted focus:ring-2 focus:ring-brand focus:outline-hidden transition-all text-sm resize-none"
            />
            <div className="flex justify-end text-xs text-muted mt-1">
              {description.length}/500
            </div>
          </div>

          {/* Privacy */}
          <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
            <span className="text-sm font-medium text-foreground block">Privacy</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${!isPrivate ? 'border-brand bg-brand/5' : 'border-border bg-surface-raised'
                  }`}
              >
                <input
                  type="radio"
                  name="is_private"
                  value="false"
                  checked={!isPrivate}
                  onChange={() => setIsPrivate(false)}
                  className="mt-1"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Globe className="w-4 h-4 text-brand" /> Public
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    Anyone can view posts and join immediately.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isPrivate ? 'border-brand bg-brand/5' : 'border-border bg-surface-raised'
                  }`}
              >
                <input
                  type="radio"
                  name="is_private"
                  value="true"
                  checked={isPrivate}
                  onChange={() => setIsPrivate(true)}
                  className="mt-1"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Lock className="w-4 h-4 text-amber-500" /> Private
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    New members must be approved by a moderator.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Media uploads */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Community Icon
              </label>
              <input type="hidden" name="icon_url" value={iconUrl} />
              <label className="flex flex-col items-center justify-center h-28 border border-dashed border-border rounded-xl cursor-pointer hover:bg-surface-raised transition-colors p-2 text-center">
                {iconUrl ? (
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden">
                    <Image src={iconUrl} alt="Icon preview" fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <>
                    <span className="text-xs font-medium text-foreground">
                      {uploading === 'icon' ? 'Uploading...' : 'Upload Icon'}
                    </span>
                    <span className="text-[11px] text-muted mt-0.5">PNG, JPG up to 10MB</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => handleFileUpload(e, 'icon')}
                  disabled={uploading !== null}
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Cover Banner
              </label>
              <input type="hidden" name="cover_url" value={coverUrl} />
              <label className="flex flex-col items-center justify-center h-28 border border-dashed border-border rounded-xl cursor-pointer hover:bg-surface-raised transition-colors p-2 text-center">
                {coverUrl ? (
                  <div className="relative w-full h-full rounded-lg overflow-hidden">
                    <Image src={coverUrl} alt="Cover preview" fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <>
                    <span className="text-xs font-medium text-foreground">
                      {uploading === 'cover' ? 'Uploading...' : 'Upload Cover Banner'}
                    </span>
                    <span className="text-[11px] text-muted mt-0.5">Landscape recommended</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => handleFileUpload(e, 'cover')}
                  disabled={uploading !== null}
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || uploading !== null}
            className="w-full py-3 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white font-medium text-sm transition-colors shadow-xs disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? 'Creating Community...' : 'Create & Launch Community'}
          </button>
        </form>
      </div>

      {/* Live Preview column */}
      <div>
        <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-3">
          Live Card Preview
        </span>
        <div className="card overflow-hidden border border-border bg-surface shadow-md">
          <div className="h-24 w-full relative bg-surface-raised overflow-hidden">
            {coverUrl ? (
              <Image src={coverUrl} alt="" fill className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full bg-linear-to-r from-brand/20 to-purple-500/20" />
            )}
          </div>
          <div className="p-4 pt-0">
            <div className="flex justify-between items-end -mt-6 mb-3">
              <div className="w-12 h-12 rounded-xl border-2 border-surface bg-surface-raised overflow-hidden flex items-center justify-center font-bold text-lg text-foreground shadow-xs">
                {iconUrl ? (
                  <Image src={iconUrl} alt="" width={48} height={48} className="w-full h-full object-cover" unoptimized />
                ) : (
                  <span>{name ? name[0].toUpperCase() : 'C'}</span>
                )}
              </div>
              <span className="px-3 py-1 rounded-md text-xs font-semibold bg-brand text-white">
                Join
              </span>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <h4 className="font-semibold text-sm text-foreground truncate">
                {name || 'Community Name'}
              </h4>
              {isPrivate && <Lock className="w-3.5 h-3.5 text-muted shrink-0" />}
            </div>
            <p className="text-xs text-muted mb-2 font-mono">/c/{slug || 'community-slug'}</p>
            <p className="text-xs text-muted line-clamp-2 mb-3">
              {description || 'Community description will appear here...'}
            </p>
            <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted">
              <span>{category}</span>
              <span>1 member</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
