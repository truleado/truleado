-- Migration to give all users (new and existing) a 7-day free trial
-- This ensures everyone can use the app for free for 7 days before requiring upgrade

-- Step 1: Give all existing users without active subscriptions a 7-day trial
-- This includes users with no subscription, expired subscriptions, or cancelled subscriptions
UPDATE public.profiles 
SET 
  subscription_status = 'trial',
  trial_ends_at = NOW() + INTERVAL '7 days',
  trial_count = COALESCE(trial_count, 1),
  last_trial_at = COALESCE(last_trial_at, NOW()),
  updated_at = NOW()
WHERE 
  -- Users with no subscription status
  subscription_status IS NULL 
  OR subscription_status = 'free'
  OR subscription_status = ''
  -- Users with expired subscriptions
  OR subscription_status = 'expired'
  OR subscription_status = 'cancelled'
  -- Users with expired trials (give them a new trial)
  OR (subscription_status = 'trial' AND (trial_ends_at IS NULL OR trial_ends_at < NOW()))
  -- Users with past_due subscriptions (give them a trial)
  OR subscription_status = 'past_due';

-- Step 2: Extend active trials to 7 days if they have less than 7 days remaining
UPDATE public.profiles 
SET 
  trial_ends_at = NOW() + INTERVAL '7 days',
  updated_at = NOW()
WHERE 
  subscription_status = 'trial' 
  AND trial_ends_at IS NOT NULL
  AND trial_ends_at > NOW()
  AND trial_ends_at < NOW() + INTERVAL '7 days';

-- Step 3: Ensure the database trigger automatically gives new users a 7-day trial
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
    'trial',  -- All new users start with trial status
    NOW() + INTERVAL '7 days',  -- 7-day free trial
    1,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- Prevent errors if profile already exists
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add comments
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile with 7-day free trial when new user signs up';
COMMENT ON COLUMN public.profiles.trial_ends_at IS 'When the 7-day free trial period ends. Users get full access during trial.';

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: All users (existing and new) now have 7-day free trials';
END $$;

