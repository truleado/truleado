-- Migration: Replace Razorpay with Dodo Payments
-- This migration updates the database schema to use Dodo Payments instead of Razorpay

-- Add Dodo Payments fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS dodo_customer_id TEXT,
ADD COLUMN IF NOT EXISTS dodo_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_trial_at TIMESTAMP WITH TIME ZONE;

-- Update subscriptions table to use Dodo Payments
ALTER TABLE public.subscriptions 
DROP COLUMN IF EXISTS razorpay_subscription_id,
DROP COLUMN IF EXISTS razorpay_plan_id,
ADD COLUMN IF NOT EXISTS dodo_subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS dodo_plan_id TEXT,
ADD COLUMN IF NOT EXISTS dodo_customer_id TEXT;

-- Update subscription status enum to include 'trial' and 'pending'
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_subscription_status_check 
CHECK (subscription_status IN ('free', 'trial', 'active', 'cancelled', 'past_due', 'pending'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_dodo_customer_id ON public.profiles(dodo_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_dodo_subscription_id ON public.profiles(dodo_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_dodo_subscription_id ON public.subscriptions(dodo_subscription_id);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.dodo_customer_id IS 'Dodo Payments customer ID';
COMMENT ON COLUMN public.profiles.dodo_subscription_id IS 'Dodo Payments subscription ID';
COMMENT ON COLUMN public.profiles.trial_ends_at IS 'When the trial period ends';
COMMENT ON COLUMN public.profiles.subscription_ends_at IS 'When the subscription ends';
COMMENT ON COLUMN public.profiles.trial_count IS 'Number of trials used by this user';
COMMENT ON COLUMN public.profiles.last_trial_at IS 'When the last trial started';

COMMENT ON COLUMN public.subscriptions.dodo_subscription_id IS 'Dodo Payments subscription ID';
COMMENT ON COLUMN public.subscriptions.dodo_plan_id IS 'Dodo Payments plan ID';
COMMENT ON COLUMN public.subscriptions.dodo_customer_id IS 'Dodo Payments customer ID';
