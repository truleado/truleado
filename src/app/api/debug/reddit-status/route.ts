import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getRedditClient } from '@/lib/reddit-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Reddit API keys
    const { data: apiKeys, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('reddit_access_token, reddit_refresh_token, reddit_token_expires_at, reddit_username')
      .eq('user_id', user.id)
      .single()

    // Test Reddit client
    let redditClientStatus = null
    try {
      const redditClient = getRedditClient(user.id)
      redditClientStatus = {
        isInitialized: redditClient.isInitialized,
        userId: redditClient.userId
      }
    } catch (redditError) {
      redditClientStatus = {
        error: redditError instanceof Error ? redditError.message : 'Unknown error'
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      reddit: {
        hasAccessToken: !!apiKeys?.reddit_access_token,
        hasRefreshToken: !!apiKeys?.reddit_refresh_token,
        tokenExpires: apiKeys?.reddit_token_expires_at,
        username: apiKeys?.reddit_username,
        isExpired: apiKeys?.reddit_token_expires_at ? 
          new Date(apiKeys.reddit_token_expires_at) <= new Date() : null,
        error: apiKeysError?.message
      },
      redditClient: redditClientStatus,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to get Reddit status'
    }, { status: 500 })
  }
}
