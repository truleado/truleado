import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { sendWelcomeEmailDirect } from '@/lib/direct-email-service'

// Zoho contact creation function for webhook
async function createZohoContactWebhook(email: string, fullName: string) {
  try {
    console.log('🔗 Creating Zoho contact for Google sign-in user:', email)
    
    // Split full name into first and last name
    const nameParts = fullName.trim().split(' ')
    const firstName = nameParts[0] || 'User'
    const lastName = nameParts.slice(1).join(' ') || ''

    // Get access token
    const tokenResponse = await fetch('https://accounts.zoho.in/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: '1000.82DRWH7GU91XIPF7ZN9Q3W9KZ770GY',
        client_secret: '30c61a291d791a0d1caa6e2ce193d069be007d6ea9',
        refresh_token: '1000.1aa3bd63937b5fb65d8e970165babc99.4df927f0368af5b8807bea0ee715c8cb',
      }),
    })

    if (!tokenResponse.ok) {
      console.warn('Failed to get Zoho access token for Google sign-in user')
      return
    }

    const tokenData = await tokenResponse.json()

    // Create contact in Zoho CRM
    const contactData = {
      First_Name: firstName,
      Last_Name: lastName,
      Email: email,
      Lead_Source: 'Truleado Website (Google Sign-in)',
      Lead_Status: 'Not Contacted',
      Company: 'Individual',
      Description: `New user signup via Google - ${fullName} (${email})`
    }

    const contactResponse = await fetch('https://www.zohoapis.in/crm/v2/Contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [contactData]
      }),
    })

    if (contactResponse.ok) {
      const result = await contactResponse.json()
      console.log('✅ Zoho contact created successfully for Google sign-in user:', result.data[0]?.details?.id)
    } else {
      const errorText = await contactResponse.text()
      console.warn('Failed to create Zoho contact for Google sign-in user:', errorText)
    }
  } catch (error) {
    console.warn('Zoho contact creation failed for Google sign-in user:', error)
  }
}

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

    // Calculate trial end date (1 day from now)
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 1)

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

    // Create Zoho contact for Google sign-in users
    if (userName) {
      createZohoContactWebhook(userEmail, userName).catch(err => 
        console.warn('Zoho contact creation failed for Google sign-in:', err)
      )
    }

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
        emailId: emailResult.result?.emailId
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
