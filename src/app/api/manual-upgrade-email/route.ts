import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { sendUpgradeThankYouEmail } from '@/lib/upgrade-email-service'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, name } = await request.json()

    if (!userId && !email) {
      return NextResponse.json({ error: 'userId or email is required' }, { status: 400 })
    }

    console.log('Manual upgrade email trigger:', { userId, email, name })

    let userEmail = email
    let userName = name

    // If only userId provided, fetch user details
    if (userId && !email) {
      const supabase = createClient()
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', userId)
        .single()

      if (profileError || !profile) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      userEmail = profile.email
      userName = profile.full_name
    }

    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
    }

    console.log('Sending manual upgrade email to:', userEmail, 'for:', userName)

    const emailResult = await sendUpgradeThankYouEmail(userEmail, userName || 'User', 'Pro')

    if (emailResult.success) {
      console.log('✅ Manual upgrade email sent successfully')
      return NextResponse.json({
        success: true,
        message: 'Upgrade thank you email sent successfully',
        emailId: emailResult.result?.emailId
      })
    } else {
      console.error('❌ Failed to send manual upgrade email:', emailResult.error)
      return NextResponse.json({
        success: false,
        error: emailResult.error || 'Failed to send upgrade email'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in manual upgrade email:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
