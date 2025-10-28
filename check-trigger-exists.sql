-- Check if the user profile trigger exists
-- Run this in Supabase SQL Editor

SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  tgenabled,
  tgtype
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- Also check if the function exists
SELECT 
  proname AS function_name,
  prosrc AS function_code
FROM pg_proc
WHERE proname = 'handle_new_user';

