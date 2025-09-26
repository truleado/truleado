import { NextRequest, NextResponse } from 'next/server'
import { paddleAPI, paddleConfig } from '@/lib/paddle-config'

export async function POST(request: NextRequest) {
  try {
    console.log('Using existing customer to create subscription...')

    // Use the customer ID from the error message
    const existingCustomerId = 'ctm_01k637dsyktsfwep4e58j68vcn'
    
    // Step 1: Get the existing customer
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

    // Step 3: Create a test subscription
    let subscription
    try {
      subscription = await paddleAPI.createSubscription({
        customerId: customer.id,
        priceId: paddleConfig.priceId,
        customData: {
          test_subscription: true,
          created_via: 'use_existing_customer_test'
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
      message: 'Successfully created subscription using existing customer',
      results: {
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name
        },
        price: {
          id: price.id,
          type: price.type,
          billingCycle: price.billingCycle
        },
        subscription: {
          id: subscription.id,
          status: subscription.status,
          nextBilledAt: subscription.nextBilledAt
        }
      },
      nextSteps: [
        'Check Paddle Dashboard for the new subscription',
        'Verify the subscription is set up for recurring billing',
        'Test the checkout flow from your app'
      ]
    })

  } catch (error) {
    console.error('Use existing customer test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
