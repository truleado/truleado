export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { paddleAPI, updateUserSubscription } from '@/lib/paddle-config'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's subscription
    const { data: profile } = await supabase
      .from('profiles')
      .select('paddle_subscription_id, paddle_customer_id, subscription_status, email')
      .eq('id', user.id)
      .single()

    let subscriptionId = profile?.paddle_subscription_id

    // If no subscription ID but user has trial/active status, try to find it from Paddle
    if (!subscriptionId && (profile?.subscription_status === 'trial' || profile?.subscription_status === 'active')) {
      console.log('Subscription ID not found in DB, attempting to find from Paddle...')
      
      // Try to find subscription by customer ID first
      if (profile?.paddle_customer_id) {
        try {
          const subscriptions = await paddleAPI.listSubscriptions(profile.paddle_customer_id)
          
          if (subscriptions && subscriptions.data && subscriptions.data.length > 0) {
            // Get the most recent active/trialing subscription
            const activeSub = subscriptions.data.find((sub: any) => 
              sub.status === 'active' || sub.status === 'trialing'
            ) || subscriptions.data[0]
            
            subscriptionId = activeSub.id
            console.log('Found subscription from Paddle:', subscriptionId)
            
            // Update the database with the found subscription ID
            await updateUserSubscription(user.id, {
              paddle_subscription_id: subscriptionId
            })
          }
        } catch (err) {
          console.error('Error fetching subscription from Paddle:', err)
        }
      }
      
      // If still not found, try by email
      if (!subscriptionId && profile?.email) {
        try {
          const result = await paddleAPI.findSubscriptionByEmail(profile.email)
          
          if (result) {
            subscriptionId = result.subscriptionId
            console.log('Found subscription from Paddle by email:', subscriptionId)
            
            // Update the database
            await updateUserSubscription(user.id, {
              paddle_subscription_id: subscriptionId,
              paddle_customer_id: result.customerId
            })
          }
        } catch (err) {
          console.error('Error fetching subscription by email:', err)
        }
      }
    }

    // Allow cancellation even if subscription ID not found in DB but status indicates trial/active
    // This handles cases where webhook hasn't updated the database yet
    if (!subscriptionId) {
      // If user has trial or active status but no subscription ID, they might have completed checkout
      // but webhook hasn't fired yet. In this case, we can still mark as cancelled in DB
      if (profile?.subscription_status === 'trial' || profile?.subscription_status === 'active') {
        console.log('No subscription ID found, but status is trial/active. Marking as cancelled in DB.')
        await updateUserSubscription(user.id, {
          subscription_status: 'cancelled'
        })
        return NextResponse.json({
          success: true,
          message: 'Subscription cancelled successfully (marked as cancelled in database)'
        })
      }
      
      return NextResponse.json({
        error: 'No active subscription found. Please contact support if you believe this is an error.'
      }, { status: 400 })
    }

    if (profile.subscription_status === 'cancelled') {
      return NextResponse.json({
        error: 'Subscription is already cancelled'
      }, { status: 400 })
    }

    // Allow cancellation of trial subscriptions
    // This will cancel the trial and prevent automatic charge

    // Cancel subscription in Paddle
    try {
      await paddleAPI.cancelSubscription(subscriptionId)
      
      // Update user subscription status
      await updateUserSubscription(user.id, {
        subscription_status: 'cancelled'
      })

      console.log('✅ Subscription cancelled for user:', user.id)

      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled successfully'
      })
    } catch (error: any) {
      console.error('Error cancelling subscription:', error)
      return NextResponse.json({
        error: error.message || 'Failed to cancel subscription'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

