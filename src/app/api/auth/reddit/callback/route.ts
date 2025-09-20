import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
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

    const supabase = await createClient()
    
    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user || user.id !== state) {
      return NextResponse.redirect(new URL('/settings?error=unauthorized', request.url))
    }

    // Exchange code for access token
    const clientId = process.env.REDDIT_OAUTH_CLIENT_ID
    const clientSecret = process.env.REDDIT_OAUTH_CLIENT_SECRET
    const redirectUri = process.env.REDDIT_OAUTH_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.redirect(new URL('/settings?error=oauth_not_configured', request.url))
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
      console.error('Failed to exchange code for token:', await tokenResponse.text())
      return NextResponse.redirect(new URL('/settings?error=token_exchange_failed', request.url))
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
      return NextResponse.redirect(new URL('/settings?error=user_info_failed', request.url))
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
      return NextResponse.redirect(new URL('/settings?error=token_storage_failed', request.url))
    }

    // Start lead discovery for all products after Reddit connection
    try {
      const { getJobScheduler } = await import('@/lib/job-scheduler')
      const jobScheduler = getJobScheduler()
      
      // Get all products for the user
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .eq('user_id', user.id)

      if (!productsError && products && products.length > 0) {
        for (const product of products) {
          try {
            await jobScheduler.createJob(user.id, product.id, 'reddit_monitoring', 60)
            console.log(`Auto-started lead discovery for product: ${product.name}`)
          } catch (jobError) {
            console.error(`Failed to start lead discovery for product ${product.name}:`, jobError)
          }
        }
      }
    } catch (jobError) {
      console.error('Failed to start lead discovery after Reddit connection:', jobError)
      // Don't fail the OAuth flow if job creation fails
    }

    return NextResponse.redirect(new URL('/settings?success=reddit_connected', request.url))
  } catch (error) {
    console.error('Reddit OAuth callback error:', error)
    return NextResponse.redirect(new URL('/settings?error=oauth_callback_failed', request.url))
  }
}
