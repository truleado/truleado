export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// This API route ensures new users have 'pending' status
// Called after signup to fix cases where webhook doesn't fire
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status, created_at')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // For fresh signups: If user was just created (within last 10 minutes) 
    // and has 'trial' status (from old trigger), change it to 'pending'
    const profileCreatedAt = new Date(profile.created_at)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    const isFreshSignup = profileCreatedAt > tenMinutesAgo
    
    // Also check if user has no paddle_subscription_id (hasn't completed checkout)
    const { data: fullProfile } = await supabase
      .from('profiles')
      .select('paddle_subscription_id')
      .eq('id', user.id)
      .single()
    
    const hasNoSubscription = !fullProfile?.paddle_subscription_id
    
    // If it's a fresh signup with 'trial' status and no subscription, set to 'pending'
    if (isFreshSignup && profile.subscription_status === 'trial' && hasNoSubscription) {
      const fallbackTrialEndsAt = new Date()
      fallbackTrialEndsAt.setDate(fallbackTrialEndsAt.getDate() + 7)
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'pending',
          trial_ends_at: fallbackTrialEndsAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating status to pending:', updateError)
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
      }

      console.log('✅ Updated fresh signup status to pending:', user.id)
      return NextResponse.json({ 
        success: true, 
        message: 'Status updated to pending',
        subscription_status: 'pending'
      })
    }
    
    // Also handle case where status is null or empty (shouldn't happen but just in case)
    if (isFreshSignup && (!profile.subscription_status || profile.subscription_status === '')) {
      const fallbackTrialEndsAt = new Date()
      fallbackTrialEndsAt.setDate(fallbackTrialEndsAt.getDate() + 7)
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'pending',
          trial_ends_at: fallbackTrialEndsAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (!updateError) {
        console.log('✅ Set null status to pending for fresh signup:', user.id)
        return NextResponse.json({ 
          success: true, 
          message: 'Status set to pending',
          subscription_status: 'pending'
        })
      }
    }

    // If already pending or other status, just return current status
    return NextResponse.json({ 
      success: true, 
      subscription_status: profile.subscription_status 
    })
  } catch (error) {
    console.error('Error ensuring pending status:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

