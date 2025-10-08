-- Complete migration for Chat & Find feature with usage tracking
-- Run this in your Supabase SQL Editor

-- 1. Create table for Chat & Find search history
CREATE TABLE IF NOT EXISTS chat_find_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  parsed_query JSONB,
  total_leads_found INTEGER DEFAULT 0,
  search_status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create table for individual search results
CREATE TABLE IF NOT EXISTS chat_find_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  search_id UUID NOT NULL REFERENCES chat_find_searches(id) ON DELETE CASCADE,
  lead_id VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  subreddit VARCHAR(100) NOT NULL,
  author VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  relevance_score INTEGER DEFAULT 0,
  ai_analysis_reasons TEXT[],
  ai_sample_reply TEXT,
  ai_analysis_score INTEGER DEFAULT 0,
  lead_type VARCHAR(20) DEFAULT 'post',
  parent_post_title TEXT,
  parent_post_url TEXT,
  is_comment BOOLEAN DEFAULT FALSE
);

-- 3. Add usage tracking columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS chat_find_searches_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS chat_find_free_searches_used INTEGER DEFAULT 0;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_find_searches_user_id ON chat_find_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_find_searches_created_at ON chat_find_searches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_find_results_search_id ON chat_find_results(search_id);
CREATE INDEX IF NOT EXISTS idx_chat_find_results_relevance_score ON chat_find_results(relevance_score DESC);

-- 5. Enable Row Level Security
ALTER TABLE chat_find_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_find_results ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for chat_find_searches
CREATE POLICY "Users can view their own search history" ON chat_find_searches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own searches" ON chat_find_searches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own searches" ON chat_find_searches
  FOR UPDATE USING (auth.uid() = user_id);

-- 7. Create RLS policies for chat_find_results
CREATE POLICY "Users can view their own search results" ON chat_find_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_find_searches 
      WHERE id = search_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own search results" ON chat_find_results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_find_searches 
      WHERE id = search_id AND user_id = auth.uid()
    )
  );

-- 8. Create function to check if user can perform chat find search
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

-- 9. Create function to increment chat find search count
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

-- 10. Create function to get user usage info
CREATE OR REPLACE FUNCTION get_chat_find_usage_info(user_id UUID)
RETURNS JSON AS $$
DECLARE
  user_profile RECORD;
  result JSON;
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
  
  -- If user not found, return default values
  IF user_profile IS NULL THEN
    result := json_build_object(
      'used', 0,
      'limit', 1,
      'isSubscribed', false,
      'remaining', 1
    );
    RETURN result;
  END IF;
  
  -- Check if user is subscribed
  IF user_profile.sub_status = 'active' OR user_profile.subscription_status IN ('active', 'pro', 'enterprise') THEN
    result := json_build_object(
      'used', COALESCE(user_profile.chat_find_free_searches_used, 0),
      'limit', 1,
      'isSubscribed', true,
      'remaining', 'unlimited'
    );
  ELSE
    result := json_build_object(
      'used', COALESCE(user_profile.chat_find_free_searches_used, 0),
      'limit', 1,
      'isSubscribed', false,
      'remaining', GREATEST(0, 1 - COALESCE(user_profile.chat_find_free_searches_used, 0))
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Grant necessary permissions
GRANT EXECUTE ON FUNCTION can_perform_chat_find_search(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_chat_find_search_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_chat_find_usage_info(UUID) TO authenticated;
