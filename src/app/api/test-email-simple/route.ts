import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/lib/email-service'

export async function GET(request: NextRequest) {
  try {
    // Test if Resend API key is configured
    const hasResendKey = !!process.env.RESEND_API_KEY
    
    if (!hasResendKey) {
      return NextResponse.json({
        success: false,
        error: 'RESEND_API_KEY not configured',
        message: 'Please add RESEND_API_KEY to your environment variables'
      })
    }

    // Test sending a simple email
    const emailResult = await EmailService.sendWelcomeEmail({
      userEmail: 'test@example.com',
      userName: 'Test User',
      signupDate: new Date().toISOString(),
      trialEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 1 day from now
    })

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Email service is working correctly',
        emailId: emailResult.emailId,
        config: {
          hasResendKey: true,
          resendKeyLength: process.env.RESEND_API_KEY?.length || 0,
          resendKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 10) || 'N/A'
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: emailResult.error || 'Failed to send email',
        config: {
          hasResendKey: true,
          resendKeyLength: process.env.RESEND_API_KEY?.length || 0,
          resendKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 10) || 'N/A'
        }
      })
    }
  } catch (error) {
    console.error('Error in test-email-simple:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      config: {
        hasResendKey: !!process.env.RESEND_API_KEY,
        resendKeyLength: process.env.RESEND_API_KEY?.length || 0,
        resendKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 10) || 'N/A'
      }
    }, { status: 500 })
  }
}
