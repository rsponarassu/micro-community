import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Home page — redirect to discover or feed
export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check if profile is complete
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  if (!profile?.username) {
    redirect('/onboarding')
  }

  // Redirect to discover as default home
  redirect('/discover')
}
