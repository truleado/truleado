-- Add chat_find_searches_count to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS chat_find_searches_count INTEGER DEFAULT 0;

-- Add chat_find_free_searches_used to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS chat_find_free_searches_used INTEGER DEFAULT 0;

-- Update existing users to have 0 free searches used
UPDATE profiles SET chat_find_free_searches_used = 0 WHERE chat_find_free_searches_used IS NULL;

-- Create function to check if user can perform chat find search
CREATE OR REPLACE FUNCTION can_perform_chat_find_search(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_profile RECORD;
  subscription_status TEXT;
  free_searches_used INTEGER;
BEGIN
  -- Get user profile and subscription info
  SELECT 
    p.chat_find_free_searches_used,
    p.subscription_status,
    s.status as sub_status
  INTO user_profile
  FROM profiles p
  LEFT JOIN subscriptions s ON s.user_id = p.id AND s.status = 'active'
  WHERE p.id = user_id;
  
  -- If user not found, deny access
  IF user_profile IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- If user has active subscription, allow unlimited searches
  IF user_profile.sub_status = 'active' OR user_profile.subscription_status IN ('active', 'pro', 'enterprise') THEN
    RETURN TRUE;
  END IF;
  
  -- For free users, check if they've used their free search
  free_searches_used := COALESCE(user_profile.chat_find_free_searches_used, 0);
  
  -- Allow if they haven't used their free search yet
  RETURN free_searches_used < 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment chat find search count
CREATE OR REPLACE FUNCTION increment_chat_find_search_count(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET 
    chat_find_searches_count = COALESCE(chat_find_searches_count, 0) + 1,
    chat_find_free_searches_used = COALESCE(chat_find_free_searches_used, 0) + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
