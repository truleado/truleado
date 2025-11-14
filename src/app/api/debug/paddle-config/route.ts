export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { paddleConfig, PaddleAPI } from '@/lib/paddle-config'

export async function GET(request: NextRequest) {
  try {
    const paddleAPI = new PaddleAPI()
    
    // Test API connection
    let apiTest = { success: false, error: null }
    try {
      // Try to get a price to test API connectivity
      const price = await paddleAPI.getPrice(paddleConfig.priceId)
      apiTest = { success: true, error: null }
    } catch (error) {
      apiTest = { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }

    return NextResponse.json({
      config: {
        hasApiKey: !!paddleConfig.apiKey,
        hasClientToken: !!paddleConfig.clientToken,
        hasWebhookSecret: !!paddleConfig.webhookSecret,
        hasPriceId: !!paddleConfig.priceId,
        environment: paddleConfig.environment,
        baseUrl: paddleConfig.baseUrl,
        priceIdValue: paddleConfig.priceId
      },
      apiTest,
      recommendations: {
        recurring: 'Ensure your Paddle price is configured as "Recurring" with monthly billing cycle',
        webhook: 'Set up webhook endpoint in Paddle Dashboard to receive subscription events',
        price: 'Verify the price ID exists and is active in your Paddle account'
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to check Paddle configuration',
      config: {
        hasApiKey: !!paddleConfig.apiKey,
        hasClientToken: !!paddleConfig.clientToken,
        hasWebhookSecret: !!paddleConfig.webhookSecret,
        hasPriceId: !!paddleConfig.priceId,
        environment: paddleConfig.environment,
        baseUrl: paddleConfig.baseUrl,
        priceIdValue: paddleConfig.priceId
      }
    }, { status: 500 })
  }
}
