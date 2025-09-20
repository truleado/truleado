-- Migration for subscription system
-- This adds subscription tracking and security measures

-- Add subscription fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'trial';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paddle_customer_id VARCHAR(255);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paddle_subscription_id VARCHAR(255);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_count INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_trial_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Update existing users to have valid subscription status and trial end date
UPDATE public.profiles 
SET 
  subscription_status = 'trial',
  trial_ends_at = COALESCE(trial_ends_at, NOW() + INTERVAL '1 day'),
  trial_count = COALESCE(trial_count, 1),
  last_trial_at = COALESCE(last_trial_at, NOW())
WHERE subscription_status IS NULL OR subscription_status NOT IN ('trial', 'active', 'expired', 'cancelled', 'past_due');

-- Create subscription history table for tracking
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  previous_status VARCHAR(20),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paddle_event_id VARCHAR(255),
  paddle_event_type VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trial abuse prevention table
CREATE TABLE IF NOT EXISTS public.trial_abuse_prevention (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  trial_count INTEGER DEFAULT 1,
  last_trial_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ends_at ON public.profiles(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_profiles_paddle_customer_id ON public.profiles(paddle_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON public.subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_changed_at ON public.subscription_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_trial_abuse_email ON public.trial_abuse_prevention(email);
CREATE INDEX IF NOT EXISTS idx_trial_abuse_ip ON public.trial_abuse_prevention(ip_address);

-- Drop existing constraint if it exists and add new one
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_subscription_status;

-- Add new constraint
ALTER TABLE public.profiles ADD CONSTRAINT check_subscription_status 
  CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled', 'past_due'));

ALTER TABLE public.profiles ADD CONSTRAINT check_trial_count 
  CHECK (trial_count >= 0 AND trial_count <= 1);

-- Add RLS policies for subscription_history
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription history" ON public.subscription_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription history" ON public.subscription_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add RLS policies for trial_abuse_prevention (admin only)
ALTER TABLE public.trial_abuse_prevention ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can access trial abuse prevention" ON public.trial_abuse_prevention
  FOR ALL USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.subscription_status IS 'Current subscription status: trial, active, expired, cancelled, past_due';
COMMENT ON COLUMN public.profiles.trial_ends_at IS 'When the trial period ends';
COMMENT ON COLUMN public.profiles.subscription_ends_at IS 'When the current subscription ends';
COMMENT ON COLUMN public.profiles.paddle_customer_id IS 'Paddle customer ID for billing';
COMMENT ON COLUMN public.profiles.paddle_subscription_id IS 'Paddle subscription ID';
COMMENT ON COLUMN public.profiles.trial_count IS 'Number of trials used (max 1)';
COMMENT ON COLUMN public.profiles.last_trial_at IS 'When the last trial started';
COMMENT ON COLUMN public.profiles.ip_address IS 'IP address for abuse prevention';
COMMENT ON COLUMN public.profiles.user_agent IS 'User agent for abuse prevention';

COMMENT ON TABLE public.subscription_history IS 'Tracks all subscription status changes';
COMMENT ON TABLE public.trial_abuse_prevention IS 'Prevents trial abuse by tracking email/IP combinations';
