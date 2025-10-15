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

    // Get user's usage information directly from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('chat_find_free_searches_used, subscription_status')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error getting profile:', profileError)
      // Return default values if profile not found
      return NextResponse.json({
        used: 0,
        limit: 1,
        isSubscribed: false,
        remaining: 1
      })
    }

    const freeSearchesUsed = profile?.chat_find_free_searches_used || 0
    const isSubscribed = profile?.subscription_status && ['active', 'pro', 'enterprise'].includes(profile.subscription_status)

    return NextResponse.json({
      used: freeSearchesUsed,
      limit: 1,
      isSubscribed,
      remaining: isSubscribed ? 'unlimited' : Math.max(0, 1 - freeSearchesUsed)
    })

  } catch (error) {
    console.error('Error getting usage information:', error)
    return NextResponse.json({ 
      error: 'Failed to get usage information',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
