import { NextRequest, NextResponse } from 'next/server'
import { paddleConfig } from '@/lib/paddle-config'

export async function GET(request: NextRequest) {
  try {
    // Test Paddle configuration
    const config = {
      vendorId: paddleConfig.vendorId ? 'Set' : 'Missing',
      apiKey: paddleConfig.apiKey ? 'Set' : 'Missing',
      productId: paddleConfig.productId ? 'Set' : 'Missing',
      priceId: paddleConfig.priceId ? 'Set' : 'Missing',
      environment: paddleConfig.environment,
      webhookSecret: paddleConfig.webhookSecret ? 'Set' : 'Missing',
    }

    return NextResponse.json({
      message: 'Paddle configuration test',
      config,
      environment: process.env.NODE_ENV,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    })
  } catch (error) {
    console.error('Paddle test error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Test failed'
    }, { status: 500 })
  }
}