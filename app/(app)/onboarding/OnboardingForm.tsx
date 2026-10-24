'use client'

import { useActionState, useState } from 'react'
import { completeOnboarding, type AuthFormState } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/app/components/ui/Avatar'
import { toast } from 'sonner'

interface OnboardingFormProps {
  initialDisplayName?: string
  initialUsername?: string
  initialAvatarUrl?: string
  userId: string
}

export default function OnboardingForm({
  initialDisplayName = '',
  initialUsername = '',
  initialAvatarUrl = '',
  userId,
}: OnboardingFormProps) {
  const [state, formAction, isPending] = useActionState<AuthFormState, FormData>(
    completeOnboarding,
    undefined
  )

  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [username, setUsername] = useState(initialUsername)
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [uploading, setUploading] = useState(false)

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB.')
      return
    }

    try {
      setUploading(true)
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `${userId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      setAvatarUrl(publicUrlData.publicUrl)
      toast.success('Avatar uploaded successfully!')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      toast.error(`Could not upload avatar: ${message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.message && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
          {state.message}
        </div>
      )}

      {/* Avatar Section */}
      <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-surface-raised border border-border">
        <div className="relative group">
          <Avatar
            src={avatarUrl || null}
            name={displayName || 'User'}
            size={64}
          />
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center text-xs text-white">
              ...
            </div>
          )}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <label className="text-sm font-medium text-foreground block mb-1">
            Profile Photo
          </label>
          <p className="text-xs text-muted mb-3">
            Upload a PNG, JPEG, or WebP up to 5MB.
          </p>
          <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md border border-border bg-surface text-sm font-medium text-foreground hover:bg-surface-raised cursor-pointer transition-colors">
            <span>{uploading ? 'Uploading...' : 'Choose File'}</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
          </label>
          <input type="hidden" name="avatar_url" value={avatarUrl} />
        </div>
      </div>

      {/* Display Name */}
      <div>
        <label
          htmlFor="display_name"
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          Display Name <span className="text-red-500">*</span>
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Alex Chen"
          className="w-full px-3.5 py-2.5 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted focus:outline-hidden focus:ring-2 focus:ring-brand focus:border-brand transition-all text-sm"
        />
        {state?.errors?.display_name && (
          <p className="mt-1 text-xs text-red-500">
            {state.errors.display_name[0]}
          </p>
        )}
      </div>

      {/* Username */}
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          Username <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted text-sm">
            @
          </span>
          <input
            id="username"
            name="username"
            type="text"
            required
            value={username}
            onChange={(e) =>
              setUsername(
                e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
              )
            }
            placeholder="username"
            className="w-full pl-8 pr-3.5 py-2.5 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted focus:outline-hidden focus:ring-2 focus:ring-brand focus:border-brand transition-all text-sm"
          />
        </div>
        <p className="mt-1 text-xs text-muted">
          3-30 characters, lowercase letters, numbers, and underscores only.
        </p>
        {state?.errors?.username && (
          <p className="mt-1 text-xs text-red-500">
            {state.errors.username[0]}
          </p>
        )}
      </div>

      {/* Bio */}
      <div>
        <label
          htmlFor="bio"
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          Short Bio <span className="text-xs text-muted font-normal">(optional)</span>
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell other community members what you're working on or interested in..."
          maxLength={200}
          className="w-full px-3.5 py-2.5 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted focus:outline-hidden focus:ring-2 focus:ring-brand focus:border-brand transition-all text-sm resize-none"
        />
        <div className="flex justify-between items-center mt-1">
          {state?.errors?.bio ? (
            <p className="text-xs text-red-500">{state.errors.bio[0]}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted">{bio.length}/200</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending || uploading}
        className="w-full py-2.5 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white font-medium text-sm transition-colors shadow-xs disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <svg
              className="animate-spin h-4 w-4 text-white"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <span>Setting up your profile...</span>
          </>
        ) : (
          <span>Complete Profile & Join Platform</span>
        )}
      </button>
    </form>
  )
}
