import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('Reddit OAuth error:', error)
      return NextResponse.redirect(new URL('/settings?error=reddit_oauth_failed', request.url))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/settings?error=missing_oauth_params', request.url))
    }

    // Add timeout protection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('OAuth callback timeout')), 25000) // 25 second timeout
    })

    const oauthPromise = (async () => {
      const supabase = await createClient()
      
      // Verify the user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user || user.id !== state) {
        throw new Error('Unauthorized user')
      }

      // Exchange code for access token
      const clientId = process.env.REDDIT_OAUTH_CLIENT_ID
      const clientSecret = process.env.REDDIT_OAUTH_CLIENT_SECRET
      const redirectUri = process.env.REDDIT_OAUTH_REDIRECT_URI

      console.log('OAuth callback debug:', {
        clientId,
        redirectUri,
        hasClientSecret: !!clientSecret,
        code: code?.substring(0, 10) + '...',
        state
      })

      if (!clientId || !clientSecret || !redirectUri) {
        console.error('Missing OAuth configuration:', { clientId: !!clientId, clientSecret: !!clientSecret, redirectUri: !!redirectUri })
        throw new Error('OAuth not configured')
      }

      const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'User-Agent': 'Truleado Lead Discovery Bot 1.0'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri
        })
      })

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        console.error('Failed to exchange code for token:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          error: errorText,
          requestUrl: request.url,
          redirectUri,
          clientId
        })
        throw new Error('Token exchange failed')
      }

      const tokenData = await tokenResponse.json()
      const { access_token, refresh_token, expires_in } = tokenData

      // Get user info from Reddit
      const userInfoResponse = await fetch('https://oauth.reddit.com/api/v1/me', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'User-Agent': 'Truleado Lead Discovery Bot 1.0'
        }
      })

      if (!userInfoResponse.ok) {
        console.error('Failed to get Reddit user info:', await userInfoResponse.text())
        throw new Error('User info failed')
      }

      const redditUser = await userInfoResponse.json()

      // Store tokens in database
      const { error: upsertError } = await supabase
        .from('api_keys')
        .upsert({
          user_id: user.id,
          reddit_client_id: clientId,
          reddit_client_secret: clientSecret,
          reddit_access_token: access_token,
          reddit_refresh_token: refresh_token,
          reddit_token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
          reddit_username: redditUser.name,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (upsertError) {
        console.error('Failed to store Reddit tokens:', upsertError)
        throw new Error('Token storage failed')
      }

      // Note: Lead discovery jobs will be started automatically by the job scheduler
      // No need to start them immediately here to avoid timeout issues
      console.log('Reddit OAuth completed successfully. Lead discovery will start automatically.')

      return NextResponse.redirect(new URL('/products?reddit_connected=true', request.url))
    })()

    // Race between OAuth process and timeout
    const result = await Promise.race([oauthPromise, timeoutPromise])
    return result

  } catch (error) {
    const elapsedTime = Date.now() - startTime
    console.error('Reddit OAuth callback error:', error, `(took ${elapsedTime}ms)`)
    
    // Determine error type and redirect accordingly
    if (error.message === 'OAuth callback timeout') {
      return NextResponse.redirect(new URL('/settings?error=oauth_timeout', request.url))
    } else if (error.message === 'Unauthorized user') {
      return NextResponse.redirect(new URL('/settings?error=unauthorized', request.url))
    } else if (error.message === 'OAuth not configured') {
      return NextResponse.redirect(new URL('/settings?error=oauth_not_configured', request.url))
    } else if (error.message === 'Token exchange failed') {
      return NextResponse.redirect(new URL('/settings?error=token_exchange_failed', request.url))
    } else if (error.message === 'User info failed') {
      return NextResponse.redirect(new URL('/settings?error=user_info_failed', request.url))
    } else if (error.message === 'Token storage failed') {
      return NextResponse.redirect(new URL('/settings?error=token_storage_failed', request.url))
    } else {
      return NextResponse.redirect(new URL('/settings?error=oauth_callback_failed', request.url))
    }
  }
}
