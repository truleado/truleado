import { NextRequest, NextResponse } from 'next/server'
import { paddleAPI, paddleConfig } from '@/lib/paddle-config'

export async function POST(request: NextRequest) {
  try {
    console.log('Creating fresh customer and subscription...')

    // Step 1: Create a new customer
    let customer
    try {
      const timestamp = Date.now()
      customer = await paddleAPI.createCustomer({
        email: `test-${timestamp}@truleado.com`,
        name: 'Test User',
        customData: {
          test_customer: true,
          created_via: 'fresh_subscription_test',
          timestamp: timestamp
        }
      })
      console.log('✅ Fresh customer created:', customer.id, customer.email)
    } catch (customerError) {
      console.error('Failed to create fresh customer:', customerError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create fresh customer',
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

    console.log('✅ Price validation passed - recurring billing confirmed')

    // Step 3: Create a recurring subscription
    let subscription
    try {
      subscription = await paddleAPI.createSubscription({
        customerId: customer.id,
        priceId: paddleConfig.priceId,
        customData: {
          test_subscription: true,
          created_via: 'fresh_subscription_test',
          customer_email: customer.email,
          timestamp: Date.now()
        }
      })
      console.log('✅ Subscription created successfully:', subscription.id)
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
      message: 'Successfully created fresh customer and recurring subscription!',
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
        '✅ Fresh customer and recurring subscription created successfully!',
        'Check Paddle Dashboard to see the new customer and subscription',
        'Test the checkout flow from your app',
        'Verify monthly billing is configured correctly',
        'The subscription should automatically bill monthly'
      ],
      paddleDashboard: {
        customerUrl: `https://sandbox-vendor.paddle.com/customers/${customer.id}`,
        subscriptionUrl: `https://sandbox-vendor.paddle.com/subscriptions/${subscription.id}`
      }
    })

  } catch (error) {
    console.error('Fresh subscription test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
