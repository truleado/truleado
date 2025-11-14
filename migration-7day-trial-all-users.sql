-- Migration to set all existing and new users to 7-day free trial
-- This ensures all users (existing and new) get 7 days of free access

-- Step 1: Update all existing users who don't have an active subscription
-- Give them a 7-day trial starting from now
UPDATE public.profiles 
SET 
  subscription_status = 'trial',
  trial_ends_at = NOW() + INTERVAL '7 days',
  trial_count = COALESCE(trial_count, 1),
  last_trial_at = NOW(),
  updated_at = NOW()
WHERE 
  subscription_status IS NULL 
  OR subscription_status = 'free'
  OR subscription_status = ''
  OR subscription_status = 'expired'
  OR (subscription_status = 'trial' AND (trial_ends_at IS NULL OR trial_ends_at < NOW()));

-- Step 2: Update users who have trial status but trial hasn't ended yet
-- Extend their trial to 7 days from now if it's less than 7 days
UPDATE public.profiles 
SET 
  trial_ends_at = NOW() + INTERVAL '7 days',
  updated_at = NOW()
WHERE 
  subscription_status = 'trial' 
  AND trial_ends_at IS NOT NULL
  AND trial_ends_at > NOW()
  AND trial_ends_at < NOW() + INTERVAL '7 days';

-- Step 3: Update the database trigger function to ensure new users get 7-day trials
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'trial',
    NOW() + INTERVAL '7 days',  -- 7-day free trial
    1,
    NOW(),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile with 7-day free trial when new user signs up';

-- Step 4: Log the migration
INSERT INTO public.subscription_history (
  user_id,
  old_status,
  new_status,
  change_reason,
  created_at
)
SELECT 
  id,
  COALESCE(subscription_status, 'unknown'),
  'trial',
  'migration_7day_trial_all_users',
  NOW()
FROM public.profiles 
WHERE 
  (subscription_status IS NULL 
   OR subscription_status = 'free'
   OR subscription_status = ''
   OR subscription_status = 'expired'
   OR (subscription_status = 'trial' AND (trial_ends_at IS NULL OR trial_ends_at < NOW())))
  AND id NOT IN (
    SELECT user_id FROM public.subscription_history 
    WHERE change_reason = 'migration_7day_trial_all_users'
  );

