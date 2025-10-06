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

    console.log(`Lead discovery debug status for user: ${user.id}`)
    
    // Check Reddit connection
    const { data: apiKeys, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('reddit_access_token, reddit_token_expires_at, reddit_username, updated_at')
      .eq('user_id', user.id)
      .single()

    const redditStatus = {
      connected: !apiKeysError && !!apiKeys?.reddit_access_token,
      username: apiKeys?.reddit_username || null,
      tokenExpiresAt: apiKeys?.reddit_token_expires_at || null,
      tokenExpired: apiKeys?.reddit_token_expires_at ? 
        new Date(apiKeys.reddit_token_expires_at) < new Date() : true,
      lastUpdated: apiKeys?.updated_at || null,
      error: apiKeysError?.message || null
    }

    // Check user's products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, status, subreddits')
      .eq('user_id', user.id)

    const productsStatus = {
      count: products?.length || 0,
      active: products?.filter(p => p.status === 'active').length || 0,
      products: products || [],
      error: productsError?.message || null
    }

    // Check background jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('background_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const jobsStatus = {
      count: jobs?.length || 0,
      active: jobs?.filter(j => j.status === 'active').length || 0,
      paused: jobs?.filter(j => j.status === 'paused').length || 0,
      error: jobs?.filter(j => j.status === 'error').length || 0,
      jobs: jobs || [],
      error: jobsError?.message || null
    }

    // Check recent leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, created_at, product_id, lead_type')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    const leadsStatus = {
      recentCount: leads?.length || 0,
      recentLeads: leads || [],
      error: leadsError?.message || null
    }

    // Check job scheduler status
    const jobScheduler = getJobScheduler()
    const schedulerStatus = {
      isRunning: jobScheduler.isRunning,
      hasSupabase: !!jobScheduler.supabase
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      reddit: redditStatus,
      products: productsStatus,
      jobs: jobsStatus,
      leads: leadsStatus,
      scheduler: schedulerStatus,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in lead discovery debug:', error)
    return NextResponse.json({ 
      error: 'Failed to get debug status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
