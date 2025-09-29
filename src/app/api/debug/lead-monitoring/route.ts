import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getJobScheduler } from '@/lib/job-scheduler'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Check job scheduler status
    const jobScheduler = getJobScheduler()
    
    // 2. Get user's products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, subreddits, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', 'desc')

    // 3. Get user's background jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('background_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', 'desc')

    // 4. Get recent leads (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id, title, subreddit, relevance_score, created_at, product_id')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', 'desc')

    // 5. Get leads by day for the last 7 days
    const leadsByDay = {}
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      leadsByDay[dateStr] = 0
    }

    recentLeads?.forEach(lead => {
      const leadDate = lead.created_at.split('T')[0]
      if (leadsByDay[leadDate] !== undefined) {
        leadsByDay[leadDate]++
      }
    })

    // 6. Check for any active jobs that should be running
    const now = new Date()
    const activeJobs = jobs?.filter(job => job.status === 'active') || []
    const dueJobs = activeJobs.filter(job => {
      if (!job.next_run) return false
      return new Date(job.next_run) <= now
    })

    // 7. Check Reddit connection
    const { data: apiKeys, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('reddit_access_token, reddit_token_expires_at, reddit_username')
      .eq('user_id', user.id)
      .single()

    const redditConnected = !apiKeysError && apiKeys?.reddit_access_token
    const tokenExpired = redditConnected && apiKeys?.reddit_token_expires_at && 
      new Date(apiKeys.reddit_token_expires_at) < new Date()

    // 8. Analyze the situation
    const issues = []
    const recommendations = []

    if (!jobScheduler.isRunning) {
      issues.push('Job scheduler is not running')
      recommendations.push('Start the job scheduler immediately')
    }

    if (!redditConnected) {
      issues.push('Reddit account not connected')
      recommendations.push('Connect your Reddit account in Settings')
    }

    if (tokenExpired) {
      issues.push('Reddit token has expired')
      recommendations.push('Reconnect your Reddit account in Settings')
    }

    if (activeJobs.length === 0) {
      issues.push('No active background jobs found')
      recommendations.push('Start lead discovery for your products')
    }

    if (dueJobs.length > 0 && jobScheduler.isRunning) {
      issues.push(`${dueJobs.length} jobs are due to run but may not be processing`)
      recommendations.push('Check why due jobs are not being processed')
    }

    const totalLeadsLast7Days = recentLeads?.length || 0
    const daysWithLeads = Object.values(leadsByDay).filter(count => count > 0).length

    if (totalLeadsLast7Days === 0) {
      issues.push('No leads found in the last 7 days')
      recommendations.push('Check subreddits, search terms, and Reddit connection')
    } else if (daysWithLeads < 3) {
      issues.push(`Only ${daysWithLeads} days had leads in the last 7 days`)
      recommendations.push('Lead discovery may not be running consistently')
    }

    // 9. Calculate health score
    let healthScore = 0
    if (jobScheduler.isRunning) healthScore += 30
    if (redditConnected && !tokenExpired) healthScore += 30
    if (activeJobs.length > 0) healthScore += 20
    if (totalLeadsLast7Days > 0) healthScore += 20

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      scheduler: {
        running: jobScheduler.isRunning,
        message: jobScheduler.isRunning ? 'Job scheduler is running' : 'Job scheduler is NOT running'
      },
      reddit: {
        connected: redditConnected,
        username: apiKeys?.reddit_username,
        tokenExpired: tokenExpired,
        tokenExpiresAt: apiKeys?.reddit_token_expires_at
      },
      products: {
        count: products?.length || 0,
        products: products?.map(p => ({
          id: p.id,
          name: p.name,
          subreddits: p.subreddits?.length || 0,
          status: p.status,
          createdAt: p.created_at
        })) || []
      },
      jobs: {
        total: jobs?.length || 0,
        active: activeJobs.length,
        due: dueJobs.length,
        jobs: activeJobs.map(job => ({
          id: job.id,
          productId: job.product_id,
          status: job.status,
          nextRun: job.next_run,
          isDue: new Date(job.next_run) <= now,
          runCount: job.run_count,
          lastRun: job.last_run,
          errorMessage: job.error_message
        }))
      },
      leads: {
        last7Days: totalLeadsLast7Days,
        daysWithLeads: daysWithLeads,
        leadsByDay: leadsByDay,
        recentLeads: recentLeads?.slice(0, 10).map(lead => ({
          id: lead.id,
          title: lead.title,
          subreddit: lead.subreddit,
          relevanceScore: lead.relevance_score,
          createdAt: lead.created_at
        })) || []
      },
      analysis: {
        healthScore: healthScore,
        status: healthScore >= 80 ? 'Good' : healthScore >= 60 ? 'Warning' : 'Critical',
        issues: issues,
        recommendations: recommendations
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to run lead monitoring'
    }, { status: 500 })
  }
}
