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

    // Get user profile with subscription info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch subscription status' }, { status: 500 })
    }

    // Debug information
    const debugInfo = {
      user_id: user.id,
      user_email: user.email,
      profile_data: profile,
      current_time: new Date().toISOString(),
      trial_ends_at: profile.trial_ends_at,
      subscription_status: profile.subscription_status,
      time_remaining: profile.trial_ends_at ? 
        Math.max(0, new Date(profile.trial_ends_at).getTime() - new Date().getTime()) : 0
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error('Debug subscription error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch debug info'
    }, { status: 500 })
  }
}
