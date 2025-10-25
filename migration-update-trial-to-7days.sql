-- Migration to update trial period from 1 day to 7 days
-- This migration updates existing trial users to have 7-day trials

-- Update existing users who have 1-day trials to 7-day trials
UPDATE public.profiles 
SET 
  trial_ends_at = NOW() + INTERVAL '7 days',
  updated_at = NOW()
WHERE 
  subscription_status = 'trial' 
  AND trial_ends_at IS NOT NULL
  AND trial_ends_at < NOW() + INTERVAL '2 days'; -- Only update trials that are still active or recently expired

-- Update users who have no trial_ends_at but have trial status
UPDATE public.profiles 
SET 
  trial_ends_at = NOW() + INTERVAL '7 days',
  updated_at = NOW()
WHERE 
  subscription_status = 'trial' 
  AND trial_ends_at IS NULL;

-- Update the default trial period for new users in the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, subscription_status, trial_ends_at, trial_count, last_trial_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'trial',
    NOW() + INTERVAL '7 days',
    1,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment about the 7-day trial period
COMMENT ON COLUMN public.profiles.trial_ends_at IS 'When the 7-day trial period ends';
