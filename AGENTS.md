<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Key Next.js 16 Breaking Changes

| Area | Change |
|------|--------|
| **Middleware** | Renamed to **Proxy** — file is `proxy.ts` NOT `middleware.ts` |
| **Route params** | `params` and `searchParams` are **`Promise<{...}>`** — always `await` them |
| **Cache refresh** | Use `refresh()` from `next/cache` (not `router.refresh()`) |
| **Server Actions** | `useActionState` is in React 19 core (no longer experimental) |
| **Cookies** | `await cookies()` (async) in Server Actions and Server Components |

## Established Conventions (M1)

### Auth & Supabase
- Use `@supabase/ssr` — **never** `@supabase/auth-helpers-nextjs`
- Browser client: `lib/supabase/client.ts` → `createClient()` 
- Server client: `lib/supabase/server.ts` → `await createClient()` (async, uses cookies)
- Route protection via `proxy.ts` (NOT middleware.ts)

### Mutations
- All mutations in `app/actions/*.ts` with `'use server'` at file top
- Validate every input with **Zod** before touching DB
- Return `{ errors: {...} }` for field errors, `{ message: string }` for global errors
- Call `revalidatePath()` then `redirect()` after successful mutations
- Use `useActionState` in client forms for inline error display

### Styling
- Design tokens in `app/globals.css` via CSS custom properties (`--color-brand`, etc.)
- Dark mode via `data-theme="dark"` attribute on `<html>`, toggled by `ThemeToggle.tsx`
- No hardcoded Tailwind color classes for semantic colors — use CSS variables
- Use `cn()` from `lib/utils.ts` to merge class names

### Component Rules
- Server Components for reads; Client Components only for interactivity
- Components ≤ 200 lines — split when approaching limit
- Named exports for UI primitives, default exports for pages/layouts
- No `alert()` anywhere — use Sonner toasts

### Anonymity
- Clients must only query `posts_public` and `comments_public` views
- Never select from `posts` or `comments` base tables on the client
- Author fields return `null` when `is_anonymous = true`
- Edit/delete via security-definer RPCs, not direct DML

### File Structure
- Route groups: `app/(auth)/` for unauth, `app/(app)/` for auth
- Server Actions: `app/actions/auth.ts`, `communities.ts`, `posts.ts`, etc.
- UI primitives: `app/components/ui/`
- Layout components: `app/components/layout/`
- Zod schemas: `lib/validators/`
