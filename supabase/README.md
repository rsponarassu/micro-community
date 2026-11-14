# Supabase Database Setup & Schema Guide

This directory contains the database migration scripts, seeds, and test suites for the **Micro-Community Platform**.

---

## 1. Apply Schema (`schema.sql`)

1. Open your Supabase project's SQL Editor:
   👉 **`https://supabase.com/dashboard/project/<your-project-ref>/sql/new`**
2. Copy the entire contents of [`supabase/schema.sql`](./schema.sql).
3. Paste into the SQL editor and click **Run**.
4. Expected result: `Success. No rows returned`.

> [!NOTE]
> `schema.sql` is completely idempotent. It uses `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, and `DROP POLICY IF EXISTS`. It will not drop or erase any existing tables or rows.

### Tables Created / Upgraded:
- `profiles` — User profile metadata linked to `auth.users`
- `communities` — Community groups with slugs, categories, avatars, privacy settings
- `community_members` — Community memberships with roles (`owner`, `moderator`, `member`) and statuses (`active`, `pending`, `banned`)
- `posts` — Base posts table (contains `is_anonymous`, `is_pinned`, `is_hidden`)
- `comments` — Threaded comments with parent/child replies and `is_anonymous`
- `reactions` — Post reactions (`like`, `love`, `laugh`, `wow`, `sad`, `angry`)
- `events` — Community events with datetime, location, online URL, capacity
- `event_rsvps` — Event attendance status (`going`, `interested`, `not_going`)
- `notifications` — In-app activity notifications with JSON payload
- `reports` — Content moderation reports queue
- `audit_log` — Moderation and safety action audit trail

### Key Views & RPCs:
- `posts_public` & `comments_public` — Views that strip `user_id`, `username`, `display_name`, and `avatar_url` whenever `is_anonymous = true`.
- `delete_own_post(p_post_id)` — Anonymity-safe deletion via server RPC.
- `toggle_reaction(p_post_id, p_type)` — Atomic reaction toggler.
- `unmask_post_author(p_post_id, p_community_id)` — Moderator audit-logged RPC for unmasking bad actors.

### Storage Buckets Created:
- `avatars` (5MB limit, images only)
- `post-images` (10MB limit, images only)
- `community-media` (10MB limit, images only)

---

## 2. Seed Initial Data (`seed.sql`)

1. Open a new query tab in SQL Editor:
   👉 **`https://supabase.com/dashboard/project/<your-project-ref>/sql/new`**
2. Copy the contents of [`supabase/seed.sql`](./seed.sql).
3. Paste and click **Run**.
4. This will populate:
   - 6 Demo users (`alex_dev`, `sarah_ux`, `marcus_builds`, `elena_runs`, `jordan_ai`, `priya_codes`)
   - 4 Communities (`nextjs-builders`, `founders-circle`, `design-craft`, `urban-runners`)
   - 20 realistic posts (including anonymous posts)
   - Nested comments and reactions
   - 6 upcoming and past events with RSVPs

> [!TIP]
> Demo user passwords for all 6 accounts: `Password123!`

---

## 3. Verify Anonymity Guarantees (`test-anonymity.sql`)

1. In the Supabase SQL Editor, run [`supabase/test-anonymity.sql`](./test-anonymity.sql).
2. Check the output of **Test A**:
   - For `is_anonymous = FALSE`: `author_id` and `author_username` are visible.
   - For `is_anonymous = TRUE`: `author_id` and `author_username` are `NULL`.
3. Check the output of **Test B**:
   The base `posts` table stores `user_id` strictly on the server for moderation and DB integrity. `posts_public` is a `security_invoker` view, so the caller's RLS policies on `posts` still apply to every row, while the anonymous author columns are already `NULL` by the time the row leaves the database.

---

## 4. Generate TypeScript Database Types

Once the schema has been applied to Supabase, run the following command in your terminal from the project root, replacing the project ref with your own:

```powershell
npx supabase gen types typescript --project-id <your-project-ref> > lib/supabase/types.ts
```

If you are not logged in with the Supabase CLI, you can log in first via:
```powershell
npx supabase login
```
Or directly export types from the Supabase dashboard:
**Project Settings → API → Export TypeScript Types** and save to `lib/supabase/types.ts`.
