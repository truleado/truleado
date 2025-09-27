import { NextRequest, NextResponse } from 'next/server'
import { paddleConfig } from '@/lib/paddle-config'

export async function GET(request: NextRequest) {
  try {
    // Test basic API connectivity using the new connectivity test
    const testResults = {
      config: {
        hasApiKey: !!paddleConfig.apiKey,
        hasPriceId: !!paddleConfig.priceId,
        environment: paddleConfig.environment,
        baseUrl: paddleConfig.baseUrl,
        apiKeyPreview: paddleConfig.apiKey ? paddleConfig.apiKey.substring(0, 8) + '...' : 'Not set'
      },
      tests: []
    }

    // Test 1: Use the new connectivity test method
    try {
      const connectivityTest = await paddleConfig.testConnectivity()
      testResults.tests.push({
        name: 'Paddle API Connectivity Test',
        ...connectivityTest
      })
    } catch (error) {
      testResults.tests.push({
        name: 'Paddle API Connectivity Test',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 2: Try to create a simple transaction
    try {
      const transactionData = {
        items: [
          {
            price_id: paddleConfig.priceId,
            quantity: 1
          }
        ],
        customer_email: 'test@example.com'
      }

      const response = await fetch(`${paddleConfig.baseUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paddleConfig.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(transactionData)
      })

      const responseData = await response.json().catch(() => ({}))
      
      testResults.tests.push({
        name: 'Create Transaction Test',
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        response: responseData
      })
    } catch (error) {
      testResults.tests.push({
        name: 'Create Transaction Test',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : typeof error
      })
    }

    // Test 3: Try to create a checkout session
    try {
      const checkoutData = {
        items: [
          {
            price_id: paddleConfig.priceId,
            quantity: 1
          }
        ],
        customer_email: 'test@example.com',
        checkout: {
          return_url: 'https://www.truleado.com/billing/success',
          cancel_url: 'https://www.truleado.com/billing/cancel'
        }
      }

      const response = await fetch(`${paddleConfig.baseUrl}/checkout-sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paddleConfig.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(checkoutData)
      })

      const responseData = await response.json().catch(() => ({}))
      
      testResults.tests.push({
        name: 'Create Checkout Session Test',
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        response: responseData
      })
    } catch (error) {
      testResults.tests.push({
        name: 'Create Checkout Session Test',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : typeof error
      })
    }

    return NextResponse.json({
      success: true,
      ...testResults
    })

  } catch (error) {
    console.error('Simple test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}
