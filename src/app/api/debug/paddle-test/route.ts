import { NextRequest, NextResponse } from 'next/server'
import { paddleAPI, paddleConfig } from '@/lib/paddle-config'

export async function GET(request: NextRequest) {
  try {
    // Test Paddle configuration
    const config = {
      hasApiKey: !!paddleConfig.apiKey,
      hasPriceId: !!paddleConfig.priceId,
      environment: paddleConfig.environment,
      baseUrl: paddleConfig.baseUrl
    }

    if (!paddleConfig.apiKey || !paddleConfig.priceId) {
      return NextResponse.json({
        success: false,
        error: 'Missing Paddle configuration',
        config
      })
    }

    // Test price retrieval
    let priceTest = null
    try {
      const price = await paddleAPI.getPrice(paddleConfig.priceId)
      priceTest = {
        success: true,
        price: {
          id: price.id,
          type: price.type,
          billingCycle: price.billingCycle,
          status: price.status
        }
      }
    } catch (priceError) {
      priceTest = {
        success: false,
        error: priceError instanceof Error ? priceError.message : 'Unknown error',
        details: priceError
      }
    }

    // Test checkout session creation (dry run)
    let checkoutTest = null
    try {
      // This will fail but we can see the error format
      await paddleAPI.createCheckoutSession({
        priceId: paddleConfig.priceId,
        customerEmail: 'test@example.com',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      })
      checkoutTest = { success: true }
    } catch (checkoutError) {
      checkoutTest = {
        success: false,
        error: checkoutError instanceof Error ? checkoutError.message : 'Unknown error',
        details: checkoutError,
        // Add debugging info
        debug: {
          hasApiKey: !!paddleConfig.apiKey,
          hasPriceId: !!paddleConfig.priceId,
          environment: paddleConfig.environment,
          apiKeyPreview: paddleConfig.apiKey ? `${paddleConfig.apiKey.substring(0, 8)}...` : 'Not set'
        }
      }
    }

    // Add SDK status check
    const sdkStatus = {
      paddleInstance: paddleAPI ? 'exists' : 'null',
      hasPaddleProperty: paddleAPI && 'paddle' in paddleAPI ? 'yes' : 'no',
      paddleValue: paddleAPI && 'paddle' in paddleAPI ? (paddleAPI.paddle ? 'initialized' : 'null') : 'unknown'
    }

    return NextResponse.json({
      success: true,
      config,
      priceTest,
      checkoutTest,
      sdkStatus
    })

  } catch (error) {
    console.error('Paddle test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}
