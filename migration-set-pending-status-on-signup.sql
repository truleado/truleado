-- Migration to set new users to 'pending' status instead of 'trial'
-- This ensures users must complete checkout before accessing the app
-- The webhook will update to 'trial' or 'active' after checkout completes

-- Drop and recreate the trigger function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the function with 'pending' status
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
    'pending',  -- User must complete checkout before accessing app
    NOW() + INTERVAL '7 days',  -- Will be updated after checkout
    1,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile with pending status. User must complete checkout to start trial.';

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Trigger updated: New users will have pending status';
  RAISE NOTICE '✅ Users must complete checkout before accessing the app';
END $$;

