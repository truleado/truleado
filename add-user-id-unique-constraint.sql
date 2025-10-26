-- Add unique constraint on user_id in api_keys table to support proper upsert
-- Run this in your Supabase SQL Editor

-- First, remove any duplicate entries (if they exist)
DELETE FROM public.api_keys 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM public.api_keys 
  GROUP BY user_id
);

-- Add unique constraint
ALTER TABLE public.api_keys 
ADD CONSTRAINT api_keys_user_id_unique UNIQUE (user_id);

