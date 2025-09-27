import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { EmailService } from '@/lib/email-service'
import { NotificationService } from '@/lib/notification-service'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (you can add additional verification)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    
    // Find users whose trial expires in 12 hours and haven't received reminder
    const twelveHoursFromNow = new Date()
    twelveHoursFromNow.setHours(twelveHoursFromNow.getHours() + 12)
    
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select(`
        id,
        subscription_status,
        subscription_ends_at,
        trial_reminder_sent,
        user_email:auth.users(email, user_metadata)
      `)
      .eq('subscription_status', 'trial')
      .eq('trial_reminder_sent', false)
      .lte('subscription_ends_at', twelveHoursFromNow.toISOString())

    if (usersError) {
      console.error('Error fetching trial users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch trial users' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ 
        message: 'No users need trial reminders',
        count: 0 
      })
    }

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Send reminder emails
    for (const user of users) {
      try {
        const userEmail = user.user_email?.email
        if (!userEmail) {
          console.warn(`No email found for user ${user.id}`)
          errorCount++
          continue
        }

        // Check if user wants email notifications
        const shouldSendEmail = await NotificationService.shouldSendEmail(user.id)
        if (!shouldSendEmail) {
          console.log(`User ${user.id} has disabled email notifications, skipping trial reminder`)
          continue
        }

        const trialEndDate = new Date(user.subscription_ends_at)
        const daysLeft = Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        
        if (daysLeft <= 0) {
          console.warn(`Trial already expired for user ${user.id}`)
          continue
        }

        const emailResult = await EmailService.sendTrialReminder({
          userEmail,
          userName: user.user_email?.user_metadata?.full_name,
          daysLeft
        })

        if (emailResult.success) {
          // Mark reminder as sent
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              trial_reminder_sent: true,
              trial_reminder_sent_at: new Date().toISOString()
            })
            .eq('id', user.id)

          if (updateError) {
            console.error(`Error updating reminder status for user ${user.id}:`, updateError)
          }

          successCount++
          console.log(`Trial reminder sent to ${userEmail}`)
        } else {
          errorCount++
          errors.push(`${userEmail}: ${emailResult.error}`)
          console.error(`Failed to send reminder to ${userEmail}:`, emailResult.error)
        }
      } catch (error) {
        errorCount++
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`${user.id}: ${errorMsg}`)
        console.error(`Error processing user ${user.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Trial reminder processing completed',
      stats: {
        total: users.length,
        successful: successCount,
        errors: errorCount,
        errorsList: errors
      }
    })
  } catch (error) {
    console.error('Error in send-trial-reminders cron:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
