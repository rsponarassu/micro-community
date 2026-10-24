-- =============================================================
-- AUTO-CONFIRM USERS & DEV AUTH HELPER
-- =============================================================
-- Run this in your Supabase SQL Editor to:
-- 1. Automatically confirm all existing users
-- 2. Automatically confirm all future users upon signup
--    (removes the "Email not confirmed" error during development)
-- =============================================================

-- 1. Confirm all existing users in auth.users
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email_confirmed_at IS NULL;

-- 2. Create trigger to auto-confirm new signups
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

-- Verification notice
SELECT 
  id, 
  email, 
  email_confirmed_at, 
  created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;
