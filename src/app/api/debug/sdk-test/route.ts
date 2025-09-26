import { NextRequest, NextResponse } from 'next/server'
import { paddleAPI } from '@/lib/paddle-config'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Paddle SDK...')
    
    const apiKey = process.env.PADDLE_API_KEY
    const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID
    
    if (!apiKey || !priceId) {
      return NextResponse.json({
        success: false,
        error: 'Missing API key or price ID',
        config: {
          hasApiKey: !!apiKey,
          hasPriceId: !!priceId
        }
      })
    }

    console.log('Testing price retrieval with SDK...')
    
    try {
      const price = await paddleAPI.getPrice(priceId)
      console.log('✅ Price retrieved successfully:', price)
      
      return NextResponse.json({
        success: true,
        message: 'Paddle SDK working correctly',
        price: {
          id: price.id,
          type: price.type,
          billingCycle: price.billingCycle,
          status: price.status
        }
      })
      
    } catch (sdkError) {
      console.error('❌ SDK error:', sdkError)
      
      return NextResponse.json({
        success: false,
        error: 'SDK test failed',
        details: sdkError instanceof Error ? sdkError.message : 'Unknown error',
        stack: sdkError instanceof Error ? sdkError.stack : undefined
      })
    }

  } catch (error) {
    console.error('Test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
