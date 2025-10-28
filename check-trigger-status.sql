-- Check trigger status and enable it if needed

-- Check if trigger is enabled
SELECT 
  tgname AS trigger_name,
  tgenabled,
  CASE tgenabled
    WHEN 'O' THEN 'Enabled ✅'
    WHEN 'D' THEN 'Disabled ❌'
    WHEN 'A' THEN 'Replica'
    WHEN 'R' THEN 'Always'
    ELSE 'Unknown'
  END AS status,
  tgrelid::regclass AS table_name
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- Enable trigger if disabled
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

-- Verify it's enabled
SELECT 
  tgname AS trigger_name,
  CASE tgenabled
    WHEN 'O' THEN '✅ Enabled'
    WHEN 'D' THEN '❌ Disabled'
    ELSE 'Unknown'
  END AS status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Trigger status checked';
  RAISE NOTICE '✅ Try creating a new user now';
END $$;

