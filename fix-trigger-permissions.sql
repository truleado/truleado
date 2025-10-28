-- Fix trigger permissions - run as service_role user
-- This should be run with proper permissions

-- Drop and recreate with explicit permissions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;

-- Drop the function first
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the function with SECURITY DEFINER (runs with creator's privileges)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER  -- This is critical - allows function to insert into profiles
SET search_path = public
LANGUAGE plpgsql
AS $$
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
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'trial',
    NOW() + INTERVAL '7 days',
    1,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- Prevent errors if profile already exists
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- Verify it was created
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  CASE tgenabled
    WHEN 'O' THEN '✅ Enabled'
    WHEN 'D' THEN '❌ Disabled'
    ELSE 'Unknown'
  END AS status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Trigger recreated with proper permissions';
  RAISE NOTICE '✅ SECURITY DEFINER allows function to insert into profiles';
  RAISE NOTICE '✅ Try creating a new user now!';
END $$;

