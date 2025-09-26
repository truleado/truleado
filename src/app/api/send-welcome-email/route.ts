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

    // Get user profile to check if welcome email was already sent
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('welcome_email_sent, subscription_ends_at')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    // Check if welcome email was already sent
    if (profile.welcome_email_sent) {
      return NextResponse.json({ 
        message: 'Welcome email already sent',
        alreadySent: true 
      })
    }

    // Calculate trial end date (14 days from now)
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 14)

    // Send welcome email
    const emailResult = await EmailService.sendWelcomeEmail({
      userEmail: user.email!,
      userName: user.user_metadata?.full_name,
      signupDate: new Date().toISOString(),
      trialEndDate: trialEndDate.toISOString()
    })

    if (emailResult.success) {
      // Mark welcome email as sent
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          welcome_email_sent: true,
          welcome_email_sent_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating welcome email status:', updateError)
        // Don't fail the request, email was sent successfully
      }

      return NextResponse.json({
        success: true,
        message: 'Welcome email sent successfully',
        emailId: emailResult.emailId
      })
    } else {
      return NextResponse.json({
        success: false,
        error: emailResult.error || 'Failed to send welcome email'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in send-welcome-email:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
