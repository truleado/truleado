-- Migration script for comment leads functionality
-- Run this in your Supabase SQL Editor

-- Add new columns to leads table for comment support
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_type TEXT DEFAULT 'post' CHECK (lead_type IN ('post', 'comment'));
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS parent_post_id TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS parent_post_title TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS parent_post_url TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS reddit_comment_id TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS reddit_comment_url TEXT;

-- Update the unique constraint to include lead_type and reddit_comment_id
-- First, drop the existing constraint
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_user_id_reddit_post_id_key;

-- Add new constraint that handles both posts and comments
ALTER TABLE public.leads ADD CONSTRAINT leads_user_id_reddit_post_id_lead_type_key 
  UNIQUE (user_id, reddit_post_id, lead_type, reddit_comment_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_lead_type ON public.leads(lead_type);
CREATE INDEX IF NOT EXISTS idx_leads_parent_post_id ON public.leads(parent_post_id);
CREATE INDEX IF NOT EXISTS idx_leads_reddit_comment_id ON public.leads(reddit_comment_id);

-- Add AI analysis fields
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_analysis_reasons TEXT[];
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_sample_reply TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_analysis_score DECIMAL(3,1);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_analysis_timestamp TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN public.leads.lead_type IS 'Type of lead: post or comment';
COMMENT ON COLUMN public.leads.parent_post_id IS 'Reddit post ID for comment leads';
COMMENT ON COLUMN public.leads.parent_post_title IS 'Title of parent post for comment leads';
COMMENT ON COLUMN public.leads.parent_post_url IS 'URL of parent post for comment leads';
COMMENT ON COLUMN public.leads.reddit_comment_id IS 'Reddit comment ID for comment leads';
COMMENT ON COLUMN public.leads.reddit_comment_url IS 'Direct URL to Reddit comment';
COMMENT ON COLUMN public.leads.ai_analysis_reasons IS 'AI-generated reasons why this is a good lead';
COMMENT ON COLUMN public.leads.ai_sample_reply IS 'AI-generated sample reply for this lead';
COMMENT ON COLUMN public.leads.ai_analysis_score IS 'AI-calculated lead quality score (0-10)';
COMMENT ON COLUMN public.leads.ai_analysis_timestamp IS 'When AI analysis was performed';
