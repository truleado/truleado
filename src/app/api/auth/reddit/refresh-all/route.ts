import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    // Check for admin key to prevent unauthorized access
    const adminKey = request.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_REFRESH_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    
    // Get all users with Reddit tokens that expire soon (within 1 hour)
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('user_id, reddit_access_token, reddit_refresh_token, reddit_token_expires_at, reddit_username')
      .not('reddit_refresh_token', 'is', null)
      .not('reddit_access_token', 'is', null)
      .lte('reddit_token_expires_at', oneHourFromNow)

    if (error) {
      console.error('Error fetching tokens for refresh:', error)
      return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 })
    }

    if (!apiKeys || apiKeys.length === 0) {
      return NextResponse.json({ 
        message: 'No tokens need refreshing',
        refreshed: 0,
        failed: 0
      })
    }

    const clientId = process.env.REDDIT_OAUTH_CLIENT_ID
    const clientSecret = process.env.REDDIT_OAUTH_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json({ 
        error: 'Reddit OAuth credentials not configured' 
      }, { status: 500 })
    }

    let refreshed = 0
    let failed = 0
    const results = []

    // Process tokens in batches to avoid overwhelming Reddit API
    for (const apiKey of apiKeys) {
      try {
        console.log(`Refreshing token for user: ${apiKey.user_id}`)
        
        const response = await fetch('https://www.reddit.com/api/v1/access_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            'User-Agent': 'Truleado Lead Discovery Bot 1.0'
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: apiKey.reddit_refresh_token
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Token refresh failed for user ${apiKey.user_id}:`, response.status, errorText)
          
          // Clear invalid tokens
          await supabase
            .from('api_keys')
            .update({
              reddit_access_token: null,
              reddit_refresh_token: null,
              reddit_token_expires_at: null,
              reddit_username: null,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', apiKey.user_id)

          results.push({ userId: apiKey.user_id, success: false, error: `HTTP ${response.status}` })
          failed++
          continue
        }

        const data = await response.json()

        if (data.error) {
          console.error(`Reddit API error for user ${apiKey.user_id}:`, data.error)
          
          // Clear invalid tokens
          await supabase
            .from('api_keys')
            .update({
              reddit_access_token: null,
              reddit_refresh_token: null,
              reddit_token_expires_at: null,
              reddit_username: null,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', apiKey.user_id)

          results.push({ userId: apiKey.user_id, success: false, error: data.error })
          failed++
          continue
        }

        // Update tokens in database
        const newTokens = {
          reddit_access_token: data.access_token,
          reddit_refresh_token: data.refresh_token || apiKey.reddit_refresh_token,
          reddit_token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }

        const { error: updateError } = await supabase
          .from('api_keys')
          .update(newTokens)
          .eq('user_id', apiKey.user_id)

        if (updateError) {
          console.error(`Failed to update tokens for user ${apiKey.user_id}:`, updateError)
          results.push({ userId: apiKey.user_id, success: false, error: 'Database update failed' })
          failed++
          continue
        }

        console.log(`Token refreshed successfully for user: ${apiKey.user_id}`)
        results.push({ userId: apiKey.user_id, success: true })
        refreshed++

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`Error refreshing token for user ${apiKey.user_id}:`, error)
        results.push({ 
          userId: apiKey.user_id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
        failed++
      }
    }

    return NextResponse.json({
      message: `Token refresh completed`,
      refreshed,
      failed,
      total: apiKeys.length,
      results
    })

  } catch (error) {
    console.error('Bulk token refresh error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
