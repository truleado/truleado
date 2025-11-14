export const dynamic = 'force-dynamic';
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

    // 1. Check Reddit connection
    const { data: apiKeys, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('reddit_access_token, reddit_username, reddit_token_expires_at')
      .eq('user_id', user.id)
      .single()

    const redditConnected = !apiKeysError && apiKeys?.reddit_access_token
    const redditTokenExpired = redditConnected && apiKeys?.reddit_token_expires_at && 
      new Date(apiKeys.reddit_token_expires_at) < new Date()

    // 2. Check user's products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, subreddits, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', 'desc')

    // 3. Check background jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('background_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', 'desc')

    // 4. Check recent leads
    const { data: recentLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id, title, subreddit, relevance_score, created_at, product_id')
      .eq('user_id', user.id)
      .order('created_at', 'desc')
      .limit(10)

    // 5. Check job scheduler status
    const jobScheduler = getJobScheduler()
    const schedulerRunning = jobScheduler.isRunning

    // 6. Analyze job status
    const activeJobs = jobs?.filter(job => job.status === 'active') || []
    const dueJobs = activeJobs.filter(job => {
      if (!job.next_run) return false
      return new Date(job.next_run) <= new Date()
    })

    // 7. Check for issues
    const issues = []
    
    if (!redditConnected) {
      issues.push('Reddit account not connected')
    }
    
    if (redditTokenExpired) {
      issues.push('Reddit token has expired - needs refresh')
    }
    
    if (!products || products.length === 0) {
      issues.push('No products found - add a product first')
    }
    
    if (activeJobs.length === 0) {
      issues.push('No active background jobs found')
    }
    
    if (dueJobs.length > 0) {
      issues.push(`${dueJobs.length} jobs are due to run but scheduler may not be processing them`)
    }
    
    if (!schedulerRunning) {
      issues.push('Job scheduler is not running')
    }

    // 8. Get recent activity summary
    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const leadsLast24h = recentLeads?.filter(lead => 
      new Date(lead.created_at) > last24Hours
    ).length || 0
    
    const leadsLast7d = recentLeads?.filter(lead => 
      new Date(lead.created_at) > last7Days
    ).length || 0

    // 9. Calculate health score
    let healthScore = 0
    if (redditConnected) healthScore += 25
    if (!redditTokenExpired) healthScore += 25
    if (products && products.length > 0) healthScore += 25
    if (activeJobs.length > 0) healthScore += 15
    if (schedulerRunning) healthScore += 10

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      reddit: {
        connected: redditConnected,
        username: apiKeys?.reddit_username,
        tokenExpired: redditTokenExpired,
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
          isDue: new Date(job.next_run) <= new Date(),
          createdAt: job.created_at
        }))
      },
      scheduler: {
        running: schedulerRunning,
        message: schedulerRunning ? 'Job scheduler is running' : 'Job scheduler is not running'
      },
      leads: {
        recent: recentLeads?.length || 0,
        last24h: leadsLast24h,
        last7d: leadsLast7d,
        recentLeads: recentLeads?.map(lead => ({
          id: lead.id,
          title: lead.title,
          subreddit: lead.subreddit,
          relevanceScore: lead.relevance_score,
          createdAt: lead.created_at
        })) || []
      },
      health: {
        score: healthScore,
        status: healthScore >= 80 ? 'Good' : healthScore >= 60 ? 'Warning' : 'Critical',
        issues: issues
      },
      recommendations: [
        !redditConnected ? 'Connect your Reddit account in Settings' : null,
        redditTokenExpired ? 'Refresh your Reddit token in Settings' : null,
        (!products || products.length === 0) ? 'Add a product to start finding leads' : null,
        activeJobs.length === 0 ? 'Start lead discovery for your products' : null,
        !schedulerRunning ? 'Start the job scheduler to process background jobs' : null,
        dueJobs.length > 0 ? 'Check why due jobs are not being processed' : null,
        leadsLast24h === 0 ? 'No leads found in last 24 hours - check subreddits and search terms' : null
      ].filter(Boolean)
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to run diagnostic'
    }, { status: 500 })
  }
}
