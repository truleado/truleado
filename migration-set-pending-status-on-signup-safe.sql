-- Migration to set new users to 'pending' status instead of 'trial'
-- This ensures users must complete checkout before accessing the app
-- SAFE VERSION: Handles missing columns and constraint updates

-- Step 1: Ensure all required columns exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'pending';

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_count INTEGER DEFAULT 1;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_trial_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 2: Drop existing CHECK constraint on subscription_status if it exists
-- (This allows 'pending' status)
DO $$ 
BEGIN
  -- Drop constraint if it exists and doesn't allow 'pending'
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name LIKE '%subscription_status%' 
    AND table_name = 'profiles'
    AND constraint_type = 'CHECK'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
  END IF;
END $$;

-- Step 3: Drop and recreate the trigger function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 4: Create the function with 'pending' status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
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
    NEW.id, 
    COALESCE(NEW.email, ''), 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User'),
    'pending',  -- User must complete checkout before accessing app
    NOW() + INTERVAL '7 days',  -- Will be updated after checkout
    1,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 5: Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- Step 7: Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile with pending status. User must complete checkout to start trial.';

-- Step 8: Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Trigger updated: New users will have pending status';
  RAISE NOTICE '✅ Users must complete checkout before accessing the app';
  RAISE NOTICE '✅ All required columns verified';
END $$;

