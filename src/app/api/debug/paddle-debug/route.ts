import { NextRequest, NextResponse } from 'next/server'
import { paddleAPI, paddleConfig } from '@/lib/paddle-config'

export async function GET(request: NextRequest) {
  try {
    console.log('Comprehensive Paddle debugging...')

    const results: any = {
      config: {
        hasApiKey: !!paddleConfig.apiKey,
        hasPriceId: !!paddleConfig.priceId,
        environment: paddleConfig.environment,
        baseUrl: paddleConfig.baseUrl,
        apiKeyPrefix: paddleConfig.apiKey?.substring(0, 15) || 'N/A'
      },
      tests: {}
    }

    // Test 1: Price retrieval
    try {
      console.log('Test 1: Getting price...')
      const price = await paddleAPI.getPrice(paddleConfig.priceId)
      results.tests.priceRetrieval = {
        success: true,
        price: {
          id: price.id,
          type: price.type,
          billingCycle: price.billingCycle,
          status: price.status
        }
      }
      console.log('✅ Price retrieval works')
    } catch (error) {
      results.tests.priceRetrieval = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      console.error('❌ Price retrieval failed:', error)
    }

    // Test 2: Customer list with different parameters
    try {
      console.log('Test 2: Listing customers with no filters...')
      const customers1 = paddleAPI.listCustomers({ limit: 10 })
      results.tests.customerListNoFilter = {
        success: true,
        count: customers1.data?.length || 0,
        customers: customers1.data?.map(c => ({ id: c.id, email: c.email })) || []
      }
      console.log('✅ Customer list (no filter) works:', customers1.data?.length || 0, 'customers')
    } catch (error) {
      results.tests.customerListNoFilter = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      console.error('❌ Customer list (no filter) failed:', error)
    }

    // Test 3: Try to get a specific customer by ID
    const knownCustomerIds = [
      'ctm_01k60njj70z18d62yeger6h31d', // From earlier error
      'ctm_01k637dsyktsfwep4e58j68vcn'  // From recent error
    ]

    for (const customerId of knownCustomerIds) {
      try {
        console.log(`Test 3: Getting customer ${customerId}...`)
        const customer = await paddleAPI.getCustomer(customerId)
        results.tests[`customerById_${customerId}`] = {
          success: true,
          customer: {
            id: customer.id,
            email: customer.email,
            name: customer.name,
            status: customer.status
          }
        }
        console.log(`✅ Customer ${customerId} found:`, customer.email)
      } catch (error) {
        results.tests[`customerById_${customerId}`] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
        console.error(`❌ Customer ${customerId} not found:`, error)
      }
    }

    // Test 4: Try different customer list parameters
    try {
      console.log('Test 4: Listing customers with different parameters...')
      const customers2 = paddleAPI.listCustomers({ limit: 50 })
      results.tests.customerListHighLimit = {
        success: true,
        count: customers2.data?.length || 0,
        customers: customers2.data?.map(c => ({ id: c.id, email: c.email })) || []
      }
      console.log('✅ Customer list (high limit) works:', customers2.data?.length || 0, 'customers')
    } catch (error) {
      results.tests.customerListHighLimit = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      console.error('❌ Customer list (high limit) failed:', error)
    }

    // Test 5: Check if we can create a customer
    try {
      console.log('Test 5: Testing customer creation...')
      const testCustomer = await paddleAPI.createCustomer({
        email: `test-${Date.now()}@example.com`,
        name: 'Test Customer',
        customData: { test: true }
      })
      results.tests.customerCreation = {
        success: true,
        customer: {
          id: testCustomer.id,
          email: testCustomer.email
        }
      }
      console.log('✅ Customer creation works:', testCustomer.id)
    } catch (error) {
      results.tests.customerCreation = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      console.error('❌ Customer creation failed:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Paddle debugging completed',
      ...results
    })

  } catch (error) {
    console.error('Paddle debug failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Debug failed',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
