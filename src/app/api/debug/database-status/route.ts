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

    // Get products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)

    // Get background jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('background_jobs')
      .select('*')
      .eq('user_id', user.id)

    // Get leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get Reddit API keys
    const { data: apiKeys, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('reddit_access_token, reddit_token_expires_at')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      products: {
        count: products?.length || 0,
        data: products || [],
        error: productsError?.message
      },
      jobs: {
        count: jobs?.length || 0,
        data: jobs || [],
        error: jobsError?.message
      },
      leads: {
        count: leads?.length || 0,
        data: leads || [],
        error: leadsError?.message
      },
      reddit: {
        hasToken: !!apiKeys?.reddit_access_token,
        tokenExpires: apiKeys?.reddit_token_expires_at,
        error: apiKeysError?.message
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to get database status'
    }, { status: 500 })
  }
}
