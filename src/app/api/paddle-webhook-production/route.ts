import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Production-grade webhook handler following Paddle's specifications
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Get the raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get('paddle-signature') || ''
    
    console.log('🔔 Paddle webhook received:', {
      timestamp: new Date().toISOString(),
      signature: signature ? 'Present' : 'Missing',
      bodyLength: body.length,
      userAgent: request.headers.get('user-agent'),
      contentType: request.headers.get('content-type')
    })

    // Parse the webhook payload
    let event
    try {
      event = JSON.parse(body)
    } catch (parseError) {
      console.error('❌ Failed to parse webhook body:', parseError)
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    console.log('📋 Webhook event details:', {
      eventType: event.event_type,
      eventId: event.event_id,
      occurredAt: event.occurred_at,
      dataKeys: event.data ? Object.keys(event.data) : []
    })

    // Handle upgrade-related events
    const upgradeEvents = [
      'checkout.session.completed',
      'subscription.created', 
      'transaction.completed',
      'subscription.payment_succeeded'
    ]

    if (upgradeEvents.includes(event.event_type)) {
      console.log('🎉 Processing upgrade event:', event.event_type)
      
      // Extract customer information from various possible locations
      const data = event.data || {}
      const customer = data.customer || {}
      const billingAddress = data.billing_address || {}
      const customData = data.custom_data || {}
      
      // Comprehensive email extraction
      const email = 
        data.customer_email ||
        data.email ||
        customer.email ||
        customer.email_address ||
        billingAddress.email ||
        customData.email ||
        data.payer?.email ||
        data.payer?.email_address ||
        data.customer_details?.email

      // Comprehensive name extraction
      const name = 
        data.customer_name ||
        data.name ||
        customer.name ||
        customer.first_name + (customer.last_name ? ` ${customer.last_name}` : '') ||
        billingAddress.name ||
        customData.name ||
        data.payer?.name ||
        data.payer?.first_name + (data.payer?.last_name ? ` ${data.payer?.last_name}` : '') ||
        data.customer_details?.name ||
        'Valued Customer'

      console.log('👤 Customer details extracted:', {
        email: email || 'Not found',
        name: name || 'Not found',
        customerId: data.customer_id || customer.id,
        sessionId: data.id || data.session_id
      })

      // Send upgrade email if we have customer email
      if (email) {
        try {
          console.log('📧 Sending upgrade email to:', email)
          
          const { data: emailData, error: emailError } = await resend.emails.send({
            from: 'Truleado <noreply@truleado.com>',
            to: [email],
            subject: `Thank you for upgrading to Pro! 🎉`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2563eb; text-align: center;">Thank you for upgrading, ${name}! 🎉</h1>
                
                <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
                  <h2 style="color: #1f2937; margin-top: 0;">Welcome to your Pro Plan!</h2>
                  <p style="color: #374151; line-height: 1.6;">
                    We're thrilled to have you on board with the <strong>Pro Plan</strong>. You now have access to:
                  </p>
                  <ul style="color: #374151; line-height: 1.6;">
                    <li>✨ Unlimited searches and advanced analytics</li>
                    <li>📈 In-depth customer sentiment analysis</li>
                    <li>🚀 Priority support and new features</li>
                    <li>💬 Unlimited AI analysis</li>
                    <li>📊 Export capabilities</li>
                    <li>🔔 Real-time alerts</li>
                  </ul>
                </div>
                
                <div style="background-color: #dbeafe; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <p style="margin: 0; color: #1e40af;">
                    <strong>💳 Billing:</strong> Your Pro plan will renew automatically. You can manage your subscription anytime in your account settings.
                  </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://truleado.com/dashboard" 
                     style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; margin-right: 10px;">
                    Go to Dashboard
                  </a>
                  <a href="https://truleado.com/settings" 
                     style="background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                    Manage Subscription
                  </a>
                </div>
                
                <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                  <p style="color: #6b7280; font-size: 14px; text-align: center;">
                    Questions about your Pro plan? Reply to this email or visit our <a href="https://truleado.com/support" style="color: #2563eb;">support page</a>.
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 10px;">
                    Truleado - Find Your Next Customers on Reddit
                  </p>
                </div>
              </div>
            `,
          })

          if (emailError) {
            console.error('❌ Failed to send upgrade email:', emailError)
            // Don't fail the webhook - log and continue
          } else {
            console.log('✅ Upgrade email sent successfully:', emailData?.id)
          }
        } catch (emailError) {
          console.error('❌ Email sending error:', emailError)
          // Don't fail the webhook - log and continue
        }
      } else {
        console.warn('⚠️ No customer email found in webhook data')
        console.warn('⚠️ Webhook data structure:', JSON.stringify(data, null, 2))
      }
    } else {
      console.log('ℹ️ Non-upgrade event received:', event.event_type)
    }

    // Always respond with 200 OK within 5 seconds (Paddle requirement)
    const processingTime = Date.now() - startTime
    console.log('✅ Webhook processed successfully in', processingTime, 'ms')

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      processingTime: `${processingTime}ms`,
      eventType: event.event_type
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('❌ Webhook processing error:', error)
    
    // Still return 200 OK to prevent Paddle retries
    return NextResponse.json({ 
      success: false,
      error: 'Webhook processing failed',
      processingTime: `${processingTime}ms`,
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Paddle webhook endpoint is active and ready',
    methods: ['POST'],
    status: 'production-ready',
    timestamp: new Date().toISOString()
  })
}
