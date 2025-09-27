import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { NotificationService } from '@/lib/notification-service'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    
    // Calculate date range for this week
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7) // 7 days ago
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(now)
    weekEnd.setHours(23, 59, 59, 999)

    // Get all active users who should receive weekly reports
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select(`
        id,
        user_email:auth.users(email, user_metadata)
      `)
      .in('subscription_status', ['trial', 'active'])

    if (usersError) {
      console.error('Error fetching users for weekly reports:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ 
        message: 'No users need weekly reports',
        count: 0 
      })
    }

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Send weekly reports to each user
    for (const user of users) {
      try {
        const userEmail = user.user_email?.email
        if (!userEmail) {
          console.warn(`No email found for user ${user.id}`)
          errorCount++
          continue
        }

        // Get user's leads for this week
        const { data: leads, error: leadsError } = await supabase
          .from('leads')
          .select(`
            id,
            subreddit,
            created_at,
            product_id,
            products(name)
          `)
          .eq('user_id', user.id)
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', weekEnd.toISOString())

        if (leadsError) {
          console.error(`Error fetching leads for user ${user.id}:`, leadsError)
          errorCount++
          continue
        }

        const totalLeads = leads?.length || 0
        const newLeads = totalLeads // All leads in this period are "new"

        // Get top subreddits
        const subredditCounts: { [key: string]: number } = {}
        leads?.forEach(lead => {
          const subreddit = lead.subreddit
          subredditCounts[subreddit] = (subredditCounts[subreddit] || 0) + 1
        })
        
        const topSubreddits = Object.entries(subredditCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

        // Get top products
        const productCounts: { [key: string]: number } = {}
        leads?.forEach(lead => {
          const productName = lead.products?.name || 'Unknown'
          productCounts[productName] = (productCounts[productName] || 0) + 1
        })
        
        const topProducts = Object.entries(productCounts)
          .map(([name, leads]) => ({ name, leads }))
          .sort((a, b) => b.leads - a.leads)
          .slice(0, 5)

        // Send weekly report
        const reportResult = await NotificationService.sendWeeklyReport({
          userId: user.id,
          userName: user.user_email?.user_metadata?.full_name || 'User',
          userEmail: userEmail,
          weekStart: weekStart.toISOString().split('T')[0],
          weekEnd: weekEnd.toISOString().split('T')[0],
          totalLeads,
          newLeads,
          topSubreddits,
          topProducts
        })

        if (reportResult.success) {
          successCount++
          console.log(`Weekly report sent to ${userEmail}`)
        } else {
          errorCount++
          errors.push(`${userEmail}: ${reportResult.error}`)
          console.error(`Failed to send weekly report to ${userEmail}:`, reportResult.error)
        }
      } catch (error) {
        errorCount++
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`${user.id}: ${errorMsg}`)
        console.error(`Error processing weekly report for user ${user.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Weekly report processing completed',
      stats: {
        total: users.length,
        successful: successCount,
        errors: errorCount,
        errorsList: errors
      }
    })
  } catch (error) {
    console.error('Error in send-weekly-reports cron:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
