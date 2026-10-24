# Micro-Community Platform 🌐

A modern, high-performance community platform built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **Supabase (PostgreSQL & Storage)**.

Featuring strict anonymity controls, real-time threaded discussions, community group management, event RSVPs with calendar exports, and comprehensive moderation workflows.

---

## ⚡ Tech Stack & Architecture

- **Framework**: Next.js 16.2.2 (App Router with Turbopack)
- **UI & Runtime**: React 19, Server Components & Server Actions (`useActionState`, Zod validation)
- **Database & Auth**: Supabase (`@supabase/ssr` with async `cookies()`)
- **Styling**: Tailwind CSS v4 + Vanilla CSS Custom Properties design system with light/dark theme switching
- **Icons & Primitives**: Lucide Icons, Sonner Toasts
- **Realtime**: Supabase Postgres Changes subscriptions

---

## 🔒 Anonymity Architecture

The platform provides mathematically and architecturally guaranteed anonymity:

1. **Dedicated Public Views**: Client components and browser queries **never** touch the `posts` or `comments` base tables. They query `posts_public` and `comments_public` views.
2. **Column Stripping**: Whenever `is_anonymous = true`, PostgreSQL nullifies `author_id`, `author_username`, `author_display_name`, and `author_avatar_url` before sending data to the client.
3. **Security-Definer RPCs**: Deletions and reactions execute through security-definer database functions (`delete_own_post`, `toggle_reaction`), verifying ownership internally on the server.
4. **Audit-Logged Moderation**: Community moderators can escalate severe abuse via `unmask_post_author`, which writes an irreversible audit entry to `audit_log`.

---

## 🚀 Key Features

### 1. Communities (`/c/[slug]`)
- **Discovery Hub**: Filter groups by category (Technology, Business, Design, Fitness, Academic, etc.) and search by keywords.
- **Privacy Controls**: Public communities with instant join vs. Private communities requiring moderator approval.
- **Community Shell**: Dedicated tabs for Feed, Events, Directory of Members with role badges (Owner, Mod, Member), About & Guidelines, and Admin Dashboard.

### 2. Posts & Feeds
- **Rich Post Creation**: Text up to 5,000 characters, image uploads to `post-images` bucket, and one-click Anonymous toggle.
- **Optimistic Reaction Bar**: 6 emoji reactions (`👍`, `❤️`, `😂`, `😮`, `😢`, `😡`) with instant client feedback.
- **Post Management**: Pin/unpin posts, moderation flags, and safe deletions.

### 3. Threaded Discussions & Realtime
- **1-Level Nested Replies**: Conversational threading with timestamps and author avatars.
- **Anonymous Replies**: Members can comment openly or choose anonymity per-comment.
- **Realtime Sync**: Comments update instantly across connected browser tabs using Supabase Realtime channels.

### 4. Events & Calendar Integration (`/events`)
- **Schedule Meetups**: In-person address or virtual meeting URL (Google Meet, Zoom, Discord).
- **RSVP Tracking**: Track Going / Interested counters with automatic capacity limits.
- **Google Calendar & .ics Export**: One-click "Add to Google Calendar" link and RFC 5545 `.ics` file download.

### 5. Moderation & Safety
- **Report Modal**: Flag posts or comments with categories (spam, harassment, hate speech, etc.).
- **Admin Queue**: Review reports, hide offensive content, approve/decline join requests, and manage roles.
- **Rate Limiting**: Automated server-side posting limits preventing flood spam.

---

## 🛠️ Local Development

### 1. Prerequisites
- Node.js 20+
- A Supabase project

### 2. Environment Variables
Create `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Database Migration
1. Open your Supabase SQL Editor:
   👉 `https://supabase.com/dashboard/project/<project-id>/sql/new`
2. Run [`supabase/schema.sql`](./supabase/schema.sql) (creates tables, views, RLS policies, storage buckets).
3. Run [`supabase/seed.sql`](./supabase/seed.sql) (loads sample communities, posts, and demo accounts).
4. Run [`supabase/test-anonymity.sql`](./supabase/test-anonymity.sql) to verify anonymity enforcement.

### 4. Install & Run
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Validation

```bash
# Run ESLint (0 errors, 0 warnings enforced)
npm run lint

# Build production bundle
npm run build
```
