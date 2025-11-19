export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { paddleConfig } from '@/lib/paddle-config'

export async function GET(request: NextRequest) {
  try {
    // Return configuration status (without sensitive data)
    return NextResponse.json({
      success: true,
      config: {
        hasApiKey: !!paddleConfig.apiKey,
        hasClientToken: !!paddleConfig.clientToken,
        hasWebhookSecret: !!paddleConfig.webhookSecret,
        hasPriceId: !!paddleConfig.priceId,
        environment: paddleConfig.environment,
        priceId: paddleConfig.priceId,
        apiKeyPrefix: paddleConfig.apiKey ? paddleConfig.apiKey.substring(0, 10) + '...' : 'Not set',
        clientTokenPrefix: paddleConfig.clientToken ? paddleConfig.clientToken.substring(0, 10) + '...' : 'Not set'
      },
      message: 'Paddle configuration loaded successfully'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

