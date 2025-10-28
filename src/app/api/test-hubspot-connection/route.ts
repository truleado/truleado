import { NextResponse } from 'next/server'
import { createHubSpotContact, convertUserToHubSpotContact } from '@/lib/hubspot-service'

/**
 * Test endpoint to verify HubSpot integration
 * Visit: https://your-domain.com/api/test-hubspot-connection
 */
export async function GET() {
  try {
    const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN
    const HUBSPOT_PORTAL_ID = process.env.HUBSPOT_PORTAL_ID

    // Check if environment variables are set
    if (!HUBSPOT_ACCESS_TOKEN || !HUBSPOT_PORTAL_ID) {
      return NextResponse.json({
        success: false,
        error: 'HubSpot not configured',
        details: {
          hasToken: !!HUBSPOT_ACCESS_TOKEN,
          hasPortalId: !!HUBSPOT_PORTAL_ID,
          message: 'Add HUBSPOT_ACCESS_TOKEN and HUBSPOT_PORTAL_ID to environment variables'
        }
      }, { status: 200 }) // Return 200 so user can see the message
    }

    // Try to create a test contact
    const testContact = convertUserToHubSpotContact(
      'test@truleado.com',
      'Test User',
      'test-user-id-123',
      new Date().toISOString()
    )

    const result = await createHubSpotContact(testContact)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'HubSpot integration is working!',
        details: {
          contactId: result.contactId,
          tokenConfigured: true,
          portalId: HUBSPOT_PORTAL_ID,
          timestamp: new Date().toISOString()
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to create contact',
        details: {
          tokenConfigured: true,
          portalId: HUBSPOT_PORTAL_ID,
          timestamp: new Date().toISOString()
        }
      }, { status: 200 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        timestamp: new Date().toISOString()
      }
    }, { status: 200 })
  }
}

