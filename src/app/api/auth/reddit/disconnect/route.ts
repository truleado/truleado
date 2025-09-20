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

    // Remove Reddit tokens from database
    const { error } = await supabase
      .from('api_keys')
      .update({
        reddit_access_token: null,
        reddit_refresh_token: null,
        reddit_token_expires_at: null,
        reddit_username: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (error) {
      console.error('Error disconnecting Reddit:', error)
      return NextResponse.json({ error: 'Failed to disconnect Reddit' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Reddit disconnected successfully' })
  } catch (error) {
    console.error('Reddit disconnect error:', error)
    return NextResponse.json({ error: 'Failed to disconnect Reddit' }, { status: 500 })
  }
}
