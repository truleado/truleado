import { NextRequest, NextResponse } from 'next/server'
import { paddleConfig } from '@/lib/paddle-config'

export async function GET(request: NextRequest) {
  try {
    // Test basic API connectivity
    const testResults = {
      config: {
        hasApiKey: !!paddleConfig.apiKey,
        hasPriceId: !!paddleConfig.priceId,
        environment: paddleConfig.environment,
        baseUrl: paddleConfig.baseUrl
      },
      tests: []
    }

    // Test 1: Basic fetch to Paddle API
    try {
      const response = await fetch(`${paddleConfig.baseUrl}/prices/${paddleConfig.priceId}`, {
        headers: {
          'Authorization': `Bearer ${paddleConfig.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      testResults.tests.push({
        name: 'Basic API fetch',
        success: response.ok,
        status: response.status,
        statusText: response.statusText
      })
    } catch (error) {
      testResults.tests.push({
        name: 'Basic API fetch',
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
        name: 'Create transaction',
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        response: responseData
      })
    } catch (error) {
      testResults.tests.push({
        name: 'Create transaction',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
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
