'use client'

import { useActionState, useState, useEffect } from 'react'
import { updateProfile, type AuthFormState } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/app/components/ui/Avatar'
import { toast } from 'sonner'
import { Moon, Sun, Upload } from 'lucide-react'

interface SettingsFormProps {
  userId: string
  email: string
  initialUsername: string
  initialDisplayName: string
  initialBio: string
  initialAvatarUrl: string
}

type Theme = 'light' | 'dark'

export default function SettingsForm({
  userId,
  email,
  initialUsername,
  initialDisplayName,
  initialBio,
  initialAvatarUrl,
}: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState<AuthFormState, FormData>(
    updateProfile,
    undefined
  )

  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [bio, setBio] = useState(initialBio)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [uploading, setUploading] = useState(false)

  // Read the applied theme from the DOM (the inline head script owns it) so the
  // selected state cannot disagree with what is actually rendered.
  const [theme, setTheme] = useState<Theme | null>(null)
  useEffect(() => {
    const current = document.documentElement.dataset.theme
    setTheme(current === 'dark' ? 'dark' : 'light')
  }, [])

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message ?? 'Saved.')
    } else if (state?.message) {
      toast.error(state.message)
    } else if (state?.errors) {
      const firstError = Object.values(state.errors).flat()[0]
      if (firstError) toast.error(firstError)
    }
  }, [state])

  function handleThemeChange(next: Theme) {
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    document.documentElement.style.colorScheme = next
    try {
      localStorage.setItem('theme', next)
    } catch {
      // Private mode — the theme still applies for this session.
    }
    toast.success(`${next === 'dark' ? 'Dark' : 'Light'} mode on`)
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB.')
      return
    }

    try {
      setUploading(true)
      const supabase = createClient()
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
      const path = `${userId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path)
      setAvatarUrl(publicUrlData.publicUrl)
      toast.success('Photo uploaded — remember to save.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Profile */}
      <form action={formAction} className="card space-y-5 p-5 sm:p-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">Profile</h2>
          <p className="hint mt-0.5">This is what other members see.</p>
        </div>

        {state?.message && !state.success && (
          <p
            role="alert"
            className="rounded-[var(--radius-md)] border px-3 py-2 text-sm"
            style={{
              background: 'var(--color-danger-subtle)',
              borderColor: 'var(--color-danger)',
              color: 'var(--color-danger)',
            }}
          >
            {state.message}
          </p>
        )}

        <input type="hidden" name="avatar_url" value={avatarUrl} />

        {/* Avatar */}
        <div className="flex items-center gap-4 rounded-[var(--radius-md)] border border-border bg-surface-raised p-3">
          <Avatar src={avatarUrl || null} name={displayName || initialUsername} size={56} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Profile photo</p>
            <label className="btn btn-secondary btn-sm mt-1.5 cursor-pointer">
              <Upload className="h-3.5 w-3.5" />
              {uploading ? 'Uploading…' : 'Change photo'}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {/* Username (immutable) */}
        <div>
          <label htmlFor="username" className="label">
            Handle
          </label>
          <input
            id="username"
            type="text"
            disabled
            value={`@${initialUsername}`}
            className="field"
          />
          <p className="hint mt-1">Handles are permanent — they anchor your profile URL.</p>
        </div>

        {/* Display name */}
        <div>
          <label htmlFor="display_name" className="label">
            Display name
          </label>
          <input
            id="display_name"
            name="display_name"
            type="text"
            required
            maxLength={50}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="field"
          />
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="label">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
            className="field resize-none"
            placeholder="A sentence or two about you."
          />
          <div className="mt-1 flex justify-end">
            <span className={`hint ${bio.length > 180 ? 'text-warning' : ''}`}>
              {bio.length}/200
            </span>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <button
            type="submit"
            disabled={isPending || uploading}
            className="btn btn-primary"
          >
            {isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      {/* Appearance */}
      <div className="card space-y-3 p-5 sm:p-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">Appearance</h2>
          <p className="hint mt-0.5">Applies instantly and is remembered on this device.</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {(
            [
              { value: 'light', label: 'Light', Icon: Sun },
              { value: 'dark', label: 'Dark', Icon: Moon },
            ] as const
          ).map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleThemeChange(value)}
              aria-pressed={theme === value}
              className={`flex items-center justify-center gap-2 rounded-[var(--radius-md)] border px-3 py-2.5 text-sm font-medium transition-colors ${
                theme === value
                  ? 'border-brand bg-brand-subtle text-brand'
                  : 'border-border bg-surface text-text-secondary hover:bg-surface-overlay'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Account */}
      <div className="card space-y-1.5 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-foreground">Account</h2>
        <dl className="space-y-1 text-xs text-muted">
          <div className="flex justify-between gap-3">
            <dt>Email</dt>
            <dd className="truncate text-text-secondary">{email}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>User ID</dt>
            <dd className="truncate font-mono text-text-secondary">{userId}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
