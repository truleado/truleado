-- Test if the trigger function works when called directly

-- First, let's see what data we can access from auth.users
DO $$
DECLARE
  test_id UUID := '00000000-0000-0000-0000-000000000001';
  test_email TEXT := 'trigger-test@example.com';
  test_name TEXT := 'Test User';
BEGIN
  -- Try to manually call the trigger function logic
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
  VALUES (
    test_id,
    test_email,
    test_name,
    'trial',
    NOW() + INTERVAL '7 days',
    1,
    NOW(),
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ Manual insert successful - profiles table is accessible';
  
  -- Clean up
  DELETE FROM public.profiles WHERE id = test_id;
  RAISE NOTICE '✅ Cleanup complete';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Error inserting profile: %', SQLERRM;
  RAISE NOTICE 'This suggests an issue with the profiles table or permissions';
END $$;

