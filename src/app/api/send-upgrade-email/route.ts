import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📧 Send upgrade email endpoint received:', JSON.stringify(body, null, 2))
    
    // Handle both direct calls and Paddle webhook calls
    let email, name, planType
    
    if (body.event_type) {
      // This is a Paddle webhook call
      const data = body.data || {}
      
      // Try multiple possible locations for email
      email = data.customer_email || 
              data.email || 
              data.customer?.email || 
              data.customer_email_address ||
              data.billing_address?.email ||
              data.customer_details?.email ||
              data.payer?.email ||
              data.payer?.email_address
      
      // Try multiple possible locations for name
      name = data.customer_name || 
             data.name || 
             data.customer?.name || 
             data.customer_name || 
             data.billing_address?.name ||
             data.customer_details?.name ||
             data.payer?.name ||
             data.payer?.first_name + ' ' + data.payer?.last_name ||
             'Valued Customer'
      
      planType = 'Pro'
      console.log('📧 Processing Paddle webhook:', body.event_type)
      console.log('📧 Full webhook body:', JSON.stringify(body, null, 2))
      console.log('📧 Extracted email:', email, 'name:', name)
    } else {
      // This is a direct call
      email = body.email
      name = body.name
      planType = body.planType || 'Pro'
    }

    // If we still don't have email/name, use defaults for webhook calls
    if (!email || !name) {
      if (body.event_type) {
        // This is a webhook call - use defaults and log the issue
        email = 'truleado@gmail.com' // Send to your email for testing
        name = 'Valued Customer'
        console.log('⚠️ Could not extract email/name from webhook, using defaults')
        console.log('⚠️ Webhook data was:', JSON.stringify(body, null, 2))
      } else {
        return NextResponse.json({ error: 'Email and name are required' }, { status: 400 })
      }
    }
    
    // Ensure we have valid values
    if (!email) email = 'truleado@gmail.com'
    if (!name) name = 'Valued Customer'

    console.log('📧 Sending upgrade thank you email to:', email, 'for:', name, 'plan:', planType)

    // Use verified domain for all emails
    const fromAddress = 'Truleado <noreply@truleado.com>'
    const toAddress = [email] // Send to the actual user's email

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: toAddress,
      subject: `Thank you for upgrading to ${planType}! 🎉`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; text-align: center;">Thank you for upgrading, ${name}! 🎉</h1>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <h2 style="color: #1f2937; margin-top: 0;">Welcome to ${planType} Plan!</h2>
            <p style="color: #374151; margin-bottom: 0;">You now have access to all premium features and unlimited usage.</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1f2937; margin-top: 0;">What's included in your ${planType} plan:</h2>
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
            <p style="margin: 0; color: #1e40af;"><strong>💳 Billing:</strong> Your ${planType} plan will renew automatically. You can manage your subscription anytime in your account settings.</p>
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
              Questions about your ${planType} plan? Reply to this email or visit our <a href="https://truleado.com/support" style="color: #2563eb;">support page</a>.
            </p>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 10px;">
              Truleado - Find Your Next Customers on Reddit
            </p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('❌ Resend error:', error)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to send upgrade email', 
        details: error
      }, { status: 500 })
    }

    console.log('✅ Upgrade thank you email sent successfully:', data?.id)
    return NextResponse.json({ 
      success: true, 
      message: 'Upgrade thank you email sent successfully',
      emailId: data?.id 
    })
  } catch (error) {
    console.error('❌ Upgrade email service error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
