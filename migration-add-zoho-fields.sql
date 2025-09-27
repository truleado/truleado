-- Add Zoho CRM integration fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS zoho_contact_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS zoho_contact_created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS zoho_contact_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS company VARCHAR(255);

-- Create index for Zoho contact lookups
CREATE INDEX IF NOT EXISTS idx_profiles_zoho_contact 
ON profiles (zoho_contact_id);

-- Add comments for documentation
COMMENT ON COLUMN profiles.zoho_contact_id IS 'Zoho CRM contact ID for this user';
COMMENT ON COLUMN profiles.zoho_contact_created_at IS 'When the contact was created in Zoho CRM';
COMMENT ON COLUMN profiles.zoho_contact_updated_at IS 'When the contact was last updated in Zoho CRM';
COMMENT ON COLUMN profiles.phone IS 'User phone number';
COMMENT ON COLUMN profiles.company IS 'User company name';
