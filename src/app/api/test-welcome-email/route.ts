import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { EmailService } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate trial end date (1 day from now)
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 1)

    // Send test welcome email
    const emailResult = await EmailService.sendWelcomeEmail({
      userEmail: user.email!,
      userName: user.user_metadata?.full_name,
      signupDate: new Date().toISOString(),
      trialEndDate: trialEndDate.toISOString()
    })

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Test welcome email sent successfully',
        emailId: emailResult.emailId,
        recipient: user.email
      })
    } else {
      return NextResponse.json({
        success: false,
        error: emailResult.error || 'Failed to send welcome email'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in test-welcome-email:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
