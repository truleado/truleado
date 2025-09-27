import { NextRequest, NextResponse } from 'next/server'
import { zohoCRMService } from '@/lib/zoho-crm-service'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Zoho CRM integration...')
    
    // Test Zoho contact creation with sample data
    const contactResult = await zohoCRMService.createContact({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@truleado.com',
      phone: '+1234567890',
      company: 'Test Company',
      userId: 'test-user-123',
      signupDate: new Date().toISOString(),
      trialStatus: 'trial'
    })

    if (contactResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Zoho contact created successfully!',
        contactId: contactResult.contactId,
        action: 'created',
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: false,
        error: contactResult.error || 'Failed to create contact in Zoho CRM',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in test-zoho-simple:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
