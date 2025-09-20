import { NextResponse } from 'next/server'
import { paddleConfig } from '@/lib/paddle-config'

export async function GET() {
  try {
    // Test the new approved domain checkout URL format
    const baseUrl = paddleConfig.environment === 'sandbox' 
      ? 'https://brewprompts.com/billing'
      : 'https://brewprompts.com/billing'
    
    const testCheckoutUrl = `${baseUrl}?` +
      `price_id=${paddleConfig.priceId}&` +
      `customer_email=test@example.com&` +
      `customer_id=test-user-id&` +
      `return_url=${encodeURIComponent('http://localhost:3000/billing/success')}&` +
      `cancel_url=${encodeURIComponent('http://localhost:3000/billing/cancel')}`
    
    return NextResponse.json({
      message: 'New price-based checkout URL format',
      productId: paddleConfig.productId,
      priceId: paddleConfig.priceId,
      environment: paddleConfig.environment,
      testUrl: testCheckoutUrl,
      instructions: 'Test this URL to see if it works better than the product-based format'
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to generate test URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
