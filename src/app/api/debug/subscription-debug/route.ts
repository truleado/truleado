import { NextRequest, NextResponse } from 'next/server'
import { paddleAPI, paddleConfig } from '@/lib/paddle-config'

export async function POST(request: NextRequest) {
  try {
    console.log('Debugging subscription creation step by step...')

    const results: any = {
      steps: {}
    }

    // Step 1: Create customer
    let customer
    try {
      console.log('Step 1: Creating customer...')
      const timestamp = Date.now()
      customer = await paddleAPI.createCustomer({
        email: `debug-${timestamp}@truleado.com`,
        name: 'Debug User',
        customData: {
          debug_test: true,
          timestamp: timestamp
        }
      })
      results.steps.customerCreation = {
        success: true,
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name
        }
      }
      console.log('✅ Customer created:', customer.id)
    } catch (error) {
      results.steps.customerCreation = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }
      console.error('❌ Customer creation failed:', error)
      return NextResponse.json({
        success: false,
        error: 'Customer creation failed',
        ...results
      })
    }

    // Step 2: Get price details
    let price
    try {
      console.log('Step 2: Getting price details...')
      price = await paddleAPI.getPrice(paddleConfig.priceId)
      results.steps.priceRetrieval = {
        success: true,
        price: {
          id: price.id,
          type: price.type,
          billingCycle: price.billingCycle,
          status: price.status
        }
      }
      console.log('✅ Price retrieved:', price.id)
    } catch (error) {
      results.steps.priceRetrieval = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      console.error('❌ Price retrieval failed:', error)
      return NextResponse.json({
        success: false,
        error: 'Price retrieval failed',
        ...results
      })
    }

    // Step 3: Validate price for recurring
    const hasBillingCycle = price.billingCycle && price.billingCycle.interval
    const isRecurring = hasBillingCycle || price.type === 'recurring'
    
    results.steps.priceValidation = {
      success: isRecurring,
      hasBillingCycle,
      isRecurring,
      priceType: price.type,
      billingCycle: price.billingCycle
    }

    if (!isRecurring) {
      console.error('❌ Price is not configured for recurring billing')
      return NextResponse.json({
        success: false,
        error: 'Price is not configured for recurring billing',
        ...results
      })
    }
    console.log('✅ Price validation passed')

    // Step 4: Try to create subscription with detailed logging
    let subscription
    try {
      console.log('Step 4: Creating subscription...')
      console.log('Subscription data:', {
        customerId: customer.id,
        priceId: paddleConfig.priceId,
        customData: {
          debug_test: true,
          customer_email: customer.email
        }
      })

      subscription = await paddleAPI.createSubscription({
        customerId: customer.id,
        priceId: paddleConfig.priceId,
        customData: {
          debug_test: true,
          customer_email: customer.email,
          timestamp: Date.now()
        }
      })

      results.steps.subscriptionCreation = {
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          nextBilledAt: subscription.nextBilledAt,
          billingCycle: subscription.billingCycle
        }
      }
      console.log('✅ Subscription created:', subscription.id)
    } catch (error) {
      results.steps.subscriptionCreation = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
        subscriptionData: {
          customerId: customer.id,
          priceId: paddleConfig.priceId
        }
      }
      console.error('❌ Subscription creation failed:', error)
      
      return NextResponse.json({
        success: false,
        error: 'Subscription creation failed',
        ...results
      })
    }

    return NextResponse.json({
      success: true,
      message: 'All steps completed successfully!',
      ...results,
      summary: {
        customer: customer.id,
        price: price.id,
        subscription: subscription.id,
        nextBilling: subscription.nextBilledAt
      }
    })

  } catch (error) {
    console.error('Subscription debug failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Debug failed',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
