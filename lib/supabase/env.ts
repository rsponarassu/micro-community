/**
 * Validates and provides fallback for Supabase environment variables.
 *
 * Callers pass `process.env.NEXT_PUBLIC_*` as a static member expression
 * so Next.js can inline the value into client bundles.
 */

const FALLBACK_URL = 'https://demo-community.supabase.co'
const FALLBACK_KEY = 'demo-anon-key-preview-mode'

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return Boolean(
    url &&
    key &&
    !url.includes('YOUR_PROJECT_REF') &&
    !url.includes('demo-community') &&
    url.startsWith('https://')
  )
}

export function requireEnv(name: string, value: string | undefined): string {
  if (!value || value.includes('YOUR_PROJECT_REF')) {
    if (name.includes('URL')) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Supabase Config Warning] Missing or placeholder ${name}. Running in demo/preview mode.`)
      }
      return FALLBACK_URL
    }
    if (name.includes('KEY')) {
      return FALLBACK_KEY
    }
    return ''
  }
  return value
}
