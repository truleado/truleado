import { NextRequest, NextResponse } from 'next/server'
import { createHubSpotContact } from '@/lib/hubspot-service'

export async function GET(request: NextRequest) {
  try {
    const testResult = await createHubSpotContact({
      email: 'test@truleado.com',
      firstname: 'Test',
      lastname: 'User',
      truleado_user_id: 'test-user-id',
      truleado_signup_date: new Date().toISOString(),
      truleado_trial_status: 'active'
    })

    return NextResponse.json({
      success: testResult.success,
      error: testResult.error,
      message: testResult.success 
        ? 'HubSpot integration is working! ✅' 
        : `HubSpot integration not working: ${testResult.error}`
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'HubSpot integration error occurred'
    })
  }
}

