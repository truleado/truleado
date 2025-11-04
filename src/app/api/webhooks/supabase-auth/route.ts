import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { sendWelcomeEmailDirect } from '@/lib/direct-email-service'


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
    const supabase = await createClient()
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('welcome_email_sent, created_at')
      .eq('id', userId)
      .single()

    // If profile doesn't exist yet, wait a moment and retry
    if (profileError && profileError.code === 'PGRST116') {
      console.log('Profile not found yet, waiting for trigger to complete...')
      
      // Retry up to 3 times with increasing delays
      let retryProfile
      let retryError
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`Retry attempt ${attempt}/3...`)
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt)) // 2s, 4s, 6s delays
        
        const { data, error } = await supabase
          .from('profiles')
          .select('welcome_email_sent, created_at')
          .eq('id', userId)
          .single()
        
        retryProfile = data
        retryError = error
        
        if (!retryError) {
          console.log(`Profile found on attempt ${attempt}`)
          break
        }
        
        if (attempt === 3) {
          console.error('Profile still not found after 3 retries')
        }
      }

      if (retryError) {
        console.error('Error fetching user profile after all retries:', retryError)
        return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
      }
      
      const finalProfile = retryProfile
      
      // Check if welcome email was already sent
      if (finalProfile.welcome_email_sent) {
        console.log('Welcome email already sent for user:', userId)
        return NextResponse.json({ message: 'Welcome email already sent' })
      }

      // Use retry profile's created_at
      var profileCreatedAt = finalProfile.created_at
    } else {
      if (profileError) {
        console.error('Error fetching user profile:', profileError)
        return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
      }

      // Check if welcome email was already sent
      if (profile.welcome_email_sent) {
        console.log('Welcome email already sent for user:', userId)
        return NextResponse.json({ message: 'Welcome email already sent' })
      }

      var profileCreatedAt = profile.created_at
    }

    // Set subscription status to expired - users must pay before using product
    // No free trials available
    const { error: subscriptionError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'expired'
      })
      .eq('id', userId)

    if (subscriptionError) {
      console.error('Error setting subscription status for user:', subscriptionError)
      // Don't fail the webhook if this fails - profile was created by trigger
    }

    console.log('New user registered:', userId, '- Subscription status set to expired (payment required)')

    // Send welcome email using the new service
    const emailResult = await sendWelcomeEmailDirect(userEmail, userName || 'User')

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
    } else {
      console.error('Failed to send welcome email:', emailResult.error)
      // Don't fail the webhook if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'User processed successfully',
      emailId: emailResult.result?.emailId
    })
  } catch (error) {
    console.error('Error in supabase-auth webhook:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
