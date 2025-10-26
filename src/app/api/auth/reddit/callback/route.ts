import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('Reddit OAuth error:', error)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=reddit_auth_failed`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=missing_params`)
    }

    // Decode state to get user ID
    const decodedState = Buffer.from(state, 'base64').toString('utf-8')
    const [userId] = decodedState.split(':')

    // Get user to verify
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user || user.id !== userId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=unauthorized`)
    }

    // Exchange code for tokens
    const clientId = process.env.REDDIT_OAUTH_CLIENT_ID
    const clientSecret = process.env.REDDIT_OAUTH_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/reddit/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=not_configured`)
    }

    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'User-Agent': 'Truleado/1.0'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    })

    if (!tokenResponse.ok) {
      console.error('Reddit token exchange failed:', await tokenResponse.text())
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=token_exchange_failed`)
    }

    const tokenData = await tokenResponse.json()

    // Get Reddit username
    const userResponse = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': 'Truleado/1.0'
      }
    })

    let redditUsername = null
    if (userResponse.ok) {
      const userData = await userResponse.json()
      redditUsername = userData.name
    }

    // Calculate expiration time (Reddit tokens expire in 1 hour, refresh tokens are permanent)
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 3600))

    // First, check if api_keys record exists
    const { data: existingKey } = await supabase
      .from('api_keys')
      .select('id')
      .eq('user_id', user.id)
      .single()

    // Store tokens in database
    let dbError
    if (existingKey) {
      // Update existing record
      const { error } = await supabase
        .from('api_keys')
        .update({
          reddit_access_token: tokenData.access_token,
          reddit_refresh_token: tokenData.refresh_token,
          reddit_token_expires_at: expiresAt.toISOString(),
          reddit_username: redditUsername,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
      dbError = error
    } else {
      // Insert new record
      const { error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          reddit_access_token: tokenData.access_token,
          reddit_refresh_token: tokenData.refresh_token,
          reddit_token_expires_at: expiresAt.toISOString(),
          reddit_username: redditUsername,
          updated_at: new Date().toISOString()
        })
      dbError = error
    }

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=database_error`)
    }

    // Redirect back to settings with success
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?tab=reddit&success=connected`)
  } catch (error) {
    console.error('Reddit callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=callback_error`)
  }
}

