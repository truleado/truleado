-- Migration script to add AI analysis fields to products table
-- Run this in your Supabase SQL Editor

-- Add new columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS benefits TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS pain_points TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ideal_customer_profile TEXT;

-- Remove old target_audience column if it exists (replace with ideal_customer_profile)
ALTER TABLE public.products DROP COLUMN IF EXISTS target_audience;

-- Update any existing products to have empty arrays for new fields
UPDATE public.products 
SET 
  features = COALESCE(features, '{}'),
  benefits = COALESCE(benefits, '{}'),
  pain_points = COALESCE(pain_points, '{}')
WHERE features IS NULL OR benefits IS NULL OR pain_points IS NULL;
