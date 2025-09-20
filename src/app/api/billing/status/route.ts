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

    // Check and update trial status (skip for now to avoid errors)
    // await checkAndUpdateTrialStatus(user.id, serviceSupabase)

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

    return NextResponse.json({
      subscription_status: profile.subscription_status,
      trial_ends_at: profile.trial_ends_at,
      subscription_ends_at: profile.subscription_ends_at,
      trial_count: profile.trial_count,
      last_trial_at: profile.last_trial_at,
      paddle_customer_id: profile.paddle_customer_id,
      paddle_subscription_id: profile.paddle_subscription_id
    })
  } catch (error) {
    console.error('Billing status error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch billing status'
    }, { status: 500 })
  }
}

async function checkAndUpdateTrialStatus(userId: string, supabase: any): Promise<void> {
  try {
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('Error fetching user for trial status check:', userError)
      return
    }

    if (user.subscription_status === 'trial') {
      const now = new Date()
      const trialEndsAt = new Date(user.trial_ends_at)

      if (now > trialEndsAt) {
        // Trial expired
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'expired'
          })
          .eq('id', userId)

        if (updateError) {
          console.error('Error updating trial status to expired:', updateError)
        }
      }
    }
  } catch (error) {
    console.error('Error checking trial status:', error)
  }
}
