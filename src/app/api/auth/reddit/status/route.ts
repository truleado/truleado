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
      .select('reddit_access_token, reddit_username, reddit_token_expires_at')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking Reddit connection:', error)
      return NextResponse.json({ error: 'Failed to check Reddit connection' }, { status: 500 })
    }

    const isConnected = apiKeys && 
                       apiKeys.reddit_access_token && 
                       apiKeys.reddit_token_expires_at &&
                       new Date(apiKeys.reddit_token_expires_at) > new Date()

    return NextResponse.json({
      connected: isConnected,
      username: isConnected ? apiKeys.reddit_username : null
    })
  } catch (error) {
    console.error('Reddit status check error:', error)
    return NextResponse.json({ error: 'Failed to check Reddit status' }, { status: 500 })
  }
}
