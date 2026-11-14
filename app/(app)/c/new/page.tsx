import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CommunityForm from './CommunityForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create a community',
  description: 'Start a new micro-community to gather people around shared ideas and discussions.',
}

export default async function NewCommunityPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/c/new')
  }

  return (
    <div className="page page-wide space-y-6">
      <header>
        <h1 className="page-title">Create a community</h1>
        <p className="page-subtitle">
          A space for discussions, events and collaborative posts.
        </p>
      </header>

      <CommunityForm />
    </div>
  )
}
