import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { EmailService } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, record } = body

    // Only handle new user signups
    if (type !== 'INSERT' || !record) {
      return NextResponse.json({ message: 'Not a user signup event' })
    }

    const userId = record.id
    const userEmail = record.email
    const userName = record.user_metadata?.full_name

    console.log('New user signup detected:', { userId, userEmail, userName })

    // Check if this is a new signup (not just a login)
    const supabase = createClient()
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('welcome_email_sent, created_at')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    // Check if welcome email was already sent
    if (profile.welcome_email_sent) {
      console.log('Welcome email already sent for user:', userId)
      return NextResponse.json({ message: 'Welcome email already sent' })
    }

    // Calculate trial end date (1 day from now)
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 1)

    // Send welcome email
    const emailResult = await EmailService.sendWelcomeEmail({
      userEmail,
      userName,
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
        .eq('id', userId)

      if (updateError) {
        console.error('Error updating welcome email status:', updateError)
        // Don't fail the request, email was sent successfully
      }

      console.log('Welcome email sent successfully for user:', userId)
      return NextResponse.json({
        success: true,
        message: 'Welcome email sent successfully',
        emailId: emailResult.emailId
      })
    } else {
      console.error('Failed to send welcome email:', emailResult.error)
      return NextResponse.json({
        success: false,
        error: emailResult.error || 'Failed to send welcome email'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in supabase-auth webhook:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
