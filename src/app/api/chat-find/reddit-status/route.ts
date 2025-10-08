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

    // Check if user has Reddit tokens
    const { data: apiKeys, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('reddit_access_token, reddit_token_expires_at, reddit_username')
      .eq('user_id', user.id)
      .single()

    const hasRedditToken = !apiKeysError && !!apiKeys?.reddit_access_token
    const tokenExpired = hasRedditToken && apiKeys?.reddit_token_expires_at && 
      new Date(apiKeys.reddit_token_expires_at) < new Date()

    return NextResponse.json({
      connected: hasRedditToken && !tokenExpired,
      hasToken: hasRedditToken,
      tokenExpired,
      username: apiKeys?.reddit_username,
      tokenExpiresAt: apiKeys?.reddit_token_expires_at,
      error: apiKeysError?.message
    })
  } catch (error) {
    console.error('Reddit status check error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
