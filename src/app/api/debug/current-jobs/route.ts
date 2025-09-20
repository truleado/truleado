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

    // Get all background jobs for the user
    const { data: jobs, error: jobsError } = await supabase
      .from('background_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    // Get all products for the user
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .eq('user_id', user.id)

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Get Reddit connection status
    const { data: apiKeys, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('reddit_access_token, reddit_username')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      userId: user.id,
      redditConnected: !!(apiKeys && apiKeys.reddit_access_token),
      redditUsername: apiKeys?.reddit_username || null,
      totalJobs: jobs?.length || 0,
      activeJobs: jobs?.filter((job: any) => job.status === 'active').length || 0,
      jobs: jobs || [],
      products: products || [],
      errors: {
        apiKeysError: apiKeysError?.message
      }
    })
  } catch (error) {
    console.error('Debug jobs error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to debug jobs'
    }, { status: 500 })
  }
}
