-- ========================================
-- CREATE USER PROFILE TRIGGER
-- ========================================
-- This SQL script creates the database trigger that automatically
-- creates a profile when a new user signs up
--
-- HOW TO RUN:
-- 1. Go to Supabase Dashboard: https://supabase.com
-- 2. Select your project
-- 3. Go to SQL Editor
-- 4. Click "New Query"
-- 5. Copy and paste this entire file
-- 6. Click "Run" or press Cmd/Ctrl + Enter
-- ========================================

-- Step 1: Drop existing trigger and function (if they exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 2: Create the function that will run when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new profile for the new user
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
    NEW.id,  -- The new user's ID from auth.users
    NEW.email,  -- The new user's email
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),  -- Full name or email as fallback
    'trial',  -- Start with trial status
    NOW() + INTERVAL '7 days',  -- Trial ends in 7 days
    1,  -- Trial count = 1
    NOW(),  -- Current timestamp
    NOW(),  -- created_at
    NOW()   -- updated_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create the trigger that calls the function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users  -- When a new user is added to auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Add a comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile when a new user signs up. Sets up 7-day trial period.';

-- ========================================
-- VERIFICATION
-- ========================================
-- After running this, you can verify it worked by:
-- 1. Checking if the function exists:
--    SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
--
-- 2. Checking if the trigger exists:
--    SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
--
-- 3. Testing by creating a new user account on your app
--    and checking if a profile appears in the profiles table
-- ========================================

-- Success message (visible in Supabase SQL Editor)
DO $$ 
BEGIN 
  RAISE NOTICE '✅ User profile trigger created successfully!';
  RAISE NOTICE '✅ New users will automatically get profiles with 7-day trials';
END $$;

