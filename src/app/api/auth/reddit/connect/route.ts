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

    const clientId = process.env.REDDIT_OAUTH_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/reddit/callback`
    const state = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')
    const scope = 'read identity'

    if (!clientId) {
      return NextResponse.json({ error: 'Reddit OAuth not configured' }, { status: 500 })
    }

    const authUrl = `https://www.reddit.com/api/v1/authorize?client_id=${clientId}&response_type=code&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}&duration=permanent&scope=${scope}`

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Reddit connect error:', error)
    return NextResponse.json({ error: 'Failed to initiate Reddit connection' }, { status: 500 })
  }
}

