-- =============================================================
-- ONE-CLICK FIX FOR LOGIN & RATE LIMITS
-- =============================================================
-- Copy and paste this into your Supabase SQL Editor and click RUN.
-- This will:
-- 1. Confirm all accounts so you can log in immediately.
-- 2. Create the demo user (alex@microcommunity.com / Password123).
-- 3. Auto-confirm any future signups (bypasses email rate limits).
-- =============================================================

-- Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Auto-confirm all existing users in auth.users
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email_confirmed_at IS NULL;

-- 2. Create or update Demo User (Alex Chen - Owner of Communities)
-- Credentials:
--   Email:    alex@microcommunity.com
--   Password: Password123
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'alex@microcommunity.com',
  crypt('Password123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Alex Chen"}',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE
SET 
  email = 'alex@microcommunity.com',
  encrypted_password = crypt('Password123', gen_salt('bf')),
  email_confirmed_at = now();

-- Ensure profile exists for alex_dev
INSERT INTO public.profiles (id, username, display_name, bio)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'alex_dev',
  'Alex Chen',
  'Full-stack builder & community organizer.'
)
ON CONFLICT (id) DO UPDATE
SET username = 'alex_dev', display_name = 'Alex Chen';

-- 3. Attach auto-confirm trigger for any future signups
CREATE OR REPLACE FUNCTION public.handle_auto_confirm_user()
RETURNS trigger AS $$
BEGIN
  NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_auto_confirm ON auth.users;

CREATE TRIGGER on_auth_user_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auto_confirm_user();

-- 4. Verify demo account is active
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email IN ('alex@microcommunity.com', 'demouser9992@gmail.com');
