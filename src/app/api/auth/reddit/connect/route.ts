import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    // Generate OAuth URL
    const clientId = process.env.REDDIT_OAUTH_CLIENT_ID
    const scope = process.env.REDDIT_OAUTH_SCOPE || 'read,identity'
    const state = user.id // Use user ID as state for security

    // Build redirect URI dynamically based on environment
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`
    const redirectUri = `${baseUrl}/api/auth/reddit/callback`

    if (!clientId) {
      console.error('Reddit OAuth not configured:', { clientId: !!clientId })
      return NextResponse.redirect(new URL('/settings?error=oauth_not_configured', request.url))
    }

    const authUrl = `https://www.reddit.com/api/v1/authorize?client_id=${clientId}&response_type=code&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}&duration=permanent&scope=${scope}`

    // Redirect directly to Reddit OAuth
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Reddit OAuth connect error:', error)
    return NextResponse.redirect(new URL('/settings?error=oauth_connect_failed', request.url))
  }
}
