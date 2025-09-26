import { NextRequest, NextResponse } from 'next/server'
import { paddleAPI, paddleConfig } from '@/lib/paddle-config'

export async function POST(request: NextRequest) {
  try {
    console.log('Creating subscription with the new customer...')

    // Use the customer ID we just created
    const customerId = 'ctm_01k63tv8q8fbmqhgx6t4am9fb8'
    
    // Step 1: Get the customer to verify it exists
    let customer
    try {
      customer = await paddleAPI.getCustomer(customerId)
      console.log('Found customer:', customer.id, customer.email)
    } catch (customerError) {
      console.error('Failed to get customer:', customerError)
      return NextResponse.json({
        success: false,
        error: 'Failed to get customer',
        details: customerError instanceof Error ? customerError.message : 'Unknown error'
      })
    }

    // Step 2: Verify price is recurring
    const price = await paddleAPI.getPrice(paddleConfig.priceId)
    console.log('Price details:', price)

    const hasBillingCycle = price.billingCycle && price.billingCycle.interval
    const isRecurring = hasBillingCycle || price.type === 'recurring'

    if (!isRecurring) {
      return NextResponse.json({
        success: false,
        error: 'Price is not configured for recurring billing',
        price: {
          id: price.id,
          type: price.type,
          billingCycle: price.billingCycle
        }
      })
    }

    console.log('✅ Price validation passed')

    // Step 3: Create a recurring subscription
    let subscription
    try {
      subscription = await paddleAPI.createSubscription({
        customerId: customer.id,
        priceId: paddleConfig.priceId,
        customData: {
          test_subscription: true,
          created_via: 'debug_test',
          user_email: customer.email
        }
      })
      console.log('Subscription created successfully:', subscription.id)
    } catch (subscriptionError) {
      console.error('Failed to create subscription:', subscriptionError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create subscription',
        details: subscriptionError instanceof Error ? subscriptionError.message : 'Unknown error'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully created recurring subscription!',
      results: {
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          status: customer.status
        },
        price: {
          id: price.id,
          type: price.type,
          billingCycle: price.billingCycle,
          status: price.status
        },
        subscription: {
          id: subscription.id,
          status: subscription.status,
          nextBilledAt: subscription.nextBilledAt,
          billingCycle: subscription.billingCycle
        }
      },
      nextSteps: [
        '✅ Recurring subscription created successfully!',
        'Check Paddle Dashboard to see the subscription',
        'Test the checkout flow from your app',
        'Verify monthly billing is configured correctly'
      ]
    })

  } catch (error) {
    console.error('Create subscription test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
