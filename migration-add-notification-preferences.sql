-- Add notification_preferences column to profiles table
-- This migration adds the missing column for user notification preferences

ALTER TABLE public.profiles 
ADD COLUMN notification_preferences JSONB DEFAULT '{
  "email": true,
  "newLeads": true,
  "weeklyReport": true
}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.notification_preferences IS 'User notification preferences stored as JSON';
