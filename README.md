# Micro-Community Platform

**Anonymity-first communities for small groups** — threaded discussions, RSVP'd events, and a moderation queue that never leaks who said what.

Built with Next.js 16 App Router, React 19, Tailwind CSS v4, and Supabase.

![Next.js](https://img.shields.io/badge/Next.js-16.2-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19.2-087EA4?logo=react&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)

<!--
  After the first CI run, uncomment the badge below and replace OWNER/REPO.
  ![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)
-->

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Database setup](#database-setup)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

**Communities**

- Public communities with instant join, or private ones gated behind moderator approval
- Category browsing and keyword search
- Per-community shell: Feed, Events, Members directory, About & Guidelines, Admin dashboard
- Role hierarchy — owner / moderator / member — with request queues and role management

**Posts & discussions**

- Posts up to 5,000 characters with image uploads
- Per-post and per-comment anonymous toggle
- Six emoji reactions with optimistic UI
- One level of threaded replies, live-synced across tabs via Supabase Realtime
- Pin, hide, and delete with owner/moderator permission checks

**Events**

- In-person address or virtual meeting URL
- Going / Interested RSVP with capacity limits
- One-click Google Calendar link and RFC 5545 `.ics` download

**Moderation & safety**

- Report queue for posts and comments (spam, harassment, hate speech, and more)
- Content hiding, join-request review, and role changes from the admin dashboard
- Audit-logged author unmasking — every lookup is recorded
- Server-side rate limiting on post creation

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16.2 (App Router, Turbopack) |
| UI runtime | React 19 — Server Components, Server Actions, `useActionState` |
| Styling | Tailwind CSS v4 with a `@theme` design-token layer and `[data-theme]` dark mode |
| Database & auth | Supabase (PostgreSQL, GoTrue, Storage) via `@supabase/ssr` |
| Validation | Zod 4, validating every server action at the boundary |
| Icons & feedback | Lucide React, Sonner toasts |
| Language | TypeScript (strict) |

---

## Quick start

**Prerequisites:** Node.js 20.9+ and a Supabase project ([free tier](https://supabase.com) is enough).

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local   # then fill in your Supabase keys

# 3. Apply the database schema
#    Supabase Dashboard → SQL Editor → paste supabase/schema.sql → Run

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to `/login` and then `/onboarding` to claim a username.

---

## Environment variables

All three are required. Copy [`.env.example`](./.env.example) to `.env.local` — that file is gitignored, never commit it.

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project URL — Supabase Dashboard → **Project Settings → API** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key — same page. Safe to expose; all access is guarded by RLS |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public origin, no trailing slash. Used to build email-confirmation and password-reset links |

`.env.local` is read by Next.js only; `.env.example` is the committed template.

---

## Database setup

Everything lives in [`supabase/`](./supabase) — see [`supabase/README.md`](./supabase/README.md) for the full guide.

| File | Purpose |
| --- | --- |
| [`supabase/schema.sql`](./supabase/schema.sql) | Tables, views, RPCs, RLS policies, storage buckets. **Idempotent** — safe to re-run after every change |
| [`supabase/seed.sql`](./supabase/seed.sql) | Demo users, 4 communities, 20 posts, comments, and events |
| [`supabase/test-anonymity.sql`](./supabase/test-anonymity.sql) | Assertions that anonymous authors are actually stripped from the public views |

Run `schema.sql` in the Supabase SQL Editor. Re-run it whenever you pull changes that touch the database — the app expects the `security_invoker` views and RLS policies from that file.

To regenerate TypeScript types after a schema change:

```bash
npx supabase gen types typescript --project-id <your-project-ref> > lib/supabase/types.ts
```

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint over the whole project |
| `npm run lint:fix` | ESLint with autofix |
| `npm run typecheck` | `tsc --noEmit` |

CI runs `lint`, `typecheck`, and `build` on every push and pull request — see [`.github/workflows/ci.yml`](./.github/workflows/ci.yml).

---

## Project structure

```
app/
├── (app)/                     # Authenticated shell — shares sidebar + topbar
│   ├── page.tsx               # Home feed
│   ├── c/[slug]/              # Community: feed, events, members, about, admin
│   ├── c/new/                 # Create community
│   ├── discover/              # Browse and search communities
│   ├── events/                # Cross-community events
│   ├── notifications/
│   ├── search/                # Communities, posts, and people
│   ├── settings/              # Profile, avatar, appearance
│   └── u/[username]/          # Public profile
├── (auth)/                    # Login, signup, password reset
├── actions/                   # Server Actions — the only write path
├── api/events/[id]/ics/       # .ics calendar export
├── auth/callback/             # Supabase email-confirmation exchange
└── components/                # UI primitives, layout, feed, and form components
lib/
├── supabase/                  # Browser client, server client, generated types
├── feed.ts                    # Shared post-metadata loader (reactions, counts)
└── utils.ts
supabase/                      # schema.sql, seed.sql, anonymity tests
proxy.ts                       # Route guard (auth redirects, static-file passthrough)
```

---

## How it works

### Anonymity is enforced in the database, not the UI

1. **Dedicated public views.** Client components never read the `posts` or `comments` base tables. They read `posts_public` and `comments_public`.
2. **Column stripping.** When `is_anonymous = true`, those views return `NULL` for `author_id`, `author_username`, `author_display_name`, and `author_avatar_url`. The browser cannot resolve the author because the value was never sent.
3. **Security-definer RPCs.** Deletion and reaction toggling go through `delete_own_post` and `toggle_reaction`, which verify ownership inside the database.
4. **Audited unmasking.** Moderators can call `unmask_post_author`, which writes an irreversible `audit_log` record of who looked up whom.

### Every write is a Server Action

No client component talks to Supabase for mutations. Actions in `app/actions/*` validate input with Zod, resolve the session, enforce permissions, write, then `revalidatePath` only the surfaces that changed.

### Design tokens live in `@theme`, not `:root`

Tailwind v4 generates utilities **only** from variables declared inside the `@theme` block. Tokens declared in a plain `:root` block produce no `bg-*` / `text-*` classes at all — the class names exist in your components and silently do nothing. Dark mode overrides the same `--color-*` names under `[data-theme='dark']`, so one token set drives both themes. If a utility like `bg-surface` stops working, check that its variable is inside `@theme` first.

---

## Deployment

The app deploys to [Vercel](https://vercel.com/new) with no extra configuration.

1. Push the repository to GitHub and import it into Vercel.
2. Add the three `NEXT_PUBLIC_*` variables under **Settings → Environment Variables**, with `NEXT_PUBLIC_SITE_URL` set to your production origin (e.g. `https://your-app.vercel.app`).
3. In Supabase, open **Authentication → URL Configuration** and set:
   - **Site URL** — your production origin
   - **Redirect URLs** — `https://your-app.vercel.app/auth/callback` and `https://your-app.vercel.app/reset-password`
4. Run `supabase/schema.sql` against the production project if you haven't already.

---

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL` | `.env.local` is absent or empty. Copy `.env.example` and fill it in, then restart the dev server |
| Feeds and search return nothing while the database has rows | RLS is missing or stale. Re-run `supabase/schema.sql` |
| Utilities like `bg-surface` or `text-muted` have no effect | The token is not declared inside `@theme` in `app/globals.css` |
| Build fails with `Module not found` after a pull | Dependencies changed. Run `npm install` |
| Password reset or confirmation emails link to `localhost` | `NEXT_PUBLIC_SITE_URL` is wrong, or the URL isn't in Supabase's redirect allowlist |

---

## License

Copyright © 2026. All rights reserved.

`package.json` declares `"license": "UNLICENSED"` and `"private": true`. This is a personal project — add a `LICENSE` file before publishing it under an open-source license.
