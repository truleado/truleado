-- Fix api_keys table to have unique constraint on user_id
-- Run this in your Supabase SQL Editor

-- Add unique constraint on user_id for api_keys table
ALTER TABLE public.api_keys 
ADD CONSTRAINT api_keys_user_id_unique UNIQUE (user_id);

-- Add comment for documentation
COMMENT ON CONSTRAINT api_keys_user_id_unique ON public.api_keys IS 'Ensures each user can only have one API keys record';