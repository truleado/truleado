/**
 * HubSpot Service - Push users to HubSpot CRM
 * Safely integrated with error handling and logging
 */

const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN || ''
const HUBSPOT_PORTAL_ID = process.env.HUBSPOT_PORTAL_ID || ''
const HUBSPOT_API_BASE = 'https://api.hubapi.com'

interface HubSpotContact {
  email: string
  firstname?: string
  lastname?: string
  phone?: string
  company?: string
  // Custom properties
  truleado_user_id?: string
  truleado_signup_date?: string
  truleado_trial_status?: string
  truleado_product_count?: number
}

/**
 * Creates or updates a contact in HubSpot
 * Returns true if successful, false otherwise
 */
export async function createHubSpotContact(contact: HubSpotContact): Promise<{ success: boolean, error?: string, contactId?: string }> {
  try {
    // Don't break the app if HubSpot credentials are missing
    if (!HUBSPOT_ACCESS_TOKEN) {
      console.warn('⚠️  HubSpot: No access token configured, skipping contact creation')
      return { success: false, error: 'HubSpot not configured' }
    }

    console.log('📧 HubSpot: Creating contact for:', contact.email)
    
    // Send all properties including custom ones
    // Note: Custom properties must be created in HubSpot first
    const response = await fetch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            email: contact.email,
            firstname: contact.firstname,
            lastname: contact.lastname,
            phone: contact.phone,
            company: contact.company,
            // Custom properties
            truleado_user_id: contact.truleado_user_id,
            truleado_signup_date: contact.truleado_signup_date,
            truleado_trial_status: contact.truleado_trial_status,
          }
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      // Check if contact already exists (error code 409)
      if (data.status === 'error' && data.message?.includes('already exists')) {
        console.log('✅ HubSpot: Contact already exists, skipping:', contact.email)
        return { success: true, error: 'Contact already exists' }
      }

      console.error('❌ HubSpot error:', response.status, data)
      return { 
        success: false, 
        error: `HubSpot API error: ${data.message || response.statusText}` 
      }
    }

    console.log('✅ HubSpot: Contact created successfully:', data.id)
    return { success: true, contactId: data.id }

  } catch (error) {
    // Never throw errors - just log them
    console.error('❌ HubSpot: Failed to create contact:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Update existing HubSpot contact
 */
export async function updateHubSpotContact(email: string, properties: Record<string, any>): Promise<boolean> {
  try {
    if (!HUBSPOT_ACCESS_TOKEN) {
      return false
    }

    const response = await fetch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${email}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties
        })
      }
    )

    return response.ok

  } catch (error) {
    console.error('HubSpot: Failed to update contact:', error)
    return false
  }
}

/**
 * Helper to format user name
 */
function formatUserName(fullName: string | null | undefined): { firstname: string, lastname: string } {
  if (!fullName) return { firstname: '', lastname: '' }
  
  const parts = fullName.trim().split(' ')
  
  if (parts.length === 1) {
    return { firstname: parts[0], lastname: '' }
  }
  
  if (parts.length === 2) {
    return { firstname: parts[0], lastname: parts[1] }
  }
  
  // More than 2 parts - take first as firstname, rest as lastname
  return {
    firstname: parts[0],
    lastname: parts.slice(1).join(' ')
  }
}

/**
 * Convert Truleado user to HubSpot contact
 */
export function convertUserToHubSpotContact(
  userEmail: string,
  fullName: string | null | undefined,
  userId: string,
  signupDate: string
): HubSpotContact {
  const { firstname, lastname } = formatUserName(fullName)
  
  return {
    email: userEmail,
    firstname,
    lastname,
    truleado_user_id: userId,
    truleado_signup_date: signupDate,
    truleado_trial_status: 'active',
  }
}
