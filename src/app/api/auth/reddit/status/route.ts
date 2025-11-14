export const dynamic = 'force-dynamic';
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
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('reddit_access_token, reddit_refresh_token, reddit_username, reddit_token_expires_at')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking Reddit connection:', error)
      return NextResponse.json({ error: 'Failed to check Reddit connection' }, { status: 500 })
    }

    // If no tokens at all
    if (!apiKeys || !apiKeys.reddit_access_token) {
      return NextResponse.json({
        connected: false,
        username: null,
        hasToken: false,
        tokenExpired: false
      })
    }

    // Check if token is expired
    const isExpired = apiKeys.reddit_token_expires_at && 
      new Date(apiKeys.reddit_token_expires_at) <= new Date()

    // If token is expired but we have a refresh token, try to refresh
    if (isExpired && apiKeys.reddit_refresh_token) {
      console.log('Reddit token expired, attempting automatic refresh for user:', user.id)
      
      try {
        const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/reddit/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || ''
          }
        })

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          if (refreshData.success) {
            console.log('Token automatically refreshed for user:', user.id)
            return NextResponse.json({
              connected: true,
              username: refreshData.username,
              hasToken: true,
              tokenExpired: false,
              autoRefreshed: true
            })
          }
        }
      } catch (refreshError) {
        console.error('Automatic token refresh failed:', refreshError)
      }
    }

    const isConnected = !isExpired

    return NextResponse.json({
      connected: isConnected,
      username: isConnected ? apiKeys.reddit_username : null,
      hasToken: true,
      tokenExpired: isExpired,
      tokenExpiresAt: apiKeys.reddit_token_expires_at
    })
  } catch (error) {
    console.error('Reddit status check error:', error)
    return NextResponse.json({ error: 'Failed to check Reddit status' }, { status: 500 })
  }
}
