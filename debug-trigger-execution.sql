-- Debug: Check if trigger is actually executing

-- 1. Check recent users in auth.users
SELECT 
  au.id,
  au.email,
  au.created_at AS auth_created,
  au.raw_user_meta_data->>'full_name' AS name
FROM auth.users au
ORDER BY au.created_at DESC
LIMIT 5;

-- 2. Check if those users have profiles
SELECT 
  au.id AS user_id,
  au.email AS user_email,
  p.id AS profile_id,
  p.email AS profile_email,
  CASE 
    WHEN p.id IS NOT NULL THEN '✅ Profile exists'
    ELSE '❌ Profile missing'
  END AS status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC
LIMIT 5;

-- 3. Check trigger function for any errors
SELECT 
  p.proname,
  p.prosrc AS function_body
FROM pg_proc p
WHERE p.proname = 'handle_new_user';

-- 4. See if there are any failed executions (if logs exist)
-- This helps identify why trigger isn't working

