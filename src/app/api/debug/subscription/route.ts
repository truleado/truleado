import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create service client for database operations
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user profile with subscription info
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch subscription status' }, { status: 500 })
    }

    // Calculate trial time remaining
    const now = new Date()
    const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
    const timeRemaining = trialEndsAt ? trialEndsAt.getTime() - now.getTime() : 0
    const hoursRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)))
    const minutesRemaining = Math.max(0, Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)))

    return NextResponse.json({
      user_id: user.id,
      email: user.email,
      subscription_status: profile.subscription_status,
      trial_ends_at: profile.trial_ends_at,
      subscription_ends_at: profile.subscription_ends_at,
      trial_count: profile.trial_count,
      last_trial_at: profile.last_trial_at,
      paddle_customer_id: profile.paddle_customer_id,
      paddle_subscription_id: profile.paddle_subscription_id,
      debug: {
        now: now.toISOString(),
        trial_ends_at: trialEndsAt?.toISOString(),
        time_remaining_ms: timeRemaining,
        hours_remaining: hoursRemaining,
        minutes_remaining: minutesRemaining,
        is_trial_active: profile.subscription_status === 'trial' && timeRemaining > 0,
        is_trial_expired: profile.subscription_status === 'trial' && timeRemaining <= 0,
        should_show_upgrade: timeRemaining < 2 * 60 * 60 * 1000 || profile.subscription_status === 'expired'
      }
    })
  } catch (error) {
    console.error('Subscription debug error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch subscription debug info'
    }, { status: 500 })
  }
}

