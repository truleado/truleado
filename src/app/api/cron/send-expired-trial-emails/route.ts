import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { EmailService } from '@/lib/email-service'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    
    // Find users whose trial has expired in the last 2 hours and haven't received expired email
    const twoHoursAgo = new Date()
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2)
    
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select(`
        id,
        subscription_status,
        subscription_ends_at,
        trial_expired_email_sent,
        user_email:auth.users(email, user_metadata)
      `)
      .eq('subscription_status', 'trial')
      .eq('trial_expired_email_sent', false)
      .lte('subscription_ends_at', twoHoursAgo.toISOString())

    if (usersError) {
      console.error('Error fetching expired trial users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch expired trial users' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ 
        message: 'No users with expired trials need emails',
        count: 0 
      })
    }

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Send expired trial emails
    for (const user of users) {
      try {
        const userEmail = user.user_email?.email
        if (!userEmail) {
          console.warn(`No email found for user ${user.id}`)
          errorCount++
          continue
        }

        const emailResult = await EmailService.sendTrialReminder({
          userEmail,
          userName: user.user_email?.user_metadata?.full_name,
          daysLeft: 0 // Expired
        })

        if (emailResult.success) {
          // Mark expired email as sent
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              trial_expired_email_sent: true,
              trial_expired_email_sent_at: new Date().toISOString()
            })
            .eq('id', user.id)

          if (updateError) {
            console.error(`Error updating expired email status for user ${user.id}:`, updateError)
          }

          successCount++
          console.log(`Expired trial email sent to ${userEmail}`)
        } else {
          errorCount++
          errors.push(`${userEmail}: ${emailResult.error}`)
          console.error(`Failed to send expired email to ${userEmail}:`, emailResult.error)
        }
      } catch (error) {
        errorCount++
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`${user.id}: ${errorMsg}`)
        console.error(`Error processing expired user ${user.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Expired trial email processing completed',
      stats: {
        total: users.length,
        successful: successCount,
        errors: errorCount,
        errorsList: errors
      }
    })
  } catch (error) {
    console.error('Error in send-expired-trial-emails cron:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
