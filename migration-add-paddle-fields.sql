-- Migration to add Paddle Payments fields to profiles table
-- Run this in your Supabase SQL editor

-- Add Paddle Payments specific columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT,
ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT;

-- Update subscription_status constraint to include 'pending' status
-- (for Paddle checkout sessions)
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_subscription_status_check 
CHECK (subscription_status IN ('active', 'cancelled', 'trial', 'free', 'pending'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_paddle_customer_id ON public.profiles(paddle_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_paddle_subscription_id ON public.profiles(paddle_subscription_id);