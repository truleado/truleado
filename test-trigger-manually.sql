-- Test trigger manually to see what's happening

-- Step 1: See what happens when we try to insert
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Try to create a profile manually
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
    test_user_id,
    'test@example.com',
    'Test User',
    'trial',
    NOW() + INTERVAL '7 days',
    1,
    NOW(),
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ Manual insert successful!';
  
  -- Clean up
  DELETE FROM public.profiles WHERE id = test_user_id;
  RAISE NOTICE '✅ Test profile deleted';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Error: %', SQLERRM;
END $$;

-- Step 2: Check if trigger function has proper permissions
SELECT 
  proname,
  prosecdef,  -- Should be true for SECURITY DEFINER
  prosecurity AS is_security_definer
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Step 3: Check the actual function code
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';

