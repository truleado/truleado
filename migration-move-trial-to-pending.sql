-- Migration to move all users from 'trial' to 'pending' status
-- This ensures all users who haven't completed checkout are blocked
-- Only moves users who don't have a paddle_subscription_id (haven't completed checkout)

-- Step 0: Update CHECK constraint to allow 'pending' status
-- Drop existing constraints that might block 'pending'
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS check_subscription_status;

ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;

-- Recreate constraint with 'pending' included
ALTER TABLE public.profiles 
ADD CONSTRAINT check_subscription_status 
CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled', 'past_due', 'pending', 'free'));

-- Step 1: Show count of users that will be affected
DO $$ 
DECLARE
  trial_count INTEGER;
  trial_with_subscription_count INTEGER;
  trial_without_subscription_count INTEGER;
BEGIN
  -- Count all trial users
  SELECT COUNT(*) INTO trial_count
  FROM public.profiles
  WHERE subscription_status = 'trial';
  
  -- Count trial users with paddle subscription (should NOT be moved)
  SELECT COUNT(*) INTO trial_with_subscription_count
  FROM public.profiles
  WHERE subscription_status = 'trial'
    AND paddle_subscription_id IS NOT NULL
    AND paddle_subscription_id != '';
  
  -- Count trial users without paddle subscription (SHOULD be moved to pending)
  SELECT COUNT(*) INTO trial_without_subscription_count
  FROM public.profiles
  WHERE subscription_status = 'trial'
    AND (paddle_subscription_id IS NULL OR paddle_subscription_id = '');
  
  RAISE NOTICE '📊 Migration Preview:';
  RAISE NOTICE '   Total users with trial status: %', trial_count;
  RAISE NOTICE '   Trial users WITH subscription (will NOT be moved): %', trial_with_subscription_count;
  RAISE NOTICE '   Trial users WITHOUT subscription (will be moved to pending): %', trial_without_subscription_count;
END $$;

-- Step 2: Update users from 'trial' to 'pending'
-- Only update users who don't have a paddle_subscription_id
-- This means they haven't completed checkout yet
UPDATE public.profiles
SET 
  subscription_status = 'pending',
  updated_at = NOW()
WHERE 
  subscription_status = 'trial'
  AND (paddle_subscription_id IS NULL OR paddle_subscription_id = '')
  -- Also check that trial hasn't expired (if it has, they should stay as expired)
  AND (trial_ends_at IS NULL OR trial_ends_at > NOW());

-- Step 3: Show results
DO $$ 
DECLARE
  updated_count INTEGER;
  remaining_trial_count INTEGER;
BEGIN
  -- Get count of updated users
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Count remaining trial users (those with subscriptions)
  SELECT COUNT(*) INTO remaining_trial_count
  FROM public.profiles
  WHERE subscription_status = 'trial';
  
  RAISE NOTICE '✅ Migration Complete:';
  RAISE NOTICE '   Users moved from trial to pending: %', updated_count;
  RAISE NOTICE '   Users remaining in trial (have subscriptions): %', remaining_trial_count;
END $$;

-- Step 4: Verification query (optional - uncomment to run)
-- SELECT 
--   subscription_status,
--   COUNT(*) as count,
--   COUNT(CASE WHEN paddle_subscription_id IS NOT NULL AND paddle_subscription_id != '' THEN 1 END) as with_subscription,
--   COUNT(CASE WHEN paddle_subscription_id IS NULL OR paddle_subscription_id = '' THEN 1 END) as without_subscription
-- FROM public.profiles
-- WHERE subscription_status IN ('trial', 'pending')
-- GROUP BY subscription_status
-- ORDER BY subscription_status;

