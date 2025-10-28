-- TEST: Manually create a profile for an existing user
-- This helps debug if trigger is missing or broken

-- First, check if a specific user exists in auth.users but not in profiles
-- Run this to find a user without a profile:

SELECT 
  au.id AS user_id,
  au.email,
  au.created_at AS auth_created,
  p.id AS profile_id,
  p.email AS profile_email
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
LIMIT 5;

-- To manually create a profile for a specific user (replace USER_ID_HERE with actual ID):
/*
INSERT INTO public.profiles (
  id, 
  email, 
  full_name,
  subscription_status,
  trial_ends_at,
  trial_count,
  last_trial_at,
  created_at,
  updated_at
)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email) AS full_name,
  'trial',
  NOW() + INTERVAL '7 days',
  1,
  NOW(),
  NOW(),
  NOW()
FROM auth.users
WHERE id = 'USER_ID_HERE' -- Replace with actual user ID
  AND id NOT IN (SELECT id FROM public.profiles);

*/

