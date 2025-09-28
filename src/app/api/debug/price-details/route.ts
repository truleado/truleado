import { NextRequest, NextResponse } from 'next/server'
import { PaddleAPI } from '@/lib/paddle-config'

export async function GET(request: NextRequest) {
  try {
    const paddleAPI = new PaddleAPI()
    
    // Get price details
    const price = await paddleAPI.getPrice(process.env.NEXT_PUBLIC_PADDLE_PRICE_ID || '')
    
    return NextResponse.json({
      price,
      analysis: {
        isRecurring: price.type === 'recurring' || (price.billingCycle && price.billingCycle.interval),
        hasBillingCycle: !!price.billingCycle,
        billingInterval: price.billingCycle?.interval || 'N/A',
        billingPeriod: price.billingCycle?.frequency || 'N/A',
        priceType: price.type,
        status: price.status
      },
      recommendations: price.type !== 'recurring' ? [
        'This price is not configured for recurring billing',
        'Go to Paddle Dashboard → Catalog → Products',
        'Edit this price and set it to "Recurring" with "Monthly" billing',
        'Or create a new recurring price and update NEXT_PUBLIC_PADDLE_PRICE_ID'
      ] : [
        'Price is correctly configured for recurring billing',
        'Webhook events should work properly',
        'Next billing date will be calculated automatically'
      ]
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch price details',
      priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID
    }, { status: 500 })
  }
}
