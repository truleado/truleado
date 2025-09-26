import { NextRequest, NextResponse } from 'next/server'
import { paddleAPI, paddleConfig } from '@/lib/paddle-config'

export async function POST(request: NextRequest) {
  try {
    console.log('Simple subscription test...')

    // Step 1: Create customer
    console.log('Creating customer...')
    const customer = await paddleAPI.createCustomer({
      email: `simple-test-${Date.now()}@truleado.com`,
      name: 'Simple Test User',
      customData: { test: true }
    })
    console.log('Customer created:', customer.id)

    // Step 2: Get price
    console.log('Getting price...')
    const price = await paddleAPI.getPrice(paddleConfig.priceId)
    console.log('Price retrieved:', price.id, price.type)

    // Step 3: Try subscription creation with minimal data
    console.log('Creating subscription...')
    console.log('Subscription data:', {
      customerId: customer.id,
      priceId: paddleConfig.priceId
    })

    try {
      const subscription = await paddleAPI.createSubscription({
        customerId: customer.id,
        priceId: paddleConfig.priceId,
        customData: {}
      })
      
      console.log('Subscription created successfully:', subscription.id)
      
      return NextResponse.json({
        success: true,
        message: 'Subscription created successfully!',
        customer: {
          id: customer.id,
          email: customer.email
        },
        price: {
          id: price.id,
          type: price.type,
          billingCycle: price.billingCycle
        },
        subscription: {
          id: subscription.id,
          status: subscription.status
        }
      })
      
    } catch (subscriptionError) {
      console.error('Subscription creation error:', subscriptionError)
      
      // Try to get more details about the error
      let errorDetails = 'Unknown error'
      if (subscriptionError instanceof Error) {
        errorDetails = subscriptionError.message
        console.error('Error message:', subscriptionError.message)
        console.error('Error stack:', subscriptionError.stack)
      }
      
      return NextResponse.json({
        success: false,
        error: 'Subscription creation failed',
        details: errorDetails,
        customer: {
          id: customer.id,
          email: customer.email
        },
        price: {
          id: price.id,
          type: price.type,
          billingCycle: price.billingCycle
        },
        subscriptionData: {
          customerId: customer.id,
          priceId: paddleConfig.priceId
        }
      })
    }

  } catch (error) {
    console.error('Simple subscription test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
