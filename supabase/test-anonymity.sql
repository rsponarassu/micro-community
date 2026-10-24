-- =============================================================
-- ANONYMITY PROOF TEST
-- Run AFTER schema.sql to verify that anonymous authors are
-- properly hidden from client queries.
-- =============================================================
-- Expected results:
--   • Named post    → author fields populated
--   • Anon post     → author_id, author_username, etc. are NULL
--   • posts base    → user_id is always visible (server only)
-- =============================================================

-- Step 1: Create a test user in profiles (use a real auth.uid if testing interactively)
-- This test uses a synthetic UUID as a stand-in.
DO $$
DECLARE
  v_user_id    UUID := '00000000-0000-0000-0000-000000000001';
  v_community  UUID;
  v_post_named UUID;
  v_post_anon  UUID;
BEGIN
  -- Ensure test user exists in auth.users first (required by FK constraint on profiles.id)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'anon_test_user@example.com',
    crypt('Password123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Test User"}',
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- Insert/update test profile
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (v_user_id, 'testuser_anon_check', 'Test User')
  ON CONFLICT (id) DO UPDATE SET username = 'testuser_anon_check';

  -- Insert test community
  INSERT INTO public.communities (id, name, slug, created_by)
  VALUES (
    '00000000-0000-0000-0000-000000000010',
    'Anonymity Test Community',
    'anon-test-community',
    v_user_id
  ) ON CONFLICT (id) DO NOTHING;

  v_community := '00000000-0000-0000-0000-000000000010';

  -- Add user as member
  INSERT INTO public.community_members (community_id, user_id, role, status)
  VALUES (v_community, v_user_id, 'owner', 'active')
  ON CONFLICT DO NOTHING;

  -- Named post
  INSERT INTO public.posts (id, community_id, user_id, content, is_anonymous)
  VALUES (
    '00000000-0000-0000-0000-000000000020',
    v_community, v_user_id,
    'This is a named post. Author should be visible.',
    FALSE
  ) ON CONFLICT (id) DO NOTHING;

  -- Anonymous post
  INSERT INTO public.posts (id, community_id, user_id, content, is_anonymous)
  VALUES (
    '00000000-0000-0000-0000-000000000021',
    v_community, v_user_id,
    'This is an anonymous post. Author should be NULL.',
    TRUE
  ) ON CONFLICT (id) DO NOTHING;

END $$;

-- =============================================================
-- PROOF QUERIES — run each and check results
-- =============================================================

-- Test A: Via public VIEW — author fields should be NULL for anon post
SELECT
  id,
  content,
  is_anonymous,
  author_id,
  author_username,
  author_display_name
FROM public.posts_public
WHERE id IN (
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000021'
)
ORDER BY is_anonymous;
-- EXPECTED:
--   Named  (is_anonymous=false): author_id = '00000000-...001', author_username = 'testuser_anon_check'
--   Anon   (is_anonymous=true) : author_id = NULL,              author_username = NULL

-- Test B: Via base table — user_id is always visible (server-side only, RLS blocked for anon clients)
SELECT id, content, is_anonymous, user_id
FROM public.posts
WHERE id IN (
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000021'
)
ORDER BY is_anonymous;
-- EXPECTED: user_id is always '00000000-...001' in both rows (base table is not client-accessible)

-- Test C: Verify client cannot select user_id from posts directly via anon key
-- (Run this from the Supabase API or client SDK as an anonymous/unauthenticated user)
-- SELECT user_id FROM public.posts LIMIT 1;
-- EXPECTED: Error — "permission denied for table posts" (RLS blocks it)

-- =============================================================
-- CLEANUP TEST DATA (run after verification)
-- =============================================================
-- DELETE FROM public.posts WHERE id IN ('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000021');
-- DELETE FROM public.community_members WHERE community_id = '00000000-0000-0000-0000-000000000010';
-- DELETE FROM public.communities WHERE id = '00000000-0000-0000-0000-000000000010';
-- DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001';
