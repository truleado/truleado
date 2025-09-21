import { NextRequest, NextResponse } from 'next/server'
import { razorpayAPI, razorpayConfig } from '@/lib/razorpay-config'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Razorpay Integration')
    
    const results: any = {
      timestamp: new Date().toISOString(),
      config: {
        keyId: razorpayConfig.keyId ? 'Set' : 'Missing',
        keySecret: razorpayConfig.keySecret ? 'Set' : 'Missing',
        planId: razorpayConfig.planId ? 'Set' : 'Missing',
        webhookSecret: razorpayConfig.webhookSecret ? 'Set' : 'Missing',
        environment: razorpayConfig.environment
      },
      tests: {}
    }

    // Test 1: Create a test customer
    try {
      console.log('Test 1: Creating test customer')
      const testCustomer = await razorpayAPI.createCustomer('test@truleado.com', 'Test User')
      results.tests.customerCreation = {
        status: 'Success',
        customerId: testCustomer.id,
        email: testCustomer.email
      }
      console.log('Test customer created:', testCustomer.id)
    } catch (error: any) {
      console.error('Test 1 failed:', error)
      results.tests.customerCreation = {
        status: 'Failed',
        error: error.message || 'Unknown error',
        code: error.code || 'NO_CODE'
      }
    }

    // Test 2: List plans
    try {
      console.log('Test 2: Listing plans')
      const plans = await razorpayAPI.listPlans()
      results.tests.planListing = {
        status: 'Success',
        planCount: plans.items ? plans.items.length : 0,
        plans: plans.items ? plans.items.map((p: any) => ({ id: p.id, item: p.item })) : []
      }
      console.log('Plans listed successfully')
    } catch (error: any) {
      console.error('Test 2 failed:', error)
      results.tests.planListing = {
        status: 'Failed',
        error: error.message || 'Unknown error',
        code: error.code || 'NO_CODE'
      }
    }

    // Test 3: Get specific plan
    try {
      console.log('Test 3: Getting specific plan')
      const plan = await razorpayAPI.getPlan(razorpayConfig.planId)
      results.tests.planRetrieval = {
        status: 'Success',
        planId: plan.id,
        planName: plan.item?.name || 'Unknown',
        amount: plan.item?.amount || 0
      }
      console.log('Plan retrieved successfully:', plan.id)
    } catch (error: any) {
      console.error('Test 3 failed:', error)
      results.tests.planRetrieval = {
        status: 'Failed',
        error: error.message || 'Unknown error',
        code: error.code || 'NO_CODE'
      }
    }

    // Test 4: Create subscription (if customer was created successfully)
    if (results.tests.customerCreation?.status === 'Success') {
      try {
        console.log('Test 4: Creating test subscription')
        const subscription = await razorpayAPI.createSubscription(
          results.tests.customerCreation.customerId,
          razorpayConfig.planId
        )
        results.tests.subscriptionCreation = {
          status: 'Success',
          subscriptionId: subscription.id,
          subscriptionStatus: subscription.status
        }
        console.log('Test subscription created:', subscription.id)
      } catch (error: any) {
        console.error('Test 4 failed:', error)
        results.tests.subscriptionCreation = {
          status: 'Failed',
          error: error.message || 'Unknown error',
          code: error.code || 'NO_CODE'
        }
      }
    } else {
      results.tests.subscriptionCreation = {
        status: 'Skipped',
        reason: 'Customer creation failed'
      }
    }

    return NextResponse.json({
      message: 'Razorpay Integration Test Results',
      ...results
    })
  } catch (error) {
    console.error('Integration test error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Integration test failed',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
