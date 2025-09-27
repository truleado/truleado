interface ZohoContact {
  First_Name: string
  Last_Name?: string
  Email: string
  Phone?: string
  Lead_Source: string
  Lead_Status: string
  Company?: string
  Description?: string
  Custom_Field_1?: string // User ID
  Custom_Field_2?: string // Signup Date
  Custom_Field_3?: string // Trial Status
}

interface ZohoConfig {
  clientId: string
  clientSecret: string
  refreshToken: string
  redirectUri: string
  apiDomain: string
}

export class ZohoCRMService {
  private config: ZohoConfig
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor() {
    this.config = {
      clientId: process.env.ZOHO_CLIENT_ID || '',
      clientSecret: process.env.ZOHO_CLIENT_SECRET || '',
      refreshToken: process.env.ZOHO_REFRESH_TOKEN || '',
      redirectUri: process.env.ZOHO_REDIRECT_URI || 'https://truleado.com/auth/zoho/callback',
      apiDomain: process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.com'
    }
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    try {
      const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.config.refreshToken,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(`Zoho API error: ${data.error}`)
      }

      this.accessToken = data.access_token
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000 // 1 minute buffer

      return this.accessToken
    } catch (error) {
      console.error('Error refreshing Zoho access token:', error)
      throw new Error('Failed to get Zoho access token')
    }
  }

  async createContact(userData: {
    firstName: string
    lastName?: string
    email: string
    phone?: string
    company?: string
    userId: string
    signupDate: string
    trialStatus: string
  }): Promise<{ success: boolean; contactId?: string; error?: string }> {
    try {
      if (!this.config.clientId || !this.config.clientSecret || !this.config.refreshToken) {
        console.warn('Zoho CRM credentials not configured, skipping contact creation')
        return { success: false, error: 'Zoho CRM not configured' }
      }

      const accessToken = await this.getAccessToken()

      const contactData: ZohoContact = {
        First_Name: userData.firstName,
        Last_Name: userData.lastName || '',
        Email: userData.email,
        Phone: userData.phone || '',
        Lead_Source: 'Truleado Website',
        Lead_Status: 'Not Contacted',
        Company: userData.company || 'Individual',
        Description: `New user signup from Truleado. Trial Status: ${userData.trialStatus}`,
        Custom_Field_1: userData.userId,
        Custom_Field_2: userData.signupDate,
        Custom_Field_3: userData.trialStatus
      }

      const response = await fetch(`${this.config.apiDomain}/crm/v2/Contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [contactData]
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Zoho CRM API error:', errorData)
        return { 
          success: false, 
          error: `Zoho API error: ${response.statusText}` 
        }
      }

      const result = await response.json()
      
      if (result.data && result.data.length > 0) {
        const contactId = result.data[0].details?.id
        console.log('Contact created successfully in Zoho CRM:', contactId)
        return { success: true, contactId }
      } else {
        return { success: false, error: 'No contact ID returned from Zoho' }
      }
    } catch (error) {
      console.error('Error creating Zoho contact:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  async updateContact(contactId: string, updateData: Partial<ZohoContact>): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.config.clientId || !this.config.clientSecret || !this.config.refreshToken) {
        return { success: false, error: 'Zoho CRM not configured' }
      }

      const accessToken = await this.getAccessToken()

      const response = await fetch(`${this.config.apiDomain}/crm/v2/Contacts/${contactId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [updateData]
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Zoho CRM update error:', errorData)
        return { 
          success: false, 
          error: `Zoho API error: ${response.statusText}` 
        }
      }

      console.log('Contact updated successfully in Zoho CRM:', contactId)
      return { success: true }
    } catch (error) {
      console.error('Error updating Zoho contact:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  async searchContactByEmail(email: string): Promise<{ success: boolean; contactId?: string; error?: string }> {
    try {
      if (!this.config.clientId || !this.config.clientSecret || !this.config.refreshToken) {
        return { success: false, error: 'Zoho CRM not configured' }
      }

      const accessToken = await this.getAccessToken()

      const response = await fetch(`${this.config.apiDomain}/crm/v2/Contacts/search?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Zoho CRM search error:', errorData)
        return { 
          success: false, 
          error: `Zoho API error: ${response.statusText}` 
        }
      }

      const result = await response.json()
      
      if (result.data && result.data.length > 0) {
        const contactId = result.data[0].id
        return { success: true, contactId }
      } else {
        return { success: true, contactId: undefined } // No contact found
      }
    } catch (error) {
      console.error('Error searching Zoho contact:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}

export const zohoCRMService = new ZohoCRMService()
