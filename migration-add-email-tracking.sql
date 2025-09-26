-- Add email tracking columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trial_reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_expired_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trial_expired_email_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for email tracking queries
CREATE INDEX IF NOT EXISTS idx_profiles_email_tracking 
ON profiles (welcome_email_sent, trial_reminder_sent, trial_expired_email_sent);

-- Add comment for documentation
COMMENT ON COLUMN profiles.welcome_email_sent IS 'Whether welcome email was sent to user';
COMMENT ON COLUMN profiles.welcome_email_sent_at IS 'When welcome email was sent';
COMMENT ON COLUMN profiles.trial_reminder_sent IS 'Whether trial reminder email was sent';
COMMENT ON COLUMN profiles.trial_reminder_sent_at IS 'When trial reminder email was sent';
COMMENT ON COLUMN profiles.trial_expired_email_sent IS 'Whether trial expired email was sent';
COMMENT ON COLUMN profiles.trial_expired_email_sent_at IS 'When trial expired email was sent';
