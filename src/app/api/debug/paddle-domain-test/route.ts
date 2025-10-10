import { NextRequest, NextResponse } from 'next/server'
import { paddleAPI, paddleConfig } from '@/lib/paddle-config'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Paddle domain approval...')
    
    // Test with different domains to see which ones work
    const testDomains = [
      'https://www.truleado.com',
      'https://truleado.com',
      process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000',
      'https://example.com',
      'https://paddle.com'
    ]

    const results = []

    for (const domain of testDomains) {
      try {
        console.log(`Testing domain: ${domain}`)
        
        const testData = {
          priceId: paddleConfig.priceId,
          customerEmail: 'test@example.com',
          successUrl: `${domain}/billing/success`,
          cancelUrl: `${domain}/billing/cancel`,
          metadata: {
            test: true,
            domain: domain,
            timestamp: new Date().toISOString()
          }
        }

        const paddleAPI = new (await import('@/lib/paddle-config')).PaddleAPI()
        const session = await paddleAPI.createCheckoutSession(testData)
        
        results.push({
          domain,
          success: true,
          sessionId: session?.id || session?.data?.id,
          checkoutUrl: session?.checkout_url || session?.url || session?.redirect_url,
          message: 'Checkout session created successfully'
        })
        
      } catch (error) {
        console.log(`Domain ${domain} failed:`, error)
        results.push({
          domain,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          errorType: error instanceof Error ? error.constructor.name : typeof error
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Domain approval test completed',
      results,
      config: {
        hasApiKey: !!paddleConfig.apiKey,
        hasPriceId: !!paddleConfig.priceId,
        environment: paddleConfig.environment,
        baseUrl: paddleConfig.baseUrl
      }
    })

  } catch (error) {
    console.error('Domain test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}
