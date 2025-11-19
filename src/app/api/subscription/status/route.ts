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
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch subscription status' }, { status: 500 })
    }

    // If user has no subscription status or it's null/empty/free, give them a 7-day trial
    if (!profile.subscription_status || profile.subscription_status === 'free' || profile.subscription_status === '') {
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 7)
      
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'trial',
          trial_ends_at: trialEndsAt.toISOString(),
          trial_count: 1,
          last_trial_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error starting trial for user:', updateError)
      } else {
        profile = updatedProfile
      }
    }
    
    // If user has expired trial and no active subscription, check if we should give them a new trial
    if (profile.subscription_status === 'trial' && profile.trial_ends_at) {
      const now = new Date()
      const trialEndsAt = new Date(profile.trial_ends_at)
      
      // If trial expired, update status to expired
      if (now > trialEndsAt) {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'expired',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .select()
          .single()

        if (!updateError && updatedProfile) {
          profile = updatedProfile
        }
      }
    }

    return NextResponse.json({
      subscription_status: profile.subscription_status,
      trial_ends_at: profile.trial_ends_at,
      subscription_ends_at: profile.subscription_ends_at,
      trial_count: profile.trial_count,
      last_trial_at: profile.last_trial_at
    })
  } catch (error) {
    console.error('Subscription status error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch subscription status'
    }, { status: 500 })
  }
}

