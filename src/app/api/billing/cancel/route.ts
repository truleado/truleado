import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { razorpayAPI } from '@/lib/razorpay-config'
import { trialManager } from '@/lib/trial-manager'

export async function POST(request: NextRequest) {
  try {
    console.log('Cancel subscription API called')
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    // Get user's current subscription details
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('razorpay_subscription_id, subscription_status')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!profile.razorpay_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    // Cancel the subscription in Razorpay
    try {
      console.log('Cancelling subscription:', profile.razorpay_subscription_id)
      const cancelledSubscription = await razorpayAPI.cancelSubscription(profile.razorpay_subscription_id)
      console.log('Subscription cancelled successfully:', cancelledSubscription.id)
    } catch (error) {
      console.error('Error cancelling subscription in Razorpay:', error)
      // Continue with database update even if Razorpay call fails
    }

    // Update user's subscription status in database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'cancelled',
        subscription_ends_at: new Date().toISOString(), // Immediate cancellation
        razorpay_subscription_id: null
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating user subscription status:', updateError)
      return NextResponse.json({ error: 'Failed to update subscription status' }, { status: 500 })
    }

    // Log the subscription change
    try {
      await trialManager.logSubscriptionChange(
        user.id,
        'cancelled',
        'active',
        'user_cancelled',
        'manual_cancellation',
        { 
          subscription_id: profile.razorpay_subscription_id,
          cancelled_at: new Date().toISOString()
        }
      )
    } catch (error) {
      console.warn('Failed to log subscription change:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription_status: 'cancelled'
    })
  } catch (error) {
    console.error('Cancel subscription error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    })
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to cancel subscription'
    }, { status: 500 })
  }
}
