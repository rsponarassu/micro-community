import { createBrowserClient } from '@supabase/ssr'
import { requireEnv } from './env'
// Database generic is added back in M2 once `supabase gen types` produces real types.
// Using it with placeholder types causes partial-select inference to return `never`.

export function createClient() {
  return createBrowserClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  )
}
