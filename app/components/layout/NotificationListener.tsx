'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { sound } from '@/lib/sound'

function NotificationListenerInner() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const toastCode = searchParams.get('toast')
    const errorMsg = searchParams.get('error')
    const customMsg = searchParams.get('msg')

    if (!toastCode && !errorMsg) return

    if (errorMsg) {
      sound.playError()
      toast.error(decodeURIComponent(errorMsg))
    } else if (toastCode) {
      sound.playSuccess()
      switch (toastCode) {
        case 'logged_in':
          toast.success('Logged in successfully! Welcome back.')
          break
        case 'logged_out':
          toast.info('Logged out successfully.')
          break
        case 'signup_success':
          toast.success('Account created successfully!')
          break
        case 'profile_completed':
          toast.success('Profile setup complete! Welcome to Micro Community.')
          break
        case 'community_created':
          toast.success('Community created successfully!')
          break
        case 'community_deleted':
          toast.info('Community was deleted.')
          break
        case 'event_created':
          toast.success('Event scheduled successfully!')
          break
        case 'custom':
          if (customMsg) {
            toast.success(decodeURIComponent(customMsg))
          }
          break
        default:
          toast.success('Action completed successfully!')
          break
      }
    }

    // Clean URL without causing page reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete('toast')
      url.searchParams.delete('error')
      url.searchParams.delete('msg')
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash)
    }
  }, [searchParams])

  return null
}

export default function NotificationListener() {
  return (
    <Suspense fallback={null}>
      <NotificationListenerInner />
    </Suspense>
  )
}
