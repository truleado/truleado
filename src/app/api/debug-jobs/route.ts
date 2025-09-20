import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all background jobs for this user
    const { data: jobs, error: jobsError } = await supabase
      .from('background_jobs')
      .select('*')
      .eq('user_id', user.id)

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    // Get user's products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Get user's Reddit tokens
    const { data: apiKeys, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('reddit_access_token, reddit_refresh_token, reddit_token_expires_at, reddit_username')
      .eq('user_id', user.id)
      .single()

    // Get recent leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      jobs: jobs || [],
      products: products || [],
      redditTokens: apiKeys ? {
        hasAccessToken: !!apiKeys.reddit_access_token,
        hasRefreshToken: !!apiKeys.reddit_refresh_token,
        tokenExpiresAt: apiKeys.reddit_token_expires_at,
        username: apiKeys.reddit_username,
        isExpired: apiKeys.reddit_token_expires_at ? new Date(apiKeys.reddit_token_expires_at) <= new Date() : true
      } : null,
      recentLeads: leads || [],
      debug: {
        totalJobs: jobs?.length || 0,
        activeJobs: jobs?.filter((job: any) => job.status === 'active').length || 0,
        totalProducts: products?.length || 0,
        totalLeads: leads?.length || 0
      }
    })

  } catch (error) {
    console.error('Debug jobs error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to debug jobs'
    }, { status: 500 })
  }
}
