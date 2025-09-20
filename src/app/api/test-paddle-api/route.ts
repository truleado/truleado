import { NextResponse } from 'next/server'
import { paddleAPI, paddleConfig } from '@/lib/paddle-config'

export async function GET() {
  try {
    // Test Paddle API connectivity
    const tests = {
      config: {
        environment: paddleConfig.environment,
        vendorId: paddleConfig.vendorId ? 'Set' : 'Missing',
        apiKey: paddleConfig.apiKey ? 'Set' : 'Missing',
        productId: paddleConfig.productId ? 'Set' : 'Missing',
        priceId: paddleConfig.priceId ? 'Set' : 'Missing',
        webhookSecret: paddleConfig.webhookSecret ? 'Set' : 'Missing',
      },
      apiTests: {} as any
    }

    // Test 1: Try to get a test customer (this will fail if API key is wrong)
    try {
      // This will likely fail with 404, but that's expected and shows API is working
      await paddleAPI.getCustomer('test-customer-id')
      tests.apiTests.customerApi = 'Working (unexpected success)'
    } catch (error: any) {
      if (error.message.includes('404')) {
        tests.apiTests.customerApi = 'Working (expected 404)'
      } else if (error.message.includes('401') || error.message.includes('403')) {
        tests.apiTests.customerApi = 'API Key Issue'
      } else {
        tests.apiTests.customerApi = `Error: ${error.message}`
      }
    }

    // Test 2: Try to get a test transaction
    try {
      await paddleAPI.getTransaction('test-transaction-id')
      tests.apiTests.transactionApi = 'Working (unexpected success)'
    } catch (error: any) {
      if (error.message.includes('404')) {
        tests.apiTests.transactionApi = 'Working (expected 404)'
      } else if (error.message.includes('401') || error.message.includes('403')) {
        tests.apiTests.transactionApi = 'API Key Issue'
      } else {
        tests.apiTests.transactionApi = `Error: ${error.message}`
      }
    }

    return NextResponse.json({
      message: 'Paddle API Integration Test',
      tests,
      instructions: [
        'If API tests show "Working (expected 404)", your API integration is working correctly',
        'If you see "API Key Issue", check your PADDLE_API_KEY environment variable',
        'If you see "Missing" for any config values, add them to your .env.local file',
        'Make sure you\'re using the correct environment (sandbox vs production)'
      ]
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to test Paddle API',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

