-- Migration to add Reddit OAuth fields to api_keys table
-- Run this in your Supabase SQL Editor

-- Add Reddit OAuth fields to api_keys table
ALTER TABLE public.api_keys 
ADD COLUMN IF NOT EXISTS reddit_access_token TEXT,
ADD COLUMN IF NOT EXISTS reddit_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS reddit_token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reddit_username TEXT;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_reddit_tokens ON public.api_keys(user_id) 
WHERE reddit_access_token IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.api_keys.reddit_access_token IS 'Reddit OAuth access token for user';
COMMENT ON COLUMN public.api_keys.reddit_refresh_token IS 'Reddit OAuth refresh token for user';
COMMENT ON COLUMN public.api_keys.reddit_token_expires_at IS 'When the Reddit access token expires';
COMMENT ON COLUMN public.api_keys.reddit_username IS 'Reddit username of the connected account';
