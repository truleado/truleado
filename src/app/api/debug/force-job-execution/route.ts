import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getJobScheduler } from '@/lib/job-scheduler'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all products for the user
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)

    if (productsError || !products || products.length === 0) {
      return NextResponse.json({ 
        error: 'No products found. Please create a product first.',
        productsError: productsError?.message
      }, { status: 404 })
    }

    // Get Reddit API keys
    const { data: apiKeys, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('reddit_access_token, reddit_token_expires_at')
      .eq('user_id', user.id)
      .single()

    if (apiKeysError || !apiKeys?.reddit_access_token) {
      return NextResponse.json({ 
        error: 'Reddit account not connected. Please connect your Reddit account first.',
        apiKeysError: apiKeysError?.message
      }, { status: 400 })
    }

    // Check if token is expired
    const isTokenExpired = apiKeys.reddit_token_expires_at && 
      new Date(apiKeys.reddit_token_expires_at) <= new Date()

    if (isTokenExpired) {
      return NextResponse.json({ 
        error: 'Reddit token is expired. Please reconnect your Reddit account.',
        tokenExpires: apiKeys.reddit_token_expires_at
      }, { status: 400 })
    }

    // Start the job scheduler if not running
    const jobScheduler = getJobScheduler()
    if (!jobScheduler.isRunning) {
      await jobScheduler.start()
    }

    // Force process jobs immediately
    console.log('Force processing jobs...')
    await jobScheduler.processJobs()

    // Get recent leads count
    const { data: recentLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id, created_at, title, relevance_score')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      message: 'Job execution forced successfully',
      user: {
        id: user.id,
        email: user.email
      },
      products: {
        count: products.length,
        names: products.map(p => p.name)
      },
      reddit: {
        hasToken: !!apiKeys.reddit_access_token,
        tokenExpires: apiKeys.reddit_token_expires_at,
        isExpired: isTokenExpired
      },
      jobScheduler: {
        running: jobScheduler.isRunning
      },
      recentLeads: {
        count: recentLeads?.length || 0,
        leads: recentLeads || []
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in force job execution:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to force job execution'
    }, { status: 500 })
  }
}
