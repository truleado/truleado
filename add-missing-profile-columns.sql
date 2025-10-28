-- Add missing columns to profiles table if they don't exist

-- Add subscription_status if missing
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial';

-- Add trial_ends_at if missing
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Add trial_count if missing
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_count INTEGER DEFAULT 1;

-- Add last_trial_at if missing
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_trial_at TIMESTAMP WITH TIME ZONE;

-- Verify columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Columns added to profiles table';
  RAISE NOTICE '✅ Now try creating a new user - profile should be created!';
END $$;

