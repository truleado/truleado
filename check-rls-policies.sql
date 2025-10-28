-- Check Row Level Security policies that might block trigger

-- 1. Check if profiles table has RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity AS has_rls,
  CASE rowsecurity
    WHEN true THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END AS rls_status
FROM pg_tables
WHERE tablename = 'profiles' AND schemaname = 'public';

-- 2. Check RLS policies on profiles table
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 3. Check if service_role can bypass RLS
-- The trigger runs with SECURITY DEFINER, so it should bypass RLS
-- But let's verify

-- 4. Check trigger function permissions
SELECT 
  p.proname AS function_name,
  p.prosecdef AS is_security_definer,
  CASE p.prosecdef
    WHEN true THEN '✅ Security Defin appears'
    ELSE '❌ Not Security Defin appears'
  END AS security_status
FROM pg_proc p
WHERE p.proname = 'handle_new_user';

-- If RLS is blocking, we need to add a policy or disable RLS for the trigger
-- The SECURITY DEFINER should handle this, but let's check

