import { NextRequest, NextResponse } from 'next/server'
import { paddleAPI, paddleConfig } from '@/lib/paddle-config'

export async function POST(request: NextRequest) {
  try {
    console.log('Running direct test with existing customer...')

    // We know this customer exists from the error message
    const existingCustomerId = 'ctm_01k60njj70z18d62yeger6h31d'
    
    // Step 1: Verify price is recurring
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

    // Step 2: Get the existing customer
    let customer
    try {
      customer = await paddleAPI.getCustomer(existingCustomerId)
      console.log('Found existing customer:', customer.id, customer.email)
    } catch (customerError) {
      console.error('Failed to get existing customer:', customerError)
      return NextResponse.json({
        success: false,
        error: 'Failed to get existing customer',
        details: customerError instanceof Error ? customerError.message : 'Unknown error'
      })
    }

    // Step 3: Create a test subscription
    let subscription
    try {
      subscription = await paddleAPI.createSubscription({
        customerId: customer.id,
        priceId: paddleConfig.priceId,
        customData: {
          test_subscription: true,
          created_via: 'direct_test'
        }
      })
      console.log('Test subscription created:', subscription.id)
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
      message: 'Direct test completed successfully',
      results: {
        price: {
          id: price.id,
          type: price.type,
          billingCycle: price.billingCycle
        },
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name
        },
        subscription: {
          id: subscription.id,
          status: subscription.status,
          nextBilledAt: subscription.nextBilledAt
        }
      }
    })

  } catch (error) {
    console.error('Direct test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
