import { createBrowserClient } from '@supabase/ssr'
// Database generic is added back in M2 once `supabase gen types` produces real types.
// Using it with placeholder types causes partial-select inference to return `never`.

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
        `Add it to your .env.local file. See .env.example for reference.`
    )
  }
  return value
}

export function createClient() {
  return createBrowserClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  )
}
