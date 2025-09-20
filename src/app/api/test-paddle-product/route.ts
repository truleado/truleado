import { NextResponse } from 'next/server'
import { paddleConfig } from '@/lib/paddle-config'

export async function GET() {
  try {
    // Test if the product ID is valid by trying to access it directly
    const productId = paddleConfig.productId
    const environment = paddleConfig.environment
    
    // Try different approaches to test the product
    const testUrls = [
      // Direct product access
      `https://sandbox-checkout.paddle.com/product/${productId}`,
      `https://checkout.paddle.com/product/${productId}`,
      `https://buy.paddle.com/product/${productId}`,
      
      // Alternative formats
      `https://sandbox-checkout.paddle.com/checkout/${productId}`,
      `https://checkout.paddle.com/checkout/${productId}`,
      
      // Price-based checkout (if you have a price ID)
      `https://sandbox-checkout.paddle.com/checkout?price_id=${paddleConfig.priceId}`,
      `https://checkout.paddle.com/checkout?price_id=${paddleConfig.priceId}`,
    ]
    
    return NextResponse.json({
      productId,
      priceId: paddleConfig.priceId,
      environment,
      testUrls,
      message: 'Test these URLs to see which one works. If none work, the product might not be properly configured in Paddle.',
      troubleshooting: [
        'Check if the product is published in Paddle dashboard',
        'Verify the product ID is correct',
        'Make sure the product is set to "Active" status',
        'Check if the product has a valid price attached',
        'Verify the product is in the correct environment (sandbox vs production)'
      ]
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to generate test URLs',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
