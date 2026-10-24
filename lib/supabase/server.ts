import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
// Database generic is added back in M2 once `supabase gen types` produces real types.

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

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method is called from a Server Component.
            // This can be ignored if there's proxy.ts refreshing user sessions.
          }
        },
      },
    }
  )
}
