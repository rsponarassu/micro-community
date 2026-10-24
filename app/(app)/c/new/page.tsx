import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CommunityForm from './CommunityForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create a Community | Micro Community',
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
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Create a New Community</h1>
        <p className="text-sm text-muted mt-1">
          Create a space for discussions, events, and collaborative posts.
        </p>
      </div>

      <CommunityForm />
    </div>
  )
}
