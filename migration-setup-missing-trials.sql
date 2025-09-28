-- Migration to set up trials for existing users who don't have trial status
-- This ensures all users can access the promote feature during their trial period

-- Update users who don't have a subscription_status set or have 'free' status
-- Set them to 'trial' with a 1-day trial period
UPDATE public.profiles 
SET 
  subscription_status = 'trial',
  trial_ends_at = (NOW() + INTERVAL '1 day')::timestamp,
  trial_count = 1,
  last_trial_at = NOW()
WHERE 
  subscription_status IS NULL 
  OR subscription_status = 'free'
  OR subscription_status = ''
  OR (subscription_status = 'trial' AND trial_ends_at IS NULL);

-- Also update users who have 'trial' status but no trial_ends_at date
UPDATE public.profiles 
SET 
  trial_ends_at = (NOW() + INTERVAL '1 day')::timestamp,
  trial_count = COALESCE(trial_count, 1),
  last_trial_at = NOW()
WHERE 
  subscription_status = 'trial' 
  AND trial_ends_at IS NULL;

-- Log the changes
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
  'migration_setup_missing_trials',
  NOW()
FROM public.profiles 
WHERE 
  (subscription_status IS NULL 
   OR subscription_status = 'free'
   OR subscription_status = ''
   OR (subscription_status = 'trial' AND trial_ends_at IS NULL))
  AND id IN (
    SELECT id FROM public.profiles 
    WHERE subscription_status IS NULL 
       OR subscription_status = 'free'
       OR subscription_status = ''
       OR (subscription_status = 'trial' AND trial_ends_at IS NULL)
  );
