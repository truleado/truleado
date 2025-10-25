import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current tokens
    const { data: apiKeys, error: apiKeysError } = await supabase
      .from('api_keys')
      .select('reddit_access_token, reddit_refresh_token, reddit_token_expires_at, reddit_username')
      .eq('user_id', user.id)
      .single()

    if (apiKeysError || !apiKeys?.reddit_refresh_token) {
      return NextResponse.json({ 
        success: false, 
        error: 'No refresh token available',
        connected: false 
      })
    }

    // Check if token is actually expired
    const isExpired = apiKeys.reddit_token_expires_at && 
      new Date(apiKeys.reddit_token_expires_at) <= new Date()

    if (!isExpired) {
      return NextResponse.json({ 
        success: true, 
        connected: true,
        username: apiKeys.reddit_username,
        message: 'Token is still valid'
      })
    }

    // Attempt to refresh the token
    const clientId = process.env.REDDIT_OAUTH_CLIENT_ID
    const clientSecret = process.env.REDDIT_OAUTH_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json({ 
        success: false, 
        error: 'Reddit OAuth credentials not configured',
        connected: false 
      })
    }

    console.log('Attempting to refresh Reddit token for user:', user.id)

    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'User-Agent': 'Truleado Lead Discovery Bot 1.0'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: apiKeys.reddit_refresh_token
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Reddit token refresh failed:', response.status, errorText)
      
      // If refresh fails, clear the tokens
      await supabase
        .from('api_keys')
        .update({
          reddit_access_token: null,
          reddit_refresh_token: null,
          reddit_token_expires_at: null,
          reddit_username: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      return NextResponse.json({ 
        success: false, 
        error: `Token refresh failed: ${response.status}`,
        connected: false 
      })
    }

    const data = await response.json()

    if (data.error) {
      console.error('Reddit API error during token refresh:', data.error)
      
      // Clear tokens on API error
      await supabase
        .from('api_keys')
        .update({
          reddit_access_token: null,
          reddit_refresh_token: null,
          reddit_token_expires_at: null,
          reddit_username: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      return NextResponse.json({ 
        success: false, 
        error: data.error,
        connected: false 
      })
    }

    // Update tokens in database
    const newTokens = {
      reddit_access_token: data.access_token,
      reddit_refresh_token: data.refresh_token || apiKeys.reddit_refresh_token,
      reddit_token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('api_keys')
      .update(newTokens)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Failed to update refreshed tokens:', updateError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save refreshed tokens',
        connected: false 
      })
    }

    console.log('Reddit token refreshed successfully for user:', user.id)

    return NextResponse.json({ 
      success: true, 
      connected: true,
      username: apiKeys.reddit_username,
      tokenExpiresAt: newTokens.reddit_token_expires_at,
      message: 'Token refreshed successfully'
    })

  } catch (error) {
    console.error('Reddit token refresh error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      connected: false 
    }, { status: 500 })
  }
}
