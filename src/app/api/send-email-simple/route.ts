import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 })
    }

    // Use Resend API directly with fetch
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Truleado <onboarding@resend.dev>',
        to: [email],
        subject: 'Welcome to Truleado! 🚀',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; text-align: center;">Welcome to Truleado, ${name}! 🎉</h1>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #1f2937; margin-top: 0;">What you can do with Truleado:</h2>
              <ul style="color: #374151; line-height: 1.6;">
                <li>🔍 Find relevant Reddit discussions where people need your product</li>
                <li>📊 Analyze customer sentiment and pain points</li>
                <li>💬 Discover what your customers are really saying</li>
                <li>🎯 Target the right communities and discussions</li>
              </ul>
            </div>
            
            <div style="background-color: #dbeafe; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af;"><strong>⏰ Trial Period:</strong> You have 1 day of full access to explore all features!</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://truleado.com/dashboard" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Start Finding Customers
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
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Resend API error:', errorData)
      return NextResponse.json({ 
        error: 'Failed to send email', 
        details: errorData,
        status: response.status
      }, { status: 500 })
    }

    const result = await response.json()
    return NextResponse.json({ 
      success: true, 
      message: 'Welcome email sent successfully',
      emailId: result.id 
    })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
