import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Webhook email endpoint received:', JSON.stringify(body, null, 2))
    
    const { event_type, data } = body

    // Handle different webhook events
    if (event_type === 'checkout.session.completed' || 
        event_type === 'subscription.created' || 
        event_type === 'transaction.completed') {
      
      console.log('Processing upgrade event:', event_type)
      
      // Extract email from different possible locations
      let userEmail = data.customer_email || data.email
      let userName = data.customer_name || data.name || 'Valued Customer'
      
      // If no email in the event, use a default for testing
      if (!userEmail) {
        userEmail = 'truleado@gmail.com'
        userName = 'Test User'
        console.log('No email found in webhook, using default:', userEmail)
      }

      console.log('Sending upgrade email to:', userEmail, 'for:', userName)

      // Send upgrade email directly using Resend
      const { data: emailData, error } = await resend.emails.send({
        from: 'Truleado <noreply@truleado.com>',
        to: [userEmail],
        subject: `Thank you for upgrading to Pro! 🎉`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; text-align: center;">Thank you for upgrading, ${userName}! 🎉</h1>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
              <h2 style="color: #1f2937; margin-top: 0;">Welcome to your Pro Plan!</h2>
              <p style="color: #374151; line-height: 1.6;">
                We're thrilled to have you on board with the <strong>Pro Plan</strong>. You now have access to:
              </p>
              <ul style="color: #374151; line-height: 1.6;">
                <li>✨ Unlimited searches and advanced analytics</li>
                <li>📈 In-depth customer sentiment analysis</li>
                <li>🚀 Priority support and new features</li>
                <li>...and much more!</li>
              </ul>
            </div>
            
            <div style="background-color: #dbeafe; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af;">
                <strong>Next Billing Date:</strong> Your subscription will automatically renew. You can manage your subscription anytime from your dashboard.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://truleado.com/dashboard" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Go to Your Dashboard
              </a>
              <a href="https://truleado.com/settings" 
                 style="background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; margin-left: 10px;">
                Manage Subscription
              </a>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 14px; text-align: center;">
                Questions? Reply to this email or visit our <a href="https://truleado.com/support" style="color: #2563eb;">support page</a>.
              </p>
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 10px;">
                Truleado - Find Your Next Customers on Reddit
              </p>
            </div>
          </div>
        `,
      })

      if (error) {
        console.error('❌ Failed to send upgrade email:', error)
        return NextResponse.json({
          success: false,
          error: error.message,
          event_type,
          userEmail
        }, { status: 500 })
      }

      console.log('✅ Upgrade email sent successfully:', emailData?.id)
      return NextResponse.json({
        success: true,
        message: 'Upgrade email sent successfully',
        emailId: emailData?.id,
        event_type,
        userEmail
      })
    }

    return NextResponse.json({ 
      message: 'Webhook received but no action taken',
      event_type: event_type || 'unknown'
    })

  } catch (error) {
    console.error('Webhook email error:', error)
    return NextResponse.json({
      success: false,
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook email endpoint is active',
    methods: ['POST'],
    status: 'ready'
  })
}
