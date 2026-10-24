'use client'

import { useActionState, useState, useEffect } from 'react'
import { completeOnboarding, type AuthFormState } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/app/components/ui/Avatar'
import { toast } from 'sonner'
import { Moon, Sun } from 'lucide-react'

interface SettingsFormProps {
  userId: string
  email: string
  initialUsername: string
  initialDisplayName: string
  initialBio: string
  initialAvatarUrl: string
}

export default function SettingsForm({
  userId,
  email,
  initialUsername,
  initialDisplayName,
  initialBio,
  initialAvatarUrl,
}: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState<AuthFormState, FormData>(
    completeOnboarding,
    undefined
  )

  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [bio, setBio] = useState(initialBio)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [uploading, setUploading] = useState(false)
  const [theme, setTheme] = useState<string>('light')

  useEffect(() => {
    if (state?.message && !state.success) {
      toast.error(state.message)
    } else if (state?.errors) {
      const firstError = Object.values(state.errors)[0]?.[0]
      if (firstError) toast.error(firstError)
    }
  }, [state])

  // Theme toggle
  function handleThemeChange(newTheme: 'light' | 'dark') {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    toast.success(`Theme switched to ${newTheme} mode`)
  }

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
      toast.success('Avatar updated!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Profile Settings */}
      <form action={formAction} className="card p-6 sm:p-8 border border-border bg-surface space-y-6">
        <h2 className="text-lg font-bold text-foreground">Profile Information</h2>

        {state?.message && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {state.message}
          </div>
        )}

        <input type="hidden" name="username" value={initialUsername} />
        <input type="hidden" name="avatar_url" value={avatarUrl} />

        {/* Avatar */}
        <div className="flex items-center gap-5 p-4 rounded-xl bg-surface-raised border border-border">
          <Avatar
            src={avatarUrl || null}
            name={displayName || initialUsername}
            size={64}
          />
          <div>
            <label className="text-sm font-semibold text-foreground block mb-1">
              Change Profile Photo
            </label>
            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-raised cursor-pointer transition-colors">
              <span>{uploading ? 'Uploading...' : 'Choose File'}</span>
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

        {/* Username (Read Only) */}
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
            Username
          </label>
          <input
            type="text"
            disabled
            value={`@${initialUsername}`}
            className="w-full px-3.5 py-2.5 rounded-lg bg-surface-raised border border-border text-muted text-sm cursor-not-allowed"
          />
          <span className="text-[11px] text-muted mt-1 block">
            Handles cannot be changed once established.
          </span>
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
            Display Name <span className="text-red-500">*</span>
          </label>
          <input
            name="display_name"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg bg-surface-raised border border-border text-foreground text-sm focus:ring-2 focus:ring-brand focus:outline-hidden"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
            Bio
          </label>
          <textarea
            name="bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
            className="w-full px-3.5 py-2.5 rounded-lg bg-surface-raised border border-border text-foreground text-sm focus:ring-2 focus:ring-brand focus:outline-hidden resize-none"
          />
          <div className="flex justify-end text-xs text-muted mt-1">
            {bio.length}/200
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || uploading}
          className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {isPending ? 'Saving...' : 'Save Profile Changes'}
        </button>
      </form>

      {/* Theme Preference Card */}
      <div className="card p-6 sm:p-8 border border-border bg-surface space-y-4">
        <h2 className="text-lg font-bold text-foreground">Theme & Appearance</h2>
        <p className="text-xs text-muted">
          Customize your visual interface mode across sessions.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
              theme === 'light'
                ? 'border-brand bg-brand/10 text-brand'
                : 'border-border bg-surface-raised text-foreground hover:bg-surface'
            }`}
          >
            <Sun className="w-4 h-4" /> Light Mode
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
              theme === 'dark'
                ? 'border-brand bg-brand/10 text-brand'
                : 'border-border bg-surface-raised text-foreground hover:bg-surface'
            }`}
          >
            <Moon className="w-4 h-4" /> Dark Mode
          </button>
        </div>
      </div>

      {/* Account Info Card */}
      <div className="card p-6 border border-border bg-surface space-y-2 text-xs text-muted">
        <h2 className="text-sm font-bold text-foreground mb-1">Account & Security</h2>
        <p><strong>Signed in as:</strong> {email}</p>
        <p><strong>User ID:</strong> <span className="font-mono">{userId}</span></p>
      </div>
    </div>
  )
}
