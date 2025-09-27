import { NextRequest, NextResponse } from 'next/server'
import { sendUpgradeThankYouEmail } from '@/lib/upgrade-email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const event = JSON.parse(body)
    
    console.log('Paddle webhook received:', event.event_type)
    console.log('Event data:', JSON.stringify(event.data, null, 2))

    // Handle different webhook events
    if (event.event_type === 'checkout.session.completed' || 
        event.event_type === 'subscription.created' || 
        event.event_type === 'transaction.completed') {
      
      console.log('Processing upgrade event:', event.event_type)
      
      // Extract email from different possible locations
      let userEmail = event.data.customer_email || event.data.email
      let userName = event.data.customer_name || event.data.name || 'Valued Customer'
      
      // If no email in the event, use a default for testing
      if (!userEmail) {
        userEmail = 'truleado@gmail.com'
        userName = 'Test User'
        console.log('No email found in webhook, using default:', userEmail)
      }

      console.log('Sending upgrade email to:', userEmail, 'for:', userName)

      // Send upgrade email
      const emailResult = await sendUpgradeThankYouEmail(userEmail, userName, 'Pro')
      
      if (emailResult.success) {
        console.log('✅ Upgrade email sent successfully:', emailResult.result?.emailId)
        return NextResponse.json({
          success: true,
          message: 'Upgrade email sent successfully',
          emailId: emailResult.result?.emailId,
          event_type: event.event_type,
          userEmail
        })
      } else {
        console.error('❌ Failed to send upgrade email:', emailResult.error)
        return NextResponse.json({
          success: false,
          error: emailResult.error,
          event_type: event.event_type,
          userEmail
        }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      message: 'Webhook received but no action taken',
      event_type: event.event_type || 'unknown'
    })

  } catch (error) {
    console.error('Paddle webhook error:', error)
    return NextResponse.json({
      success: false,
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Paddle webhook endpoint is active',
    methods: ['POST'],
    status: 'ready'
  })
}
