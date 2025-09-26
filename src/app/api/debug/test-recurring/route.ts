import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { paddleAPI, paddleConfig } from '@/lib/paddle-config'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Testing recurring billing setup for user:', user.id)

    // Step 1: Verify price is recurring
    const price = await paddleAPI.getPrice(paddleConfig.priceId)
    console.log('Price details:', price)

    if (price.type !== 'recurring') {
      return NextResponse.json({
        success: false,
        error: 'Price is not configured for recurring billing',
        price: {
          id: price.id,
          type: price.type,
          billing_cycle: price.billing_cycle,
          interval: price.interval
        },
        recommendation: 'Configure this price as recurring in Paddle Dashboard'
      })
    }

    // Step 2: Create a test customer
    const customer = await paddleAPI.createCustomer({
      email: user.email!,
      name: user.user_metadata?.full_name,
      customData: {
        user_id: user.id,
        user_email: user.email,
        test_customer: true
      }
    })
    console.log('Test customer created:', customer.id)

    // Step 3: Create a test subscription
    const subscription = await paddleAPI.createSubscription({
      customerId: customer.id,
      priceId: paddleConfig.priceId,
      customData: {
        user_id: user.id,
        user_email: user.email,
        test_subscription: true
      }
    })
    console.log('Test subscription created:', subscription.id)

    // Step 4: Update user profile with test subscription
    await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        paddle_customer_id: customer.id,
        paddle_subscription_id: subscription.id,
        subscription_ends_at: subscription.next_billed_at 
          ? new Date(subscription.next_billed_at).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', user.id)

    // Step 5: Verify subscription details
    const subscriptionDetails = await paddleAPI.getSubscription(subscription.id)
    console.log('Subscription details:', subscriptionDetails)

    return NextResponse.json({
      success: true,
      message: 'Recurring billing test completed successfully',
      test_results: {
        price_validation: {
          id: price.id,
          type: price.type,
          billing_cycle: price.billing_cycle,
          interval: price.interval,
          unit_price: price.unit_price,
          currency_code: price.currency_code
        },
        customer_creation: {
          id: customer.id,
          email: customer.email,
          name: customer.name
        },
        subscription_creation: {
          id: subscription.id,
          status: subscription.status,
          next_billed_at: subscription.next_billed_at,
          billing_cycle: subscription.billing_cycle
        },
        subscription_details: {
          id: subscriptionDetails.id,
          status: subscriptionDetails.status,
          next_billed_at: subscriptionDetails.next_billed_at,
          billing_cycle: subscriptionDetails.billing_cycle,
          items: subscriptionDetails.items
        }
      },
      next_steps: [
        'Check Paddle Dashboard for the test subscription',
        'Verify webhook events are being received',
        'Test payment processing in Paddle Dashboard',
        'Monitor for recurring payment events'
      ]
    })

  } catch (error) {
    console.error('Recurring billing test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current subscription status
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, paddle_customer_id, paddle_subscription_id, subscription_ends_at')
      .eq('id', user.id)
      .single()

    // If user has a subscription, get details from Paddle
    let subscriptionDetails = null
    if (profile?.paddle_subscription_id) {
      try {
        subscriptionDetails = await paddleAPI.getSubscription(profile.paddle_subscription_id)
      } catch (error) {
        console.error('Failed to fetch subscription details:', error)
      }
    }

    return NextResponse.json({
      user_id: user.id,
      current_subscription: profile,
      paddle_subscription_details: subscriptionDetails,
      test_available: true,
      instructions: {
        method: 'POST',
        description: 'Run comprehensive recurring billing test',
        endpoint: '/api/debug/test-recurring'
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to get subscription status'
    }, { status: 500 })
  }
}
