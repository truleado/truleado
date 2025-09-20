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

    // Generate OAuth URL
    const clientId = process.env.REDDIT_OAUTH_CLIENT_ID
    const redirectUri = process.env.REDDIT_OAUTH_REDIRECT_URI
    const scope = process.env.REDDIT_OAUTH_SCOPE || 'read,identity'
    const state = user.id // Use user ID as state for security

    if (!clientId || !redirectUri) {
      return NextResponse.json({ error: 'Reddit OAuth not configured' }, { status: 500 })
    }

    const authUrl = `https://www.reddit.com/api/v1/authorize?client_id=${clientId}&response_type=code&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}&duration=permanent&scope=${scope}`

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Reddit OAuth URL generation error:', error)
    return NextResponse.json({ error: 'Failed to generate OAuth URL' }, { status: 500 })
  }
}
