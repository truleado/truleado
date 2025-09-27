import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, name, trialEndDate } = await request.json()

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 })
    }

    // Send welcome email
    const { data, error } = await resend.emails.send({
      from: 'Truleado <onboarding@resend.dev>',
      to: [email],
      subject: 'Welcome to Truleado! 🚀',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to Truleado, ${name}! 🎉</h1>
          
          <p>Thank you for signing up! You now have <strong>1 day of full access</strong> to discover your next customers on Reddit.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1f2937; margin-top: 0;">What you can do:</h2>
            <ul style="color: #374151;">
              <li>🔍 Find relevant Reddit discussions</li>
              <li>📊 Analyze customer sentiment</li>
              <li>💬 Discover what your customers are saying</li>
              <li>🎯 Target the right communities</li>
            </ul>
          </div>
          
          <p><strong>Trial ends:</strong> ${new Date(trialEndDate).toLocaleDateString()}</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://truleado.com/dashboard" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Start Finding Customers
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Questions? Reply to this email or visit our <a href="https://truleado.com/support">support page</a>.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ 
        error: 'Failed to send email', 
        details: error,
        resendKey: process.env.RESEND_API_KEY ? 'Present' : 'Missing'
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Welcome email sent successfully',
      emailId: data?.id 
    })
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
