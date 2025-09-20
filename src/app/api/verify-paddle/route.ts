import { NextResponse } from 'next/server'
import { paddleConfig } from '@/lib/paddle-config'

export async function GET() {
  try {
    // Test different Paddle URL formats
    const productId = paddleConfig.productId
    const environment = paddleConfig.environment
    
    // Format 1: Standard buy.paddle.com
    const url1 = `https://buy.paddle.com/product/${productId}`
    
    // Format 2: With customer info
    const url2 = `https://buy.paddle.com/product/${productId}?customer_email=test@example.com`
    
    // Format 3: Checkout.paddle.com (alternative)
    const url3 = `https://checkout.paddle.com/product/${productId}`
    
    // Format 4: Sandbox specific
    const url4 = environment === 'sandbox' 
      ? `https://sandbox-checkout.paddle.com/product/${productId}`
      : `https://checkout.paddle.com/product/${productId}`
    
    return NextResponse.json({
      productId,
      environment,
      urls: {
        buy_paddle: url1,
        buy_paddle_with_email: url2,
        checkout_paddle: url3,
        environment_specific: url4
      },
      message: 'Test these URLs to see which one works'
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to generate test URLs',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
