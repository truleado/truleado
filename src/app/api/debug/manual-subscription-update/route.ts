import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { updateUserSubscription, paddleAPI, paddleConfig } from '@/lib/paddle-config'

export async function POST(request: NextRequest) {
  try {
    const { userId, subscriptionStatus = 'active' } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('Manually updating subscription for user:', userId)
    
    // For manual activation, create a proper Paddle subscription if possible
    if (subscriptionStatus === 'active' && paddleConfig.apiKey && paddleConfig.priceId) {
      try {
        // Get user details
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (!authError && user && user.id === userId) {
          // Create customer first
          const customer = await paddleAPI.createCustomer({
            email: user.email!,
            name: user.user_metadata?.full_name,
            customData: {
              user_id: userId,
              user_email: user.email
            }
          })

          // Create subscription
          const subscription = await paddleAPI.createSubscription({
            customerId: customer.id,
            priceId: paddleConfig.priceId,
            customData: {
              user_id: userId,
              user_email: user.email
            }
          })

          // Update with proper subscription data
          await updateUserSubscription(userId, {
            subscription_status: 'active',
            paddle_customer_id: customer.id,
            paddle_subscription_id: subscription.id,
            subscription_ends_at: subscription.next_billed_at 
              ? new Date(subscription.next_billed_at).toISOString()
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })

          console.log('Paddle subscription created for user:', userId)
          return NextResponse.json({ 
            success: true, 
            message: 'Paddle subscription created and activated',
            userId,
            subscriptionStatus,
            paddleCustomerId: customer.id,
            paddleSubscriptionId: subscription.id
          })
        }
      } catch (paddleError) {
        console.error('Failed to create Paddle subscription, falling back to local update:', paddleError)
      }
    }
    
    // Fallback to local-only update
    await updateUserSubscription(userId, {
      subscription_status: subscriptionStatus,
      subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    })

    console.log('Subscription updated locally for user:', userId)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Subscription updated successfully (local only)',
      userId,
      subscriptionStatus
    })
    
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to update subscription' 
    }, { status: 500 })
  }
}
