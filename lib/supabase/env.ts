/**
 * Validates a Supabase environment variable.
 *
 * Callers must pass `process.env.NEXT_PUBLIC_*` as a *static* member expression
 * so Next.js can inline the value into client bundles — a dynamic lookup like
 * `process.env[name]` is left undefined in the browser.
 */
export function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
        `• Local: add it to .env.local (see .env.example) and restart the dev server.\n` +
        `• Deployed: add it in your host's dashboard (Vercel / Render → Environment),\n` +
        `  then redeploy — NEXT_PUBLIC_* values are baked in at build time.`
    )
  }
  return value
}
