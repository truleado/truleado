import { NextResponse } from 'next/server'
import { paddleConfig } from '@/lib/paddle-config'

export async function GET() {
  try {
    // Test the checkout URL format
    const testUrl = `https://buy.paddle.com/product/${paddleConfig.productId}?` +
      `customer_email=test@example.com&` +
      `customer_id=test-user-id&` +
      `return_url=${encodeURIComponent('http://localhost:3000/billing/success')}&` +
      `cancel_url=${encodeURIComponent('http://localhost:3000/billing/cancel')}`
    
    return NextResponse.json({
      productId: paddleConfig.productId,
      environment: paddleConfig.environment,
      testUrl: testUrl,
      message: 'Check if this URL works in browser'
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to generate test URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
