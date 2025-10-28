import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { sendWelcomeEmailDirect } from '@/lib/direct-email-service'
// import { createHubSpotContact, convertUserToHubSpotContact } from '@/lib/hubspot-service'


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

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    // Check if welcome email was already sent
    if (profile.welcome_email_sent) {
      console.log('Welcome email already sent for user:', userId)
      return NextResponse.json({ message: 'Welcome email already sent' })
    }

    // Calculate trial end date (7 days from now)
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 7)

    // Set up trial for the user
    const { error: trialError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'trial',
        trial_ends_at: trialEndDate.toISOString(),
        trial_count: 1,
        last_trial_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (trialError) {
      console.error('Error setting up trial for user:', trialError)
      return NextResponse.json({ error: 'Failed to set up trial' }, { status: 500 })
    }

    console.log('Trial set up for user:', userId, 'trial ends at:', trialEndDate.toISOString())

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

    // Push user to HubSpot (async, non-blocking)
    // Temporarily disabled to test signup issue
    // try {
    //   const hubspotContact = convertUserToHubSpotContact(
    //     userEmail,
    //     userName,
    //     userId,
    //     profile.created_at
    //   )
    //   
    //   const hubspotResult = await createHubSpotContact(hubspotContact)
    //   
    //   if (hubspotResult.success) {
    //     console.log('✅ HubSpot: User pushed successfully:', userEmail)
    //   } else {
    //     console.warn('⚠️  HubSpot: Failed to push user:', hubspotResult.error)
    //   }
    // } catch (hubspotError) {
    //   // Never let HubSpot errors break user signup
    //   console.error('HubSpot integration error (non-blocking):', hubspotError)
    // }

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
