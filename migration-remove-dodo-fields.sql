-- Migration to remove Dodo Payments fields from profiles table
-- Run this in your Supabase SQL editor

-- Remove Dodo Payments specific columns from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS dodo_customer_id,
DROP COLUMN IF EXISTS dodo_subscription_id;

-- Update subscription_status constraint to remove 'pending' status
-- (since we're no longer using Dodo Payments)
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_subscription_status_check 
CHECK (subscription_status IN ('active', 'cancelled', 'trial', 'free'));

-- Clean up any existing 'pending' statuses
UPDATE public.profiles 
SET subscription_status = 'free' 
WHERE subscription_status = 'pending';
