import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Production webhook test - this will work in production
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('paddle-signature') || ''
    
    console.log('🚀 PRODUCTION WEBHOOK TEST - Raw Request:')
    console.log('Timestamp:', new Date().toISOString())
    console.log('Signature:', signature ? 'Present' : 'Missing')
    console.log('Body Length:', body.length)
    console.log('User-Agent:', request.headers.get('user-agent'))
    console.log('Content-Type:', request.headers.get('content-type'))
    
    // Parse the webhook payload
    let event
    try {
      event = JSON.parse(body)
      console.log('✅ Parsed Event:', JSON.stringify(event, null, 2))
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    
    // Check if this is a Paddle webhook
    const isPaddleWebhook = 
      request.headers.get('user-agent')?.includes('Paddle') ||
      signature ||
      event.event_type ||
      event.event_id
    
    console.log('🔍 Is Paddle Webhook:', isPaddleWebhook)
    console.log('🔍 Event Type:', event.event_type)
    console.log('🔍 Event ID:', event.event_id)
    
    // Handle upgrade events
    const upgradeEvents = [
      'checkout.session.completed',
      'subscription.created',
      'transaction.completed',
      'subscription.payment_succeeded'
    ]
    
    if (upgradeEvents.includes(event.event_type)) {
      console.log('🎉 PROCESSING UPGRADE EVENT:', event.event_type)
      
      // Extract customer info from production webhook data
      const data = event.data || {}
      const customer = data.customer || {}
      
      const email = 
        data.customer_email ||
        data.email ||
        customer.email ||
        customer.email_address ||
        data.billing_address?.email ||
        data.payer?.email ||
        data.customer_details?.email
      
      const name = 
        data.customer_name ||
        data.name ||
        customer.name ||
        customer.first_name + (customer.last_name ? ` ${customer.last_name}` : '') ||
        data.billing_address?.name ||
        data.payer?.name ||
        data.customer_details?.name ||
        'Valued Customer'
      
      console.log('👤 Customer Details:', { email, name })
      
      if (email) {
        try {
          console.log('📧 Sending production upgrade email to:', email)
          
          const { data: emailData, error: emailError } = await resend.emails.send({
            from: 'Truleado <noreply@truleado.com>',
            to: [email],
            subject: `Welcome to Truleado Pro! 🚀`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2563eb; text-align: center;">Welcome to Truleado Pro, ${name}! 🎉</h1>
                
                <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
                  <h2 style="color: #1f2937; margin-top: 0;">Your Pro Plan is Active!</h2>
                  <p style="color: #374151; line-height: 1.6;">
                    Thank you for upgrading to Truleado Pro! You now have unlimited access to all our premium features.
                  </p>
                </div>
                
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #1f2937; margin-top: 0;">What's included in your Pro plan:</h3>
                  <ul style="color: #374151; line-height: 1.6;">
                    <li>🚀 <strong>Unlimited Reddit searches</strong> - Find as many discussions as you need</li>
                    <li>📊 <strong>Advanced analytics</strong> - Deep insights into customer sentiment</li>
                    <li>🎯 <strong>Priority support</strong> - Get help when you need it most</li>
                    <li>💬 <strong>Unlimited AI analysis</strong> - Analyze every discussion with AI</li>
                    <li>📈 <strong>Export capabilities</strong> - Download your findings</li>
                    <li>🔔 <strong>Real-time alerts</strong> - Never miss important discussions</li>
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
            console.error('❌ Email Error:', emailError)
            return NextResponse.json({ 
              success: false, 
              error: 'Email failed',
              details: emailError 
            }, { status: 500 })
          } else {
            console.log('✅ PRODUCTION EMAIL SENT:', emailData?.id)
            return NextResponse.json({ 
              success: true, 
              message: 'Production upgrade email sent successfully',
              emailId: emailData?.id,
              eventType: event.event_type,
              customerEmail: email
            })
          }
        } catch (emailError) {
          console.error('❌ Email Exception:', emailError)
          return NextResponse.json({ 
            success: false, 
            error: 'Email exception',
            details: emailError instanceof Error ? emailError.message : 'Unknown error'
          }, { status: 500 })
        }
      } else {
        console.warn('⚠️ No customer email found in production webhook')
        return NextResponse.json({ 
          success: false, 
          error: 'No customer email found',
          eventType: event.event_type,
          data: data
        }, { status: 400 })
      }
    } else {
      console.log('ℹ️ Non-upgrade event:', event.event_type)
      return NextResponse.json({ 
        success: true, 
        message: 'Event received but not processed',
        eventType: event.event_type
      })
    }
    
  } catch (error) {
    console.error('❌ Production webhook error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Production webhook test endpoint',
    methods: ['POST'],
    status: 'ready for production',
    timestamp: new Date().toISOString()
  })
}

