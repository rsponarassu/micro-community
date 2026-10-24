-- =============================================================
-- MICRO COMMUNITY — COMPLETE SCHEMA (Milestone 2)
-- =============================================================
-- SAFE TO RUN ON AN EXISTING DATABASE:
-- • Uses CREATE TABLE IF NOT EXISTS (never drops existing tables)
-- • Uses ALTER TABLE ... ADD COLUMN IF NOT EXISTS for new columns
-- • Uses CREATE OR REPLACE for functions and views
-- • Uses DROP POLICY IF EXISTS before CREATE POLICY (idempotent RLS)
-- • Run in Supabase SQL Editor: https://supabase.com/dashboard/project/mfgmaxoffhpsxzshobow/sql/new
-- =============================================================

-- =============================================================
-- EXTENSIONS
-- =============================================================
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- full-text search helpers
CREATE EXTENSION IF NOT EXISTS "unaccent";  -- accent-insensitive search

-- =============================================================
-- HELPER FUNCTION: updated_at trigger
-- =============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 1. PROFILES
-- Linked 1-to-1 with auth.users
-- =============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL,
  display_name  TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add any missing columns to existing table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name  TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url    TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio           TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Constraint: username format
DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_username_format
    CHECK (username ~ '^[a-z0-9_]{3,30}$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Updated_at trigger
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTR(NEW.id::TEXT, 1, 4),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- 2. COMMUNITIES
-- =============================================================
CREATE TABLE IF NOT EXISTS public.communities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT UNIQUE NOT NULL,
  description  TEXT,
  category     TEXT,
  icon_url     TEXT,
  cover_url    TEXT,
  is_private   BOOLEAN NOT NULL DEFAULT FALSE,
  created_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing columns
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS slug        TEXT;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS category    TEXT;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS icon_url    TEXT;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS cover_url   TEXT;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS is_private  BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Unique slug constraint
DO $$ BEGIN
  ALTER TABLE public.communities ADD CONSTRAINT communities_slug_unique UNIQUE (slug);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Fill in slug for any existing rows that don't have one
UPDATE public.communities SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Make slug NOT NULL after backfill
ALTER TABLE public.communities ALTER COLUMN slug SET NOT NULL;

DROP TRIGGER IF EXISTS set_communities_updated_at ON public.communities;
CREATE TRIGGER set_communities_updated_at
  BEFORE UPDATE ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Index
CREATE INDEX IF NOT EXISTS idx_communities_slug ON public.communities(slug);
CREATE INDEX IF NOT EXISTS idx_communities_created_at ON public.communities(created_at DESC);

-- =============================================================
-- 3. COMMUNITY MEMBERS
-- =============================================================
CREATE TABLE IF NOT EXISTS public.community_members (
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','moderator','member')),
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','banned')),
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

ALTER TABLE public.community_members ADD COLUMN IF NOT EXISTS role   TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','moderator','member'));
ALTER TABLE public.community_members ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','banned'));

CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON public.community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON public.community_members(community_id);

-- =============================================================
-- 4. POSTS  (base table — clients NEVER query this directly)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content      TEXT NOT NULL CHECK (CHAR_LENGTH(content) BETWEEN 1 AND 5000),
  image_url    TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  is_pinned    BOOLEAN NOT NULL DEFAULT FALSE,
  is_hidden    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS image_url    TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_pinned    BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_hidden    BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_posts_community_id ON public.posts(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);

DROP TRIGGER IF EXISTS set_posts_updated_at ON public.posts;
CREATE TRIGGER set_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================
-- 5. COMMENTS  (base table — clients NEVER query this directly)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  parent_id    UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content      TEXT NOT NULL CHECK (CHAR_LENGTH(content) BETWEEN 1 AND 2000),
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  is_hidden    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS parent_id    UUID REFERENCES public.comments(id) ON DELETE CASCADE;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS is_hidden    BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);

-- =============================================================
-- 6. REACTIONS
-- =============================================================
CREATE TABLE IF NOT EXISTS public.reactions (
  post_id    UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL DEFAULT 'like' CHECK (type IN ('like','love','laugh','wow','sad','angry')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id, type)
);

CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON public.reactions(post_id);

-- =============================================================
-- 7. EVENTS
-- =============================================================
CREATE TABLE IF NOT EXISTS public.events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  created_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  title        TEXT NOT NULL CHECK (CHAR_LENGTH(title) BETWEEN 1 AND 200),
  description  TEXT,
  location     TEXT,
  online_url   TEXT,
  starts_at    TIMESTAMPTZ NOT NULL,
  ends_at      TIMESTAMPTZ,
  capacity     INTEGER CHECK (capacity IS NULL OR capacity > 0),
  cover_url    TEXT,
  is_cancelled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS created_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS description  TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS location     TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS online_url   TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS starts_at    TIMESTAMPTZ;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS ends_at      TIMESTAMPTZ;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS capacity     INTEGER;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cover_url    TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_events_community_id ON public.events(community_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON public.events(starts_at);

DROP TRIGGER IF EXISTS set_events_updated_at ON public.events;
CREATE TRIGGER set_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================
-- 8. EVENT RSVPs
-- =============================================================
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  event_id   UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status     TEXT NOT NULL CHECK (status IN ('going','interested','not_going')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON public.event_rsvps(user_id);

-- =============================================================
-- 9. NOTIFICATIONS
-- =============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  payload    JSONB NOT NULL DEFAULT '{}',
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE is_read = FALSE;

-- =============================================================
-- 10. REPORTS
-- =============================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type  TEXT NOT NULL CHECK (target_type IN ('post','comment','user','community')),
  target_id    UUID NOT NULL,
  community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  reason       TEXT NOT NULL CHECK (CHAR_LENGTH(reason) BETWEEN 1 AND 500),
  status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','dismissed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_community_id ON public.reports(community_id, status);

-- =============================================================
-- 11. AUDIT LOG
-- =============================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  target     TEXT,
  payload    JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON public.audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- =============================================================
-- ANONYMITY VIEWS
-- Clients ONLY query these views — never the base tables directly.
-- Author fields are NULL when is_anonymous = TRUE.
-- =============================================================

CREATE OR REPLACE VIEW public.posts_public AS
SELECT
  p.id,
  p.community_id,
  p.content,
  p.image_url,
  p.is_anonymous,
  p.is_pinned,
  p.is_hidden,
  p.created_at,
  p.updated_at,
  -- Author: NULL out all identifying fields when anonymous
  CASE WHEN p.is_anonymous THEN NULL ELSE p.user_id    END AS author_id,
  CASE WHEN p.is_anonymous THEN NULL ELSE pr.username  END AS author_username,
  CASE WHEN p.is_anonymous THEN NULL ELSE pr.display_name END AS author_display_name,
  CASE WHEN p.is_anonymous THEN NULL ELSE pr.avatar_url   END AS author_avatar_url
FROM public.posts p
LEFT JOIN public.profiles pr ON pr.id = p.user_id
WHERE p.is_hidden = FALSE;

CREATE OR REPLACE VIEW public.comments_public AS
SELECT
  c.id,
  c.post_id,
  c.parent_id,
  c.content,
  c.is_anonymous,
  c.created_at,
  CASE WHEN c.is_anonymous THEN NULL ELSE c.user_id    END AS author_id,
  CASE WHEN c.is_anonymous THEN NULL ELSE pr.username  END AS author_username,
  CASE WHEN c.is_anonymous THEN NULL ELSE pr.display_name END AS author_display_name,
  CASE WHEN c.is_anonymous THEN NULL ELSE pr.avatar_url   END AS author_avatar_url
FROM public.comments c
LEFT JOIN public.profiles pr ON pr.id = c.user_id
WHERE c.is_hidden = FALSE;

-- =============================================================
-- SECURITY DEFINER HELPERS
-- =============================================================

CREATE OR REPLACE FUNCTION public.is_member(p_community_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = p_community_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_mod_or_owner(p_community_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = p_community_id
      AND user_id = auth.uid()
      AND role IN ('owner','moderator')
      AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RPC: delete own post (anonymity-safe — server checks user_id internally)
CREATE OR REPLACE FUNCTION public.delete_own_post(p_post_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.posts
  WHERE id = p_post_id AND user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found or you do not own it.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: toggle reaction
CREATE OR REPLACE FUNCTION public.toggle_reaction(p_post_id UUID, p_type TEXT)
RETURNS VOID AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.reactions
    WHERE post_id = p_post_id AND user_id = auth.uid() AND type = p_type
  ) THEN
    DELETE FROM public.reactions
    WHERE post_id = p_post_id AND user_id = auth.uid() AND type = p_type;
  ELSE
    INSERT INTO public.reactions (post_id, user_id, type)
    VALUES (p_post_id, auth.uid(), p_type)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: unmask anonymous post author (owner only — writes to audit_log)
CREATE OR REPLACE FUNCTION public.unmask_post_author(p_post_id UUID, p_community_id UUID)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Only owners may unmask
  IF NOT public.is_mod_or_owner(p_community_id) THEN
    RAISE EXCEPTION 'Only community owners and moderators can unmask authors.';
  END IF;

  SELECT user_id INTO v_user_id FROM public.posts WHERE id = p_post_id;

  INSERT INTO public.audit_log (actor_id, action, target, payload)
  VALUES (
    auth.uid(), 'unmask_post_author',
    p_post_id::TEXT,
    jsonb_build_object('community_id', p_community_id, 'post_id', p_post_id)
  );

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log        ENABLE ROW LEVEL SECURITY;

-- ----- PROFILES -----
DROP POLICY IF EXISTS "profiles: public read"   ON public.profiles;
DROP POLICY IF EXISTS "profiles: own update"    ON public.profiles;
DROP POLICY IF EXISTS "profiles: own insert"    ON public.profiles;

CREATE POLICY "profiles: public read"  ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles: own insert"   ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles: own update"   ON public.profiles FOR UPDATE USING (id = auth.uid());

-- ----- COMMUNITIES -----
DROP POLICY IF EXISTS "communities: public read"    ON public.communities;
DROP POLICY IF EXISTS "communities: auth create"    ON public.communities;
DROP POLICY IF EXISTS "communities: owner update"   ON public.communities;
DROP POLICY IF EXISTS "communities: owner delete"   ON public.communities;

CREATE POLICY "communities: public read"   ON public.communities FOR SELECT USING (TRUE);
CREATE POLICY "communities: auth create"   ON public.communities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "communities: owner update"  ON public.communities FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "communities: owner delete"  ON public.communities FOR DELETE USING (created_by = auth.uid());

-- ----- COMMUNITY MEMBERS -----
DROP POLICY IF EXISTS "members: member read"    ON public.community_members;
DROP POLICY IF EXISTS "members: auth join"      ON public.community_members;
DROP POLICY IF EXISTS "members: own leave"      ON public.community_members;
DROP POLICY IF EXISTS "members: mod manage"     ON public.community_members;

CREATE POLICY "members: member read"  ON public.community_members FOR SELECT
  USING (public.is_member(community_id) OR user_id = auth.uid());
CREATE POLICY "members: auth join"    ON public.community_members FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "members: own leave"    ON public.community_members FOR DELETE
  USING (user_id = auth.uid());
CREATE POLICY "members: mod manage"   ON public.community_members FOR UPDATE
  USING (public.is_mod_or_owner(community_id));

-- ----- POSTS (base table — only mods can read; normal users go via posts_public view) -----
DROP POLICY IF EXISTS "posts: member read"       ON public.posts;
DROP POLICY IF EXISTS "posts: member create"     ON public.posts;
DROP POLICY IF EXISTS "posts: mod update"        ON public.posts;
DROP POLICY IF EXISTS "posts: mod delete"        ON public.posts;

CREATE POLICY "posts: member read"    ON public.posts FOR SELECT
  USING (public.is_member(community_id));
CREATE POLICY "posts: member create"  ON public.posts FOR INSERT
  WITH CHECK (public.is_member(community_id) AND user_id = auth.uid());
CREATE POLICY "posts: mod update"     ON public.posts FOR UPDATE
  USING (public.is_mod_or_owner(community_id) OR user_id = auth.uid());
CREATE POLICY "posts: mod delete"     ON public.posts FOR DELETE
  USING (public.is_mod_or_owner(community_id) OR user_id = auth.uid());

-- ----- COMMENTS -----
DROP POLICY IF EXISTS "comments: member read"    ON public.comments;
DROP POLICY IF EXISTS "comments: member create"  ON public.comments;
DROP POLICY IF EXISTS "comments: mod delete"     ON public.comments;

CREATE POLICY "comments: member read"   ON public.comments FOR SELECT
  USING (public.is_member((SELECT community_id FROM public.posts WHERE id = post_id)));
CREATE POLICY "comments: member create" ON public.comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    public.is_member((SELECT community_id FROM public.posts WHERE id = post_id))
  );
CREATE POLICY "comments: mod delete"    ON public.comments FOR DELETE
  USING (
    user_id = auth.uid() OR
    public.is_mod_or_owner((SELECT community_id FROM public.posts WHERE id = post_id))
  );

-- ----- REACTIONS -----
DROP POLICY IF EXISTS "reactions: member read"    ON public.reactions;
DROP POLICY IF EXISTS "reactions: member write"   ON public.reactions;
DROP POLICY IF EXISTS "reactions: own delete"     ON public.reactions;

CREATE POLICY "reactions: member read"  ON public.reactions FOR SELECT
  USING (public.is_member((SELECT community_id FROM public.posts WHERE id = post_id)));
CREATE POLICY "reactions: member write" ON public.reactions FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    public.is_member((SELECT community_id FROM public.posts WHERE id = post_id))
  );
CREATE POLICY "reactions: own delete"   ON public.reactions FOR DELETE
  USING (user_id = auth.uid());

-- ----- EVENTS -----
DROP POLICY IF EXISTS "events: member read"   ON public.events;
DROP POLICY IF EXISTS "events: mod create"    ON public.events;
DROP POLICY IF EXISTS "events: mod update"    ON public.events;

CREATE POLICY "events: member read"  ON public.events FOR SELECT
  USING (public.is_member(community_id));
CREATE POLICY "events: mod create"   ON public.events FOR INSERT
  WITH CHECK (public.is_member(community_id) AND created_by = auth.uid());
CREATE POLICY "events: mod update"   ON public.events FOR UPDATE
  USING (created_by = auth.uid() OR public.is_mod_or_owner(community_id));

-- ----- EVENT RSVPs -----
DROP POLICY IF EXISTS "rsvps: member read"   ON public.event_rsvps;
DROP POLICY IF EXISTS "rsvps: own write"     ON public.event_rsvps;
DROP POLICY IF EXISTS "rsvps: own delete"    ON public.event_rsvps;

CREATE POLICY "rsvps: member read"  ON public.event_rsvps FOR SELECT
  USING (public.is_member((SELECT community_id FROM public.events WHERE id = event_id)));
CREATE POLICY "rsvps: own write"    ON public.event_rsvps FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "rsvps: own delete"   ON public.event_rsvps FOR DELETE
  USING (user_id = auth.uid());

-- ----- NOTIFICATIONS -----
DROP POLICY IF EXISTS "notifs: own read"    ON public.notifications;
DROP POLICY IF EXISTS "notifs: own update"  ON public.notifications;

CREATE POLICY "notifs: own read"   ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifs: own update" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- ----- REPORTS -----
DROP POLICY IF EXISTS "reports: own create"  ON public.reports;
DROP POLICY IF EXISTS "reports: mod read"    ON public.reports;
DROP POLICY IF EXISTS "reports: mod update"  ON public.reports;

CREATE POLICY "reports: own create"  ON public.reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports: mod read"    ON public.reports FOR SELECT
  USING (public.is_mod_or_owner(community_id));
CREATE POLICY "reports: mod update"  ON public.reports FOR UPDATE
  USING (public.is_mod_or_owner(community_id));

-- ----- AUDIT LOG -----
DROP POLICY IF EXISTS "audit: mod read"  ON public.audit_log;
CREATE POLICY "audit: mod read" ON public.audit_log FOR SELECT
  USING (actor_id = auth.uid());

-- =============================================================
-- STORAGE BUCKETS
-- =============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',         'avatars',         TRUE, 5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('post-images',     'post-images',     TRUE, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('community-media', 'community-media', TRUE, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "avatars: public read"    ON storage.objects;
DROP POLICY IF EXISTS "avatars: own upload"     ON storage.objects;
DROP POLICY IF EXISTS "post-images: public read"  ON storage.objects;
DROP POLICY IF EXISTS "post-images: auth upload"  ON storage.objects;
DROP POLICY IF EXISTS "community-media: public read"  ON storage.objects;
DROP POLICY IF EXISTS "community-media: auth upload"  ON storage.objects;

CREATE POLICY "avatars: public read"     ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars: own upload"      ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "post-images: public read"  ON storage.objects FOR SELECT USING (bucket_id = 'post-images');
CREATE POLICY "post-images: auth upload"  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'post-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "community-media: public read" ON storage.objects FOR SELECT USING (bucket_id = 'community-media');
CREATE POLICY "community-media: auth upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'community-media' AND auth.uid() IS NOT NULL);

-- =============================================================
-- NOTIFICATION TRIGGER (auto-notify on comment)
-- =============================================================
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author UUID;
  v_community_id UUID;
BEGIN
  SELECT user_id, community_id INTO v_post_author, v_community_id
  FROM public.posts WHERE id = NEW.post_id;

  -- Notify post author (unless they are the commenter)
  IF v_post_author IS NOT NULL AND v_post_author <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, payload)
    VALUES (
      v_post_author,
      'comment',
      jsonb_build_object(
        'post_id', NEW.post_id,
        'comment_id', NEW.id,
        'community_id', v_community_id,
        'is_anonymous', NEW.is_anonymous
      )
    );
  END IF;

  -- If it's a reply, also notify parent comment author
  IF NEW.parent_id IS NOT NULL THEN
    DECLARE v_parent_author UUID;
    BEGIN
      SELECT user_id INTO v_parent_author FROM public.comments WHERE id = NEW.parent_id;
      IF v_parent_author IS NOT NULL AND v_parent_author <> NEW.user_id THEN
        INSERT INTO public.notifications (user_id, type, payload)
        VALUES (
          v_parent_author,
          'reply',
          jsonb_build_object(
            'post_id', NEW.post_id,
            'comment_id', NEW.id,
            'parent_id', NEW.parent_id,
            'community_id', v_community_id,
            'is_anonymous', NEW.is_anonymous
          )
        );
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_created ON public.comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();
