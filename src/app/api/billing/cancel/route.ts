import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { paddleAPI } from '@/lib/paddle-config'
import { trialManager } from '@/lib/trial-manager'

export async function POST(request: NextRequest) {
  try {
    console.log('Paddle Cancel Subscription API called')
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Authentication error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    // Get user's subscription ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('paddle_subscription_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!profile.paddle_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    // Cancel subscription with Paddle
    console.log('Cancelling subscription:', profile.paddle_subscription_id)
    await paddleAPI.cancelSubscription(profile.paddle_subscription_id)

    // Update user profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        subscription_status: 'cancelled'
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating user profile:', updateError)
      return NextResponse.json({ error: 'Failed to update subscription status' }, { status: 500 })
    }

    // Log subscription change
    await trialManager.logSubscriptionChange(
      user.id,
      'cancelled',
      'active',
      'subscription_cancelled',
      `manual_cancel_${Date.now()}`,
      { 
        subscription_id: profile.paddle_subscription_id
      }
    )

    console.log('Subscription cancelled successfully for user:', user.id)

    return NextResponse.json({ 
      message: 'Subscription cancelled successfully',
      subscription_status: 'cancelled'
    })

  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to cancel subscription'
    }, { status: 500 })
  }
}
