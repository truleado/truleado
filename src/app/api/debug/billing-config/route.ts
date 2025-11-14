export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { paddleConfig } from '@/lib/paddle-config'

export async function GET(request: NextRequest) {
  try {
    // Return billing configuration status (without sensitive data)
    return NextResponse.json({
      hasApiKey: !!paddleConfig.apiKey,
      hasClientToken: !!paddleConfig.clientToken,
      hasWebhookSecret: !!paddleConfig.webhookSecret,
      hasPriceId: !!paddleConfig.priceId,
      environment: paddleConfig.environment,
      baseUrl: paddleConfig.baseUrl,
      // Show partial values for debugging (first 8 chars + ...)
      apiKeyPreview: paddleConfig.apiKey ? `${paddleConfig.apiKey.substring(0, 8)}...` : 'Not set',
      clientTokenPreview: paddleConfig.clientToken ? `${paddleConfig.clientToken.substring(0, 8)}...` : 'Not set',
      priceIdPreview: paddleConfig.priceId ? `${paddleConfig.priceId.substring(0, 8)}...` : 'Not set',
      webhookSecretPreview: paddleConfig.webhookSecret ? `${paddleConfig.webhookSecret.substring(0, 8)}...` : 'Not set'
    })
  } catch (error) {
    console.error('Error fetching billing config:', error)
    return NextResponse.json({ 
      error: 'Failed to load billing configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
